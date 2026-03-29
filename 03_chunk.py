"""
Step 3: 将中文 GPT-2 ONNX 模型分片，存入 static/model-v2-chinese/
分片大小与原英文模型一致（10MB/片），前端加载逻辑只需修改目录和片数。
"""

import os

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
SRC_FILE   = os.path.join(BASE_DIR, "models", "gpt2-chinese-onnx", "model.onnx")
DST_DIR    = os.path.join(BASE_DIR, "static", "model-v2-chinese")
CHUNK_SIZE = 10 * 1024 * 1024  # 10 MB，与原项目一致

os.makedirs(DST_DIR, exist_ok=True)

total_size = os.path.getsize(SRC_FILE)
print(f"源文件: {SRC_FILE}")
print(f"大小:   {total_size / 1024 / 1024:.1f} MB")
print(f"目标:   {DST_DIR}")
print(f"分片:   {CHUNK_SIZE // 1024 // 1024} MB/片\n")

i = 0
with open(SRC_FILE, "rb") as f:
    while True:
        chunk = f.read(CHUNK_SIZE)
        if not chunk:
            break
        out_path = os.path.join(DST_DIR, f"gpt2.onnx.part{i}")
        with open(out_path, "wb") as out:
            out.write(chunk)
        i += 1

print(f"分片完成：共 {i} 片")
print(f"\n>>> 请将前端代码中的 chunkTotal 改为 {i}")
print(f">>> 模型目录改为 model-v2-chinese/")
