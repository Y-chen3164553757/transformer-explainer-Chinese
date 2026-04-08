# 中文模型流程说明

## 1. 文档目标

本文档用于说明当前项目如何将中文 GPT-2 模型整理为前端可直接使用的运行资产，并接入现有的 Transformer 可视化页面。

当前方案的核心思路是：

1. 使用 Python 脚本离线生成模型资产。
2. 使用统一配置文件管理模型参数、目录、分片和示例。
3. 保持前端可视化结构不变，只替换模型相关资源。

该流程适用于当前仓库，也适用于后续再次替换中文模型时复用。

## 2. 相关文件

### 2.1 配置文件

- [model-config.json](model-config.json)

该文件是整套流程的统一配置入口，负责管理：

1. 模型 ID
2. tokenizer ID
3. 本地目录与静态资源目录
4. ONNX 文件名与分片前缀
5. 分片总数、分片大小、缓存版本
6. 默认示例 prompt

### 2.2 Python 脚本

- [01.py](01.py)：下载中文模型
- [02_convert_onnx.py](02_convert_onnx.py)：导出 ONNX 模型
- [03_chunk.py](03_chunk.py)：切分 ONNX 分片
- [04_gen_examples.py](04_gen_examples.py)：生成中文示例数据

### 2.3 前端接入文件

- [src/store/index.ts](src/store/index.ts)：统一读取模型配置
- [src/routes/+page.svelte](src/routes/+page.svelte)：加载 tokenizer 和模型分片
- [src/utils/fetchChunks.js](src/utils/fetchChunks.js)：拉取并缓存模型分片
- [src/utils/data.ts](src/utils/data.ts)：执行推理并消费 ONNX 输出
- [src/constants/examples/index.js](src/constants/examples/index.js)：导出示例数据

## 3. 整体流程

中文模型接入分为四个阶段：

1. 下载原始模型
2. 导出前端兼容的 ONNX
3. 切分浏览器可加载分片
4. 生成前端示例数据

流程关系如下：

```text
01.py
  -> 下载 HuggingFace 中文模型
  -> 输出到 models/gpt2-chinese-cluecorpussmall

02_convert_onnx.py
  -> 读取本地模型和 model-config.json
  -> 导出 model.onnx

03_chunk.py
  -> 读取 model.onnx
  -> 输出到 static/model-v2-chinese/gpt2.onnx.partN

04_gen_examples.py
  -> 读取 model.onnx
  -> 生成 ex0 ~ ex4 中文示例数据

前端
  -> 读取 model-config.json 中的模型配置
  -> 加载 tokenizer
  -> 合并分片
  -> 创建 ONNX Runtime session
  -> 展示推理结果与可视化
```

## 4. 分步骤说明

### Step 1: 下载中文模型

执行文件：[01.py](01.py)

作用：

1. 读取 [model-config.json](model-config.json) 中的 modelId、代理配置和本地目录。
2. 从 HuggingFace 下载中文 GPT-2 模型到本地。

当前默认模型：

- `uer/gpt2-chinese-cluecorpussmall`

输出目录：

- `models/gpt2-chinese-cluecorpussmall`

产出要求：

1. 目录中存在 `config.json`
2. 目录中存在模型权重文件
3. 目录中存在 `vocab.txt` 等 tokenizer 文件

### Step 2: 导出 ONNX

执行文件：[02_convert_onnx.py](02_convert_onnx.py)

作用：

1. 读取共享配置和本地模型目录。
2. 校验模型层数、头数、维度、词表大小是否与配置一致。
3. 复用 [src/utils/model/model.py](src/utils/model/model.py) 中的自定义 GPT 架构。
4. 将 HuggingFace 权重映射为前端当前可视化逻辑兼容的 ONNX 输出结构。
5. 导出 `model.onnx` 并立即做一次 ONNX 推理验证。

输出目录：

- `models/gpt2-chinese-onnx/model.onnx`

该步骤的关键要求不是只生成 ONNX 文件，而是导出的输出张量必须与前端已有逻辑兼容。

### Step 3: 切分模型分片

执行文件：[03_chunk.py](03_chunk.py)

作用：

1. 读取共享配置中的 ONNX 路径、静态目录、分片大小和文件前缀。
2. 将 `model.onnx` 按固定大小切分为多个浏览器可加载的小文件。
3. 检查分片数量是否与共享配置中的 `chunkTotal` 一致。

