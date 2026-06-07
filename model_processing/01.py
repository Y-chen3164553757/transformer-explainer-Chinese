import os
import json
from huggingface_hub import snapshot_download

"""下载共享配置中指定的中文 GPT-2 模型。"""

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "model-config.json"), encoding="utf-8") as f:
    MODEL_CONFIG = json.load(f)

proxy_cfg = MODEL_CONFIG.get("proxy", {})
if proxy_cfg.get("http"):
    os.environ["HTTP_PROXY"] = proxy_cfg["http"]
if proxy_cfg.get("https"):
    os.environ["HTTPS_PROXY"] = proxy_cfg["https"]

MODEL_ID = MODEL_CONFIG["modelId"]
LOCAL_DIR = os.path.join(BASE_DIR, MODEL_CONFIG["paths"]["localModelDir"])

print(f"正在下载模型: {MODEL_ID}")
print(f"镜像源: {MODEL_CONFIG['hfMirror']}")
print(f"保存路径: {LOCAL_DIR}\n")

snapshot_download(
    repo_id=MODEL_ID,
    local_dir=LOCAL_DIR,
    ignore_patterns=["*.msgpack", "*.h5", "flax_model*"],  # 只保留 PyTorch 权重
)

print("\n✅ 下载完成！")
print("文件列表:")
for f in sorted(os.listdir(LOCAL_DIR)):
    fpath = os.path.join(LOCAL_DIR, f)
    if os.path.isfile(fpath):
        size = os.path.getsize(fpath) / 1024 / 1024
        print(f"  {f:45s}  {size:.1f} MB")
