# 方案 A：快速替换模型方案（推荐）

## 📋 方案概述

**目标**：直接替换现有项目的模型为中文 GPT-2，保持架构不变，最小化改动

**工作量**：1-2 天  
**成功率**：85-90%  
**推荐指数**：⭐⭐⭐⭐⭐

---

## ✅ 核心优势

| 优势 | 说明 |
|------|------|
| **架构通用** | 中文 GPT-2 与原项目架构完全相同（12 层、12 头） |
| **快速实施** | 只需替换 tokenizer、模型文件和示例数据 |
| **可视化复用** | 所有可视化组件无需改动，逻辑完全通用 |
| **学习成本低** | 无需重构，理解成本最小 |
| **时间节约** | 相比方案 B 节省 5-7 天 |

---

## 🚀 详细implementation步骤

### **第 1 步：选择中文 GPT-2 模型（2-4 小时）**

#### 1.1 候选模型

> 以下地址均来自 HuggingFace 官方，由 UER (腾讯 NLP 团队) 维护
> 搜索页面: https://huggingface.co/models?language=zh&pipeline_tag=text-generation&search=gpt2

```
推荐顺序：

1️⃣ 首选（推荐）：uer/gpt2-chinese-cluecorpussmall
   └─ 官方地址: https://huggingface.co/uer/gpt2-chinese-cluecorpussmall
   └─ GitHub:   https://github.com/dbiir/UER-py
   └─ 大小: ~150MB
   └─ 层数: 12
   └─ 特点: UER 官方出品，CLUE 语料训练，质量稳定

2️⃣ 备选（更轻量）：uer/gpt2-distil-chinese-cluecorpussmall
   └─ 官方地址: https://huggingface.co/uer/gpt2-distil-chinese-cluecorpussmall
   └─ 大小: ~80MB
   └─ 层数: 6 (蒸馏版)
   └─ 特点: 更快推理，大小减半，适合浏览器部署

3️⃣ 备选（更大、质量更高）：uer/gpt2-large-chinese-cluecorpussmall
   └─ 官方地址: https://huggingface.co/uer/gpt2-large-chinese-cluecorpussmall
   └─ 大小: ~350MB (相对较大)
   └─ 层数: 36
   └─ 特点: 质量更高，但不适合浏览器直接运行
```

#### 1.2 下载并验证

```bash
# 使用 huggingface_hub 下载
pip install huggingface_hub

python -c "
from huggingface_hub import snapshot_download
model_id = 'uer/gpt2-chinese-cluecorpussmall'
snapshot_download(repo_id=model_id, cache_dir='./models')
"

# 检查模型文件
ls -la ./models/models--ycleptKnight--gpt2-chinese-small/snapshots/*/
# 输出应包含：
# - pytorch_model.bin (或 .safetensors)
# - config.json
# - tokenizer.json
# - vocab.txt
```

---

### **第 2 步：转换为 ONNX 格式（2-3 小时）**

#### 2.1 准备转换环境

```bash
# 安装必要的工具
pip install transformers torch onnx onnxruntime optimum[onnxruntime]

# 验证版本
python -c "import optimum; print(optimum.__version__)"
```

#### 2.2 转换脚本

```python
# convert_gpt2_to_onnx.py
from optimum.onnxruntime import ORTModelForCausalLM
from transformers import AutoTokenizer
import torch

model_id = "uer/gpt2-chinese-cluecorpussmall"
output_dir = "./gpt2_chinese_onnx"

# 加载模型
model = ORTModelForCausalLM.from_pretrained(
    model_id,
    export=True,  # 自动转换为 ONNX
    use_io_binding=True  # 优化推理性能
)

# 保存转换后的模型
model.save_pretrained(output_dir)

# 同时保存 tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_id)
tokenizer.save_pretrained(output_dir)

print(f"✅ 转换完成！输出路径: {output_dir}")
```

#### 2.3 验证转换

```python
# verify_onnx.py
from optimum.onnxruntime import ORTModelForCausalLM
from transformers import AutoTokenizer

model_dir = "./gpt2_chinese_onnx"

# 加载并测试
model = ORTModelForCausalLM.from_pretrained(model_dir)
tokenizer = AutoTokenizer.from_pretrained(model_dir)

# 测试推理
text = "你好，我是"
inputs = tokenizer(text, return_tensors="pt")
outputs = model.generate(**inputs, max_length=20)
result = tokenizer.decode(outputs[0])

print(f"输入: {text}")
print(f"输出: {result}")
```

---

### **第 3 步：生成示例数据（2-3 小时）**

#### 3.1 运行推理脚本生成所有示例

