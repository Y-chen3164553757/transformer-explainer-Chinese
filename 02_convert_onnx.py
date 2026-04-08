"""Step 2: 使用共享配置将中文 GPT-2 转换为前端兼容的 ONNX。"""

import sys, os, json
import numpy as np
import torch
import torch.nn as nn

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "model-config.json"), encoding="utf-8") as f:
    MODEL_CONFIG = json.load(f)

MODEL_DIR  = os.path.join(BASE_DIR, MODEL_CONFIG["paths"]["localModelDir"])
OUTPUT_DIR = os.path.join(BASE_DIR, MODEL_CONFIG["paths"]["onnxOutputDir"])
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 复用项目内已有的自定义 nanoGPT 架构（原英文模型已用此架构成功导出）
# model.py 使用手动 Attention，无 SDPA/KV-Cache/aten::diff，opset=11 完全兼容
sys.path.insert(0, os.path.join(BASE_DIR, "src", "utils", "model"))
from model import GPT, GPTConfig

# ── 1. 读取中文模型配置 ────────────────────────────────────────────
with open(os.path.join(MODEL_DIR, "config.json")) as f:
    cfg = json.load(f)

N_LAYER = cfg["n_layer"]    # 12
N_HEAD  = cfg["n_head"]     # 12
N_EMBD  = cfg["n_embd"]     # 768
VOCAB   = cfg["vocab_size"] # 21128
print(f"模型配置: {N_LAYER}层 / {N_HEAD}头 / {N_EMBD}维 / vocab={VOCAB}")

expected = MODEL_CONFIG["runtime"]
assert N_LAYER == expected["layerCount"], f"层数不匹配: {N_LAYER} != {expected['layerCount']}"
assert N_HEAD == expected["headCount"], f"头数不匹配: {N_HEAD} != {expected['headCount']}"
assert N_EMBD == expected["embeddingDim"], f"维度不匹配: {N_EMBD} != {expected['embeddingDim']}"
assert VOCAB == expected["vocabSize"], f"词表大小不匹配: {VOCAB} != {expected['vocabSize']}"

# ── 2. 创建 nanoGPT 骨架并加载中文权重 ───────────────────────────
print("\n1/3  加载权重并导出 ONNX...")
print(f"     输入: {MODEL_DIR}")
print(f"     输出: {OUTPUT_DIR}\n")

config = GPTConfig(
    vocab_size = VOCAB,
    block_size = 1024,
    n_layer    = N_LAYER,
    n_head     = N_HEAD,
    n_embd     = N_EMBD,
    dropout    = 0.0,
    bias       = True,
)
model = GPT(config)

from transformers import GPT2LMHeadModel
model_hf = GPT2LMHeadModel.from_pretrained(MODEL_DIR)
sd_hf    = model_hf.state_dict()

# OpenAI/HuggingFace 用 Conv1D，nanoGPT 用 Linear，这 4 组权重需要转置
transposed = [
    "attn.c_attn.weight", "attn.c_proj.weight",
    "mlp.c_fc.weight",    "mlp.c_proj.weight",
]
loaded = 0
for name, param in model.named_parameters():
    if name.endswith(".attn.bias"):
        continue  # causal mask buffer，跳过
    if name not in sd_hf:
        # lm_head.weight 与 wte.weight 权重共享，HF 有时不单独存
        if name == "lm_head.weight" and "transformer.wte.weight" in sd_hf:
            with torch.no_grad():
                param.copy_(sd_hf["transformer.wte.weight"])
            loaded += 1
        else:
            print(f"  SKIP (not in checkpoint): {name}")
        continue
    with torch.no_grad():
        if any(name.endswith(w) for w in transposed):
            assert sd_hf[name].shape[::-1] == tuple(param.shape), \
                f"shape mismatch after transpose: {name}"
            param.copy_(sd_hf[name].t())
        else:
            assert sd_hf[name].shape == param.shape, \
                f"shape mismatch: {name} {sd_hf[name].shape} vs {param.shape}"
            param.copy_(sd_hf[name])
    loaded += 1