输出目录：

- `static/model-v2-chinese`

输出文件命名：

- `gpt2.onnx.part0`
- `gpt2.onnx.part1`
- `gpt2.onnx.part2`
- `...`

如果实际分片数量与配置不一致，脚本会打印警告。

### Step 4: 生成中文示例数据

执行文件：[04_gen_examples.py](04_gen_examples.py)

作用：

1. 读取共享配置中的中文示例 prompt。
2. 基于 ONNX 模型执行推理。
3. 提取前端可视化所需数据，包括：
   - `prompt`
   - `tokens`
   - `tokenIds`
   - `logits`
   - `outputs`
   - `probabilities`
   - `sampled`
4. 生成 ex0 到 ex4 的中文示例文件。

输出目录：

- `src/constants/examples`

说明：

1. 当前脚本已固定随机种子，便于示例可复现。
2. 示例数据结构与当前前端消费格式保持一致，无需改 examples 导出入口。

## 5. 前端如何使用这些产物

### 5.1 运行时配置

[src/store/index.ts](src/store/index.ts) 会读取 [model-config.json](model-config.json)，并生成当前中文模型的运行时参数，包括：

1. `tokenizerId`
2. `modelDir`
3. `chunkFilePrefix`
4. `chunkTotal`
5. `cacheVersion`
6. 默认示例文本

### 5.2 页面启动逻辑

[src/routes/+page.svelte](src/routes/+page.svelte) 在页面启动时完成以下操作：

1. 加载 tokenizer
2. 根据共享配置拼接模型分片 URL
3. 调用 [src/utils/fetchChunks.js](src/utils/fetchChunks.js) 拉取并合并分片
4. 创建 ONNX Runtime session
5. 在模型未加载完成时，先使用 examples 数据做演示

### 5.3 缓存逻辑

[src/utils/fetchChunks.js](src/utils/fetchChunks.js) 会使用 `cacheVersion` 作为模型缓存版本号。

这意味着：

1. 如果模型资源更新，应该同步调整 `cacheVersion`
2. 否则浏览器可能继续使用旧分片

## 6. 推荐执行顺序

建议严格按以下顺序执行：

```bash
python 01.py
python 02_convert_onnx.py
python 03_chunk.py
python 04_gen_examples.py
```

完成后再启动前端：

```bash
npm run dev
```

## 7. 验收清单

完成流程后，建议按以下顺序检查：

1. 本地模型目录是否下载完整
2. ONNX 文件是否生成成功
3. ONNX 是否能被 onnxruntime 正常加载
4. 静态目录中分片数量是否与配置一致
5. ex0 到 ex4 是否已更新为中文示例
6. 页面是否能正常加载中文 tokenizer
7. 页面是否能正确加载模型分片
8. 中文输入是否能正常分词与推理
9. attention、logits、probabilities 可视化是否正常显示
10. 刷新页面后是否不存在旧缓存污染

## 8. 常见风险

### 8.1 tokenizer 与词表不匹配

如果 tokenizer 与 ONNX 输出的 vocab size 不一致，前端会出现 token 解码错误、概率显示异常或采样结果失真。

### 8.2 分片数量与前端配置不一致

如果 `03_chunk.py` 实际输出数量和 [model-config.json](model-config.json) 中的 `chunkTotal` 不一致，前端将无法完整合并模型文件。

### 8.3 浏览器缓存污染

如果替换了模型文件但没有同步更新缓存版本，浏览器仍可能使用旧分片，导致页面行为与最新代码不一致。

### 8.4 示例数据与模型不一致

如果重新导出了 ONNX，却没有重刷 ex0 到 ex4，页面首屏示例和真实模型行为可能不一致。

## 9. 当前方案的特点

该方案的优点是：

1. 保留现有前端可视化结构
2. 模型相关改动集中在共享配置和离线脚本
3. 更换模型时不需要同时改多份前端常量
4. 适合后续重复执行和持续维护

适用场景：

1. 将英文 GPT-2 替换为中文 GPT-2
2. 对现有可视化项目做中文适配
3. 需要可复现的模型资产生成流程
4. 需要将模型部署到浏览器端并保持现有 UI 不变