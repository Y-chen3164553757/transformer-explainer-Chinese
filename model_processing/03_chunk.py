import os
import json

"""Step 3: 按共享配置将 ONNX 模型分片到浏览器静态目录。"""

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "model-config.json"), encoding="utf-8") as f:
    MODEL_CONFIG = json.load(f)

SRC_FILE   = os.path.join(
    BASE_DIR,
    MODEL_CONFIG["paths"]["onnxOutputDir"],
    MODEL_CONFIG["paths"]["onnxFileName"]
)
DST_DIR    = os.path.join(BASE_DIR, MODEL_CONFIG["paths"]["staticModelDir"])
CHUNK_SIZE = MODEL_CONFIG["runtime"]["chunkSizeBytes"]
CHUNK_PREFIX = MODEL_CONFIG["paths"]["chunkFilePrefix"]

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
        out_path = os.path.join(DST_DIR, f"{CHUNK_PREFIX}{i}")
        with open(out_path, "wb") as out:
            out.write(chunk)
        i += 1

print(f"分片完成：共 {i} 片")
expected_chunk_total = MODEL_CONFIG["runtime"]["chunkTotal"]
if i != expected_chunk_total:
    print(f"\n>>> 警告: 实际分片数 {i} 与 model-config.json 中 chunkTotal={expected_chunk_total} 不一致")
else:
    print("\n>>> 分片数已与前端共享配置对齐，无需手动修改代码")