print(f"  已加载 {loaded} 个权重张量")
del model_hf, sd_hf
model.eval()

# ── 3. Wrapper：与 export_to_onnx.py 完全一致 ────────────────────
class wrapper(nn.Module):
    def __init__(self, m):
        super().__init__()
        self.model     = m
        self.layer_num = m.config.n_layer
        self.head_num  = m.config.n_head

    def forward(self, input):
        outputs   = self.model(input)
        extracted = []
        for i in range(self.layer_num):
            for j in range(self.head_num):
                extracted.extend([
                    outputs["block"][f"block_{i}"]["attn"][f"head_{j}"]["attn"],
                    outputs["block"][f"block_{i}"]["attn"][f"head_{j}"]["attn_scaled"],
                    outputs["block"][f"block_{i}"]["attn"][f"head_{j}"]["attn_masked"],
                    outputs["block"][f"block_{i}"]["attn"][f"head_{j}"]["attn_softmax"],
                    outputs["block"][f"block_{i}"]["attn"][f"head_{j}"]["attn_dropout"],
                ])
        extracted.append(outputs["linear"]["output"])
        return tuple(extracted)

wrapped = wrapper(model)

# ── 4. 输出名与英文模型完全一致 ──────────────────────────────────
output_names = [
    f"block_{i}_attn_head_{j}_{suffix}"
    for i in range(N_LAYER)
    for j in range(N_HEAD)
    for suffix in ["attn", "attn_scaled", "attn_masked", "attn_softmax", "attn_dropout"]
]
output_names.append("linear_output")

# ── 5. 导出 ONNX（opset=11, dynamo=False, TorchScript 路径）──────
onnx_path   = os.path.join(OUTPUT_DIR, MODEL_CONFIG["paths"]["onnxFileName"])
dummy_input = torch.tensor([[791, 2158, 1990, 5057, 2167]])  # 随意 5 个 token

with torch.no_grad():
    torch.onnx.export(
        wrapped,
        dummy_input,
        onnx_path,
        export_params       = True,
        opset_version       = 11,
        do_constant_folding = True,
        dynamo              = False,  # 强制 TorchScript，绕过 torch.export/dynamo
        input_names         = ["input"],
        output_names        = output_names,
        dynamic_axes        = {
            "input": {0: "batch", 1: "seq"},
            **{
                name: {0: "batch", 1: "seq", 2: "seq2"}
                for name in output_names if name != "linear_output"
            },
            "linear_output": {0: "batch", 1: "seq"},
        },
    )

size_mb = os.path.getsize(onnx_path) / 1024 / 1024
print(f"\n  OK  导出成功  大小: {size_mb:.1f} MB")

# ── 2/3. 验证推理 ─────────────────────────────────────────────────
print("\n2/3  验证 ONNX 推理...")
import onnxruntime as ort
from transformers import BertTokenizer

tokenizer   = BertTokenizer.from_pretrained(MODEL_DIR)
sample_text = "人工智能"
ids         = tokenizer.encode(sample_text, add_special_tokens=False)
input_np    = np.array([ids], dtype=np.int64)

sess    = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
results = sess.run(["linear_output"], {"input": input_np})

next_id  = int(np.argmax(results[0][0, -1]))
next_tok = tokenizer.convert_ids_to_tokens([next_id])[0]
print(f"  输入: '{sample_text}'  -> 预测下一个 token: '{next_tok}' (id={next_id})")

# ── 3/3. 输出文件列表 ─────────────────────────────────────────────
print("\n3/3  输出文件列表:")
for fname in sorted(os.listdir(OUTPUT_DIR)):
    fp = os.path.join(OUTPUT_DIR, fname)
    if os.path.isfile(fp):
        print(f"  {fname:40s}  {os.path.getsize(fp)/1024/1024:.1f} MB")

print("\nDone! 下一步：运行 src/utils/model/chunk.py 分片")
