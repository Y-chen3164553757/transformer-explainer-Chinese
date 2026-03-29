"""
Step 4: 用中文 ONNX 模型生成 ex0~ex4.js 示例数据
输出格式与原 src/constants/examples/ex*.js 完全一致。
"""

import sys, os, json
import numpy as np

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR  = os.path.join(BASE_DIR, "models", "gpt2-chinese-cluecorpussmall")
ONNX_PATH  = os.path.join(BASE_DIR, "models", "gpt2-chinese-onnx", "model.onnx")
EXAMPLES_DIR = os.path.join(BASE_DIR, "src", "constants", "examples")

sys.path.insert(0, os.path.join(BASE_DIR, "src", "utils", "model"))

import onnxruntime as ort
from transformers import BertTokenizer

tokenizer = BertTokenizer.from_pretrained(MODEL_DIR)
sess = ort.InferenceSession(ONNX_PATH, providers=["CPUExecutionProvider"])

# 获取所有 attention 输出名（与英文模型结构完全一致）
N_LAYER, N_HEAD = 12, 12
attention_keys = [
    f"block_{i}_attn_head_{j}_{suffix}"
    for i in range(N_LAYER)
    for j in range(N_HEAD)
    for suffix in ["attn", "attn_scaled", "attn_masked", "attn_softmax", "attn_dropout"]
]
output_keys = attention_keys + ["linear_output"]

# 5 条中文示例，对应原来的 5 条英文
PROMPTS = [
    "数据可视化帮助用户",
    "人工智能正在改变",
    "当宇宙飞船接近",
    "在荒芜的星球上他们发现了",
    "深度学习技术的",
]

def run_inference(prompt: str):
    ids = tokenizer.encode(prompt, add_special_tokens=False)
    input_np = np.array([ids], dtype=np.int64)
    results = sess.run(output_keys, {"input": input_np})

    # logits: [1, seq, vocab] -> 取最后一个 token 的 logits -> [vocab]
    linear_output = results[-1]          # shape: [1, 1, vocab] or [1, seq, vocab]
    logits = linear_output[0, -1].tolist()

    # attention outputs: 每个 shape [1, seq, seq]，转为 list
    outputs = {}
    for key, arr in zip(attention_keys, results[:-1]):
        outputs[key] = arr[0].tolist()   # shape [seq, seq]

    # token 字符串（单字分开，不加空格）
    tokens = [tokenizer.convert_ids_to_tokens([id_])[0] for id_ in ids]

    # 计算 probabilities 和 sampled（对齐前端 topKSampling 逻辑）
    temperature = 0.8
    k = 5
    max_display = 50

    sorted_logits = sorted(enumerate(logits), key=lambda x: -x[1])[:max_display]

    scaled = [(tid, lg, lg / temperature) for tid, lg in sorted_logits]

    # top-k filter
    filtered = [
        (tid, lg, sl, sl if rank < k else float('-inf'))
        for rank, (tid, lg, sl) in enumerate(scaled)
    ]

    # softmax on topKLogit
    top_k_vals = [tkl for _, _, _, tkl in filtered]
    max_v = max(top_k_vals)
    exps = [np.exp(v - max_v) for v in top_k_vals]
    sum_exp = sum(exps)
    probs = [e / sum_exp for e in exps]

    probabilities = []
    for rank, ((tid, lg, sl, tkl), exp_v, prob) in enumerate(zip(filtered, exps, probs)):
        tok_str = tokenizer.convert_ids_to_tokens([tid])[0]
        probabilities.append({
            "tokenId": tid,
            "logit": lg,
            "scaledLogit": sl,
            "topKLogit": tkl,
            "rank": rank,
            "token": tok_str,
            "expLogit": exp_v,
            "probability": prob,
        })

    # sample from top-k
    top_k_probs = [p["probability"] for p in probabilities[:k]]
    top_k_sum = sum(top_k_probs)
    top_k_norm = [p / top_k_sum for p in top_k_probs]
    sampled_idx = int(np.random.choice(k, p=top_k_norm))
    sampled = probabilities[sampled_idx]

    return {
        "prompt": prompt,
        "tokens": tokens,
        "tokenIds": ids,
        "logits": logits,
        "outputs": outputs,
        "probabilities": probabilities,
        "sampled": sampled,
    }

def fmt_val(v: float) -> str:
    """将 Python float 转为合法 JS 数值字符串，处理 inf/-inf/nan。"""
    if v == float('inf'):
        return 'Infinity'
    if v == float('-inf'):
        return '-Infinity'
    if v != v:  # nan
        return 'NaN'
    return f"{v:.6f}"

def fmt_prob(p: dict) -> str:
    """将 Probability 对象序列化为 JS 对象字面量。"""
    return (
        "{\n"
        f"\t\t\ttokenId: {p['tokenId']},\n"
        f"\t\t\tlogit: {fmt_val(p['logit'])},\n"
        f"\t\t\tscaledLogit: {fmt_val(p['scaledLogit'])},\n"
        f"\t\t\ttopKLogit: {fmt_val(p['topKLogit'])},\n"
        f"\t\t\trank: {p['rank']},\n"
        f"\t\t\ttoken: {json.dumps(p['token'], ensure_ascii=False)},\n"
        f"\t\t\texpLogit: {fmt_val(p['expLogit'])},\n"
        f"\t\t\tprobability: {fmt_val(p['probability'])}\n"
        "\t\t}"
    )

def write_js(idx: int, data: dict):
    var_name = f"ex{idx}"
    out_path = os.path.join(EXAMPLES_DIR, f"ex{idx}.js")

    # outputs 对象序列化
    outputs_lines = []
    for key, matrix in data["outputs"].items():
        # matrix: list of list (seq x seq)
        rows_str = ",\n\t\t\t\t".join(
            "[" + ", ".join(fmt_val(v) for v in row) + "]"
            for row in matrix
        )
        outputs_lines.append(f'\t\t"{key}": {{\n\t\t\t"data": [\n\t\t\t\t{rows_str}\n\t\t\t]\n\t\t}}')
    outputs_str = ",\n".join(outputs_lines)

    logits_str = ", ".join(f"{v:.6f}" for v in data["logits"])
    tokens_str = ", ".join(json.dumps(t, ensure_ascii=False) for t in data["tokens"])
    token_ids_str = ", ".join(str(id_) for id_ in data["tokenIds"])
    prompt_str = json.dumps(data["prompt"], ensure_ascii=False)

    probs_str = ",\n\t\t".join(fmt_prob(p) for p in data["probabilities"])
    sampled_str = fmt_prob(data["sampled"])

    js = f"""export const {var_name} = {{
\tprompt: {prompt_str},
\ttokens: [{tokens_str}],
\ttokenIds: [{token_ids_str}],
\tlogits: [
\t\t{logits_str}
\t],
\toutputs: {{
{outputs_str}
\t}},
\tprobabilities: [
\t\t{probs_str}
\t],
\tsampled: {sampled_str}
}};
"""
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"  写入 ex{idx}.js  prompt='{data['prompt']}'  tokens={data['tokens']}")

print("生成中文示例数据...\n")
for i, prompt in enumerate(PROMPTS):
    print(f"[{i+1}/5] 推理: {prompt}")
    data = run_inference(prompt)
    write_js(i, data)

# 同时更新 index.js（re-export 不变，仅确认）
index_path = os.path.join(EXAMPLES_DIR, "index.js")
with open(index_path, "r", encoding="utf-8") as f:
    content = f.read()
print(f"\nindex.js 内容已确认（无需修改）:\n{content}")

print("\nDone! ex0~ex4.js 已更新为中文示例数据")