```python
# generate_examples.py
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import json

model_id = "uer/gpt2-chinese-cluecorpussmall"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)

# 中文示例提示词
examples = [
    "数据可视化赋予用户",
    "人工智能正在改变",
    "当宇宙飞船接近",
    "在荒凉的星球上他们发现了",
    "IEEE VIS 会议强调了"
]

def generate_example_data(prompt):
    """生成单个示例的完整推理数据"""
    inputs = tokenizer(prompt, return_tensors="pt")
    
    # 获取模型的详细输出
    outputs = model(
        input_ids=inputs["input_ids"],
        output_hidden_states=True,
        output_attentions=True
    )
    
    # 提取关键数据
    tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
    token_ids = inputs["input_ids"][0].tolist()
    
    # 预测下一个 token
    logits = outputs.logits[0, -1, :]
    probs = torch.softmax(logits, dim=-1)
    top_k = torch.topk(probs, k=10)
    
    return {
        "prompt": prompt,
        "tokens": tokens,
        "tokenIds": token_ids,
        "predicted": {
            "token": tokenizer.decode([top_k.indices[0]]),
            "prob": top_k.values[0].item(),
            "topK": [
                {
                    "token": tokenizer.decode([idx]),
                    "prob": prob.item()
                }
                for idx, prob in zip(top_k.indices, top_k.values)
            ]
        }
    }

# 生成所有示例
all_examples = {}
for idx, prompt in enumerate(examples):
    example_data = generate_example_data(prompt)
    all_examples[f"ex{idx}"] = example_data
    print(f"✅ 生成示例 {idx}: {prompt}")

# 保存为 JSON
with open("examples_output.json", "w", encoding="utf-8") as f:
    json.dump(all_examples, f, ensure_ascii=False, indent=2)

print("\n✅ 所有示例已生成！")
```

#### 3.2 转换为项目格式

```javascript
// 生成的输出格式应该是这样的:
// src/constants/examples/ex0.js

export const ex0 = {
    prompt: "数据可视化赋予用户",
    tokens: ["数", "据", "可", "视", "化", "赋", "予", "用", "户"],
    tokenIds: [123, 456, 789, ...],
    // ... 更多推理数据
};
```

---

### **第 4 步：修改源代码（1-2 小时）**

#### 4.1 更新 Tokenizer

**文件：`src/routes/+page.svelte`**

```svelte
// 改前
const gpt2Tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt2');

// 改后（使用 Xenova 的中文 tokenizer）
const gpt2Tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt2-chinese');
// 或者如果没有 Xenova 版本，使用自定义 tokenizer
```

#### 4.2 更新模型加载路径

**文件：`src/routes/+page.svelte`**

```typescript
// 改前
const chunkNum = 63; // GPT-2 原版分片数
const chunkUrls = Array(chunkNum)
    .fill(0)
    .map((d, i) => `${base}/model-v2/gpt2.onnx.part${i}`);

// 改后（中文模型可能不同）
const chunkNum = 63; // or 根据实际中文模型调整
const chunkUrls = Array(chunkNum)
    .fill(0)
    .map((d, i) => `${base}/model-v2-chinese/gpt2-chinese.onnx.part${i}`);
```

#### 4.3 更新存储中的初始示例

**文件：`src/store/index.ts`**

```typescript
// 改前
import { ex0, ex1, ex2, ex3, ex4 } from '~/constants/examples';

// 改后（导入新的中文示例）
import { ex0, ex1, ex2, ex3, ex4 } from '~/constants/examples';
// 内容自动更新，无需改动导入

export const inputTextExample = [
    '数据可视化赋予用户',  // 改了
    '人工智能正在改变',     // 改了
    '当宇宙飞船接近',       // 改了
    '在荒凉的星球上他们发现了',  // 改了
    'IEEE VIS 会议强调了'   // 改了
];
```

#### 4.4 更新教科书中的示例

**文件：`src/utils/textbookPages.ts`（搜索并更新所有涉及 token 的示例）**

```typescript
// 找到这样的内容:
// "The word 'visualization' is tokenized into ['visual', 'ization']"

// 改为:
// "词语 '可视化' 被分词为 ['可', '视', '化']"
```

---

### **第 5 步：替换模型文件（1-2 小时）**

#### 5.1 准备模型文件

```bash
# 从 ONNX 转换的输出中获取模型文件
# 假设转换后的文件在 ./gpt2_chinese_onnx/ 目录

# 复制到项目静态文件夹
cp gpt2_chinese_onnx/model.onnx static/model-v2-chinese/gpt2-chinese.onnx

# 或者需要分片的话，使用分片脚本
python chunk_model.py \
    --input gpt2_chinese_onnx/model.onnx \
    --output static/model-v2-chinese/ \
    --chunk_size 5000000  # 5MB per chunk
```

#### 5.2 分片脚本（如果模型较大）

