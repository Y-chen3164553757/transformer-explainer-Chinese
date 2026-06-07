# 🎓 中文 GPT-2 极限重构最终发布方案 (7000词表 INT4 & 前端可视化接口)

本文件夹包含了本次微型中文 GPT-2 极限压缩项目中最优秀的最终部署模型：**原版 12 层中文 GPT-2 架构下的 7000 常用字词表 INT4 压缩版本**（该模型中已内置集成了中间层注意力权重与隐藏状态的可视化输出接口，以供前端演示使用）。

---

## 📂 目录结构与内容说明

*   **`model/` (模型发布目录)**:
    *   `model_int4.onnx` (71.2 MB): **最终敲定的 12层 GPT-2 / 7000词表 INT4 量化模型**。
        *   不仅可以用于常规的文本生成。
        *   而且**内置集成了全部 26 个可视化输出节点**，前端可以直接提取每一层的自注意力头注意力矩阵和隐藏状态向量进行图表展示。
    *   `vocab.txt`: 7000 常用简体字分词器词表。
*   **`inference.py` (交互推理脚本)**:
    *   交互式文本生成 CLI。运行它即可在命令行输入任意提示词与该 INT4 模型进行生成对话。
*   **`evaluate_10prompts.py` (大考评估脚本)**:
    *   一键运行 10 大核心测试 Prompt 的评测工具，输出模型生成的文本、推理速度与延迟。

---

## 🖥️ 前端可视化接入指南 (Attention & Hidden States)

为了在前端演示中画出**每一层自注意力头 (Query, Key, Value, Softmax)** 的交互连线以及高维特征投影图，我们在该量化模型的前向图中**内置暴露了每一层的激活状态作为输出节点**。

### 1. 模型输出节点结构 (Graph Outputs)
模型共有 **26 个输出节点**：
1.  **`logits`**: 维度 `[batch_size, sequence_length, 7000]` —— 用于预测下一个字符。
2.  **`attentions_0` 到 `attentions_11`** (共 12 层):
    维度 `[batch_size, 12, sequence_length, sequence_length]` —— **自注意力权重矩阵**。
    *   其中维度 `12` 代表原模型的 **12 个注意力头** (Attention Heads)。
    *   矩阵中的每个元素 $A_{h, i, j}$ 代表第 $h$ 个注意力头中，第 $i$ 个 Token 对第 $j$ 个 Token 的注意力关联权重值。非常适合用来绘制自注意力连线图（如 BertViz 样式）。
3.  **`hidden_states_0` 到 `hidden_states_12`** (共 13 层):
    维度 `[batch_size, sequence_length, 768]` —— **各层输出的隐藏状态语义向量**。
    *   其中 `hidden_states_0` 为输入端 768 维的 Embedding 向量。
    *   `hidden_states_12` 为经过全部 12 层 Transformer 计算后的 768 维语义表示向量。适合用来做主成分分析 (PCA) 降维投影或聚类分析。

### 2. 网页端/前端加载示例 (ONNX Runtime Web)
如果您使用 JavaScript/TypeScript 配合 ONNX Runtime Web 在浏览器端直接运行模型，可以通过以下方式读取这些中间激活状态进行画图展示：

```javascript
import * as ort from 'onnxruntime-web';

// 1. 创建 Session 载入量化后的可视化模型
const session = await ort.InferenceSession.create('./model/model_int4.onnx');

// 2. 准备输入 Token (例如长度为 10)
const inputIds = new BigInt64Array([101n, 2769n, 3221n, ...]); // input tokens
const tensorInputs = {
    "input_ids": new ort.Tensor("int64", inputIds, [1, 10])
};

// 3. 执行推理，同时获取所有 26 个输出
const results = await session.run(tensorInputs);

// 4. 获取第 0 层注意力头的权重 (维度: 1 x 12 x 10 x 10)
const layer0Attn = results['attentions_0'];
console.log("Layer 0 Attention shape:", layer0Attn.dims); // [1, 12, 10, 10]

// 5. 获取第 12 层隐藏状态的嵌入表示 (维度: 1 x 10 x 768)
const layer12Hidden = results['hidden_states_12'];
console.log("Layer 12 Hidden States shape:", layer12Hidden.dims); // [1, 10, 768]
```

---

## 🚀 极速启动与测试

1.  **安装依赖**:
    ```bash
    pip install numpy onnxruntime transformers
    ```
2.  **运行常规交互推理**:
    ```bash
    python inference.py
    ```
3.  **一键执行 10 大 Prompt 深度大考**:
    ```bash
    python evaluate_10prompts.py
    ```
