"""
下载 uer/gpt2-chinese-cluecorpussmall (L=12, H=768)
模型地址: https://huggingface.co/uer/gpt2-chinese-cluecorpussmall
镜像地址: https://hf-mirror.com/uer/gpt2-chinese-cluecorpussmall
"""

import os
from huggingface_hub import snapshot_download

# ✅ 使用本地代理 (端口 10808)
os.environ["HTTP_PROXY"]  = "http://127.0.0.1:10808"
os.environ["HTTPS_PROXY"] = "http://127.0.0.1:10808"

MODEL_ID = "uer/gpt2-chinese-cluecorpussmall"
LOCAL_DIR = os.path.join(os.path.dirname(__file__), "models", "gpt2-chinese-cluecorpussmall")

print(f"正在下载模型: {MODEL_ID}")
print(f"镜像源: https://hf-mirror.com")
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