```python
# chunk_model.py
import os

def chunk_onnx_model(input_file, output_dir, chunk_size=5000000):
    """将 ONNX 模型文件分片"""
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    with open(input_file, 'rb') as f:
        data = f.read()
    
    total_size = len(data)
    num_chunks = (total_size + chunk_size - 1) // chunk_size
    
    for i in range(num_chunks):
        start = i * chunk_size
        end = min(start + chunk_size, total_size)
        chunk_data = data[start:end]
        
        chunk_file = os.path.join(output_dir, f'gpt2-chinese.onnx.part{i}')
        with open(chunk_file, 'wb') as f:
            f.write(chunk_data)
        
        print(f"✅ 写入分片 {i}: {len(chunk_data)} 字节")
    
    print(f"\n✅ 总共 {num_chunks} 个分片")

if __name__ == '__main__':
    chunk_onnx_model('gpt2_chinese_onnx/model.onnx', 'static/model-v2-chinese/')
```

---

### **第 6 步：集成测试（1-2 小时）**

#### 6.1 本地测试

```bash
# 启动开发服务器
npm run dev

# 在浏览器中测试：
# 1. 页面是否正常加载
# 2. 模型是否加载成功
# 3. 示例是否有效
# 4. 推理是否正常工作
# 5. UI 显示是否正确
```

#### 6.2 测试清单

- [ ] 页面加载无错误
- [ ] 模型文件下载成功（检查浏览器控制台）
- [ ] Tokenizer 加载正确
- [ ] 5 个示例能正常展示
- [ ] "生成"按钮能正常工作
- [ ] Token 显示正确
- [ ] Attention 矩阵显示正确
- [ ] 所有组件渲染无异常
- [ ] 响应式设计正常

#### 6.3 可能的问题和解决方案

| 问题 | 解决方案 |
|------|--------|
| 模型加载失败 | 检查模型文件路径和格式 |
| Token 显示乱码 | 检查 tokenizer 编码，确认 UTF-8 支持 |
| 推理返回 NaN | 检查模型权重和数值稳定性 |
| 性能太慢 | 使用量化或优化的 ONNX 版本 |
| 内存溢出 | 减小 batch size 或考虑分批推理 |

---

### **第 7 步：汉化界面（可选，额外 1 天）**

如果需要汉化 UI：

```
├─ 建立 i18n 框架      → 2-3 小时
├─ 翻译 UI 文本        → 2-3 小时
├─ 测试              → 1 小时
└─ 总计              → 1 天
```

详见独立的汉化方案文档。

---

## 📊 工作量总结

| 步骤 | 预计时间 | 优先级 |
|------|---------|--------|
| Step 1: 选择和下载模型 | 2-4h | 🔴 必须 |
| Step 2: ONNX 转换 | 2-3h | 🔴 必须 |
| Step 3: 生成示例数据 | 2-3h | 🔴 必须 |
| Step 4: 修改源代码 | 1-2h | 🔴 必须 |
| Step 5: 替换模型文件 | 1-2h | 🔴 必须 |
| Step 6: 集成测试 | 1-2h | 🔴 必须 |
| Step 7: 汉化界面 | 4-6h | 🟢 可选 |
| **总计（必须）** | **10-16h** | - |
| **总计（含汉化）** | **14-22h** | - |

**折合时间：1-2 天（不含汉化）** ✅

---

## ⚠️ 风险分析

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| ONNX 转换失败 | 中 | 高 | 尝试其他转换工具或模型版本 |
| Tokenizer 不兼容 | 低 | 中 | 使用官方中文 tokenizer 或自定义 |
| 推理结果不稳定 | 低 | 中 | 验证权重，使用量化版本 |
| 性能不达预期 | 中 | 中 | 优化 ONNX 配置或拆分计算 |
| 浏览器兼容性 | 低 | 低 | 测试多个浏览器版本 |

**总风险等级：🟢 低** （成功率 85-90%）

---

## 🎯 预期结果

✅ 完成后：
- 项目运行中文 GPT-2 模型
- UI 和可视化完全保留
- 用户体验一致
- 支持中文输入和输出
- 所有现有功能正常工作

❌ 不会改变的：
- 项目架构
- 可视化逻辑
- UI 布局

---

## 📝 检查清单

在开始前，确保你有：

- [ ] Python 3.8+ 环境
- [ ] PyTorch 安装
- [ ] 6GB+ 磁盘空间（模型 + 中间文件）
- [ ] 好的网络连接（模型下载）
- [ ] Node.js 20+ 和 npm
- [ ] VS Code 或类似编辑器

---

## 🚀 何时开始

建议顺序：
1. 先完成 Steps 1-3（准备工作，可以离线进行）
2. 再进行 Steps 4-6（集成和测试）
3. 可选 Step 7（汉化）

**预计总时间：1-2 天** ✅

