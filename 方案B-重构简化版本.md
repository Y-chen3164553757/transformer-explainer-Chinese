# 方案 B：重构简化版本方案（学习高价值）

## 📋 方案概述

**目标**：借鉴现有项目的架构和设计理念，从零重新构建一个针对中文和轻量模型优化的、代码更简洁的 Transformer 可视化项目

**工作量**：7-10 天  
**成功率**：95%+  
**推荐指数**：⭐⭐⭐⭐

---

## ✅ 核心优势

| 优势 | 说明 |
|------|------|
| **代码清晰** | 从零开始，无历史债务，代码结构更优 |
| **针对性优化** | 完全为中文和轻量模型设计 |
| **学习价值高** | 深入理解 Transformer 可视化原理 |
| **易于维护** | 代码量减半，逻辑明确 |
| **扩展性强** | 未来修改和扩展更容易 |
| **技术积累** | 积累前端性能优化和 ONNX 集成经验 |

---

## 🔍 第一阶段：深度分析现有项目（2-3 天）

### **任务 1：架构分析**

#### 1.1 理解项目整体架构

**需要分析的核心问题：**

```
核心问题 1: 数据流是如何组织的？
└─ 用户输入 → tokenizer → model inference → UI 展示
└─ 需要理解：Svelte Store 的设计、状态流转

核心问题 2: 为什么这样分组件？
├─ Embedding.svelte    # Token 嵌入展示
├─ Attention.svelte    # 注意力机制
├─ Mlp.svelte          # 多层感知机
├─ LinearSoftmax.svelte # 输出层
└─ 其他组件...
└─ 需要理解：组件职责边界、数据流向

核心问题 3: 教科书是如何集成的？
└─ 如何指引用户学习
└─ 交互式高亮的实现方式
└─ 需要理解：页面状态管理、动画触发机制

核心问题 4: 性能优化有哪些？
├─ ONNX 模型分片加载
├─ Canvas vs SVG 的选择
├─ 动画性能优化
└─ 需要理解：瓶颈在哪里
```

**分析方法：**

```markdown
## 架构分析表

| 模块 | 文件数 | 行数 | 复杂度 | 借鉴价值 |
|-----|-------|------|--------|---------|
| 存储管理 | 1 | 150 | 中 | 高 |
| 组件系统 | 20+ | 2000+ | 高 | 高 |
| 工具函数 | 10 | 800 | 中 | 中 |
| 样式系统 | 3 | 1000 | 低 | 中 |
| 教科书 | 1 | 800 | 中 | 高 |
| 动画系统 | 3 | 200 | 中 | 中 |
```

#### 1.2 绘制架构和数据流图

```
现有项目数据流：

┌─────────────────────────────────────────┐
│         用户界面 (Topbar + InputForm)    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│    Svelte Store (全局状态管理)          │
├─────────────────────────────────────────┤
│ • modelData (推理输出)                  │
│ • tokens (token序列)                    │
│ • temperature, sampling (参数)          │
│ • expandedBlock, blockIdx (UI状态)      │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│    模型推理 (ONNX Runtime Web)          │
├─────────────────────────────────────────┤
│ • Token 嵌入                            │
│ • 12 层 Transformer block               │
│ • 注意力矩阵计算                        │
│ • 概率分布输出                          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│    可视化组件                           │
├─────────────────────────────────────────┤
│ • Embedding       (向量可视化)          │
│ • Attention       (注意力矩阵)          │
│ • Mlp             (隐藏层)              │
│ • LinearSoftmax   (概率分布)            │
│ • Sankey          (信息流)              │
│ • HeadStack       (多头)                │
└─────────────────────────────────────────┘
```

**简化后的新版本数据流：**

```
┌──────────────────┐
│   用户输入界面    │
└────────┬─────────┘
         ↓
┌──────────────────────────────────────┐
│  全局状态 (3-5 个核心 store)         │
│  ├─ AppState                         │
│  ├─ UIState                          │
│  └─ VisualizationState               │
└────────┬─────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│  轻量模型推理                        │
│  └─ 简化版中文 GPT-2                 │
└────────┬─────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│  精简可视化 (5-8 个核心组件)         │
│  ├─ TokenDisplay                     │
│  ├─ AttentionHeatmap                 │
│  ├─ EmbeddingSpace                   │
│  ├─ ProbabilityChart                 │
│  └─ ModelFlow                        │
└──────────────────────────────────────┘
```

### **任务 2：UI/UX 分析**

需要理解的问题：

```markdown
## UI/UX 分析清单

1. 输入界面
   - 输入框设计（输入限制、示例切换）
   - 温度、采样参数的控制方式
   - 生成按钮的反馈机制

2. 可视化布局
   - 各个组件的位置和尺寸
   - 响应式设计的断点
   - 不同屏幕尺寸的适应

3. 交互设计
   - Token 选择和高亮
   - Block 切换的方式
   - Head 展开/折叠
   - 工具提示的触发

4. 教科书集成
   - 如何指引用户
   - 交互式高亮的实现
   - 页面流程的逻辑

5. 动画和过渡
   - 关键的动画效果
   - 什么时候使用动画
   - 性能影响
```

### **任务 3：技术栈分析**

```markdown
## 技术栈分析表

| 技术 | 用途 | 必要性 | 简化方案 |
|-----|------|--------|---------|
| SvelteKit | 框架 | 必须 | Vite + Svelte |
| Svelte Store | 状态管理 | 必须 | 保留 |
| GSAP | 动画 | 重要 | CSS Animations + 精选 GSAP |
| D3.js | 数据可视化 | 重要 | D3 (保留) |
| Tailwind | 样式 | 可选 | 原生 CSS |
| ONNX Runtime | 模型推理 | 必须 | 保留 |
| @xenova/transformers | Tokenizer | 必须 | 保留或自定义 |

## 简化方案：
✓ 保留：Svelte, ONNX Runtime, D3
✓ 优化：减少 GSAP 依赖
✓ 简化：Tailwind → CSS
✓ 改进：更清晰的状态管理
```

---

## 🛠️ 第二阶段：选择轻量模型（1-2 天）

### **任务 1：模型测试和对比**

```python
# model_comparison.py
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import time

# 所有模型均来自 UER 官方: https://huggingface.co/uer
candidates = [
    "uer/gpt2-chinese-cluecorpussmall",         # 首选，12层，~150MB
    "uer/gpt2-distil-chinese-cluecorpussmall",  # 轻量，6层，~80MB
    "uer/gpt2-large-chinese-cluecorpussmall",   # 大型，质量最高，不推荐浏览器
]

def benchmark_model(model_id):
    """测试模型大小、速度和质量"""
    print(f"\n{'='*50}")
    print(f"测试: {model_id}")
    print(f"{'='*50}")
    
    # 加载模型
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id)
    
    # 1. 模型大小
    model_size = sum(p.numel() for p in model.parameters()) / 1_000_000
    print(f"📊 参数量: {model_size:.1f}M")
    
    # 2. 推理速度
    text = "你好，我叫"
    inputs = tokenizer(text, return_tensors="pt")
    
    start = time.time()
    with torch.no_grad():
        for _ in range(10):
            outputs = model.generate(**inputs, max_length=20)
    elapsed = time.time() - start
    
    print(f"⚡ 推理速度 (10 次生成): {elapsed:.2f}s")
    print(f"   平均: {elapsed/10:.3f}s/次")
    
    # 3. 生成质量
    output_text = tokenizer.decode(outputs[0])
    print(f"💬 生成示例:\n   输入: {text}\n   输出: {output_text}")

# 运行对比
for model_id in candidates:
    try:
        benchmark_model(model_id)
    except Exception as e:
        print(f"❌ 加载失败: {e}")
```

### **任务 2：性能分析**

```markdown
## 性能分析指标

| 模型 | 参数量 | 文件大小 | 推理速度 | 生成质量 | 总分 |
|-----|--------|--------|--------|--------|------|
| uer/gpt2-chinese-cluecorpussmall | 117M | ~150MB | 中 | 优 | ⭐⭐⭐⭐⭐ |
| uer/gpt2-distil-chinese-cluecorpussmall | 66M | ~80MB | 快 | 良 | ⭐⭐⭐⭐ |
| uer/gpt2-large-chinese-cluecorpussmall | 774M | ~350MB | 慢 | 极优 | ⭐⭐⭐ |

## 推荐：uer/gpt2-distil-chinese-cluecorpussmall（用于浏览器）
✓ 80MB，最适合浏览器部署
✓ 推理速度快（蒸馏版本）
✓ 质量与 small 相当
```

---

## 🏗️ 第三阶段：项目框架搭建（3-5 天）

### **任务 1：初始化项目**

```bash
# 创建新项目
npm create vite@latest transformer-zh -- --template svelte
cd transformer-zh
npm install

# 安装必要依赖
npm install \
  onnxruntime-web \
  @xenova/transformers \
  d3 \
  tailwindcss \
  gsap \
  classnames
```

### **任务 2：建立目录结构**

```
transformer-zh/
├─ src/
│  ├─ components/
│  │  ├─ core/              # 核心组件
│  │  │  ├─ InputBox.svelte
│  │  │  ├─ OutputDisplay.svelte
│  │  │  └─ ControlPanel.svelte
│  │  ├─ visualization/     # 可视化组件
│  │  │  ├─ AttentionHeatmap.svelte
│  │  │  ├─ EmbeddingPlot.svelte
│  │  │  ├─ TokenFlow.svelte
│  │  │  └─ ProbabilityBars.svelte
│  │  ├─ layout/            # 布局
│  │  │  ├─ Header.svelte
│  │  │  ├─ MainLayout.svelte
│  │  │  └─ Sidebar.svelte
│  │  └─ common/            # 通用组件
│  │     ├─ Slider.svelte
│  │     ├─ Tooltip.svelte
│  │     └─ Loading.svelte
│  ├─ store/
│  │  ├─ app.ts            # 应用状态
│  │  ├─ ui.ts             # UI 状态
│  │  └─ model.ts          # 模型和推理数据
│  ├─ utils/
│  │  ├─ model.ts          # 模型加载和推理
│  │  ├─ format.ts         # 数据格式化
│  │  ├─ animation.ts      # 动画工具
│  │  └─ math.ts           # 数学运算
│  ├─ styles/
│  │  ├─ global.css
│  │  └─ variables.css
│  ├─ App.svelte
│  └─ main.ts
├─ static/
│  └─ models/              # 存放 ONNX 模型
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```

### **任务 3：建立核心状态管理**

```typescript
// src/store/app.ts
import { writable, derived } from 'svelte/store';

export const inputText = writable<string>('');
export const tokens = writable<string[]>([]);
export const modelLoaded = writable<boolean>(false);
export const isGenerating = writable<boolean>(false);

// UI 状态
export const selectedHead = writable<number>(0);
export const selectedLayer = writable<number>(0);
export const expandedSection = writable<string>('');

// 推理数据
export const modelOutput = writable<{
    embeddings?: number[][];
    attention?: number[][][];
    hidden?: number[][];
    logits?: number[];
}>();
```

### **任务 4：模型加载工具**

```typescript
// src/utils/model.ts
import * as ort from 'onnxruntime-web';
import { AutoTokenizer } from '@xenova/transformers';

export async function loadModel() {
    // 初始化 ONNX Runtime
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/';
    
    // 加载 tokenizer
    // Xenova 转换版（ONNX 格式，可直接在浏览器使用）
    // 若官方已有 Xenova 转换版，优先使用；否则使用自行转换的模型
    const tokenizer = await AutoTokenizer.from_pretrained(
        'uer/gpt2-chinese-cluecorpussmall'  // 官方: https://huggingface.co/uer/gpt2-chinese-cluecorpussmall
    );
    
    // 加载模型
    // 如果是大模型，使用分片加载的方式
    const session = await ort.InferenceSession.create(
        '/models/gpt2-chinese.onnx'
    );
    
    return { tokenizer, session };
}

export async function generate(
    session: ort.InferenceSession,
    tokenizer: any,
    text: string,
    maxTokens: number = 20
) {
    // 实现生成逻辑
    const inputs = tokenizer(text, {
        return_tensors: 'onnx'
    });
    
    const outputs = await session.run(inputs);
    // 返回详细的推理数据
    return processOutput(outputs);
}
```

---

## 🎨 第四阶段：实现可视化（5-7 天）

### **核心可视化组件列表**

| 组件 | 功能 | 复杂度 | 预计时间 |
|------|------|--------|---------|
| AttentionHeatmap | 显示注意力矩阵 | 中 | 8h |
| EmbeddingPlot | Token 嵌入可视化 | 中 | 6h |
| TokenFlow | Token 流经网络 | 高 | 10h |
| ProbabilityBars | 输出概率分布 | 低 | 4h |
| LayerBrowser | 层选择和展示 | 中 | 6h |

### **实现示例：AttentionHeatmap**

```svelte
<!-- src/components/visualization/AttentionHeatmap.svelte -->
<script lang="ts">
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    
    export let data: number[][] = [];  // attention 矩阵
    export let tokens: string[] = [];
    
    let container: HTMLDivElement;
    
    onMount(() => {
        if (!data.length) return;
        
        const width = 400;
        const height = 400;
        const cellSize = width / data.length;
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        // 颜色缩放
        const colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['white', 'darkblue']);
        
        // 绘制热力图
        const cells = svg.selectAll('rect')
            .data(data.flat().map((d, i) => ({
                value: d,
                row: Math.floor(i / data.length),
                col: i % data.length
            })))
            .join('rect')
            .attr('x', d => d.col * cellSize)
            .attr('y', d => d.row * cellSize)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('fill', d => colorScale(d.value));
    });
</script>

<div bind:this={container} class="attention-heatmap"></div>

<style>
    .attention-heatmap {
        width: 100%;
        height: 100%;
    }
</style>
```

---

## 🧪 第五阶段：集成和测试（2-3 天）

### **集成检查清单**

- [ ] 页面加载正常
- [ ] 模型成功加载
- [ ] Tokenizer 工作正常
- [ ] 推理有输出结果
- [ ] 所有可视化组件渲染正确
- [ ] 参数控制有效
- [ ] 响应式设计工作
- [ ] 性能达标（无卡顿）

### **性能优化**

```typescript
// 关键优化点
1. 虚拟滚动 - 处理长 token 序列
2. Canvas vs SVG - 选择合适的渲染方式
3. 节流 - 限制实时更新频率
4. 懒加载 - 只加载可见的可视化
5. Web Worker - 外包数据处理
```

---

## 📚 第六阶段：完成中文支持（1-2 天）

### **任务 1：汉化 UI**

```typescript
// src/i18n.ts
export const messages = {
    zh: {
        'app.title': 'Transformer 解释器',
        'input.placeholder': '输入文本...',
        'button.generate': '生成',
        'label.temperature': '温度',
        'label.sampling': '采样策略',
    }
};

// 在组件中使用
<label>{$t('label.temperature')}</label>
```

### **任务 2：添加中文教科书**

```markdown
# 教科书内容规划

1. Transformer 是什么? (5 分钟)
2. 分词和嵌入 (5 分钟)
3. 自注意力机制 (10 分钟)
4. 多头注意力 (5 分钟)
5. 前向网络 (5 分钟)
6. 输出和采样 (5 分钟)
```

---

## 📊 完整时间规划

| 阶段 | 任务 | 时间 | 完成标志 |
|------|------|------|---------|
| 1 | 深度分析现有项目 | 2-3 天 | 完成架构文档 |
| 2 | 选择轻量模型 | 1-2 天 | 确定最佳模型 |
| 3 | 框架搭建 | 3-5 天 | 项目能运行 |
| 4 | 实现可视化 | 5-7 天 | 所有组件完成 |
| 5 | 集成和测试 | 2-3 天 | 功能正常 |
| 6 | 汉化和文档 | 1-2 天 | 发布就绪 |
| **总计** | | **14-22 天** | **项目完成** |

**折合时间：2-3 周** ✅

---

## 🎯 预期收获

### **技术方面**
- ✅ 掌握 Transformer 可视化全流程
- ✅ 理解 ONNX 模型集成
- ✅ Svelte 高级用法
- ✅ D3.js 数据可视化
- ✅ 前端性能优化经验

### **产品方面**
- ✅ 高质量的中文 Transformer 可视化工具
- ✅ 代码简洁易维护
- ✅ 可扩展的架构
- ✅ 完整的教学资料

### **代码质量**
- ✅ 代码量减少 50% (从 4300 行 → 2000 行)
- ✅ 更好的代码组织
- ✅ 清晰的模块划分
- ✅ 易于团队协作

---

## ⚠️ 风险分析

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| 时间估算不足 | 中 | 中 | 每个阶段预留 20% 缓冲 |
| 性能问题 | 低 | 中 | 定期性能测试和优化 |
| 浏览器兼容性 | 低 | 低 | 测试多个浏览器 |
| 需求变动 | 低 | 中 | 定期 review 目标 |

**总风险等级：🟢 低** （成功率 95%+）

---

## 📝 每日进度模板

```
第 1 天：
- [ ] 读透现有项目架构
- [ ] 绘制数据流图
- [ ] 列出所有优秀设计点

第 2-3 天：
- [ ] 测试候选模型
- [ ] 性能对比分析
- [ ] 确定最终选择

第 4-8 天：
- [ ] 初始化项目
- [ ] 建立核心组件
- [ ] 实现主要可视化

第 9-11 天：
- [ ] 完成所有组件
- [ ] 集成测试
- [ ] 性能优化

第 12-15 天：
- [ ] 汉化支持
- [ ] 教科书内容
- [ ] 最终调整
```

---

## 🚀 何时选择这个方案

**建议选择方案 B 如果：**

- 你有充足的时间（2-3 周）
- 想要学习深入的 Transformer 可视化知识
- 想要一个高质量、可维护的代码库
- 计划后续持续迭代和改进
- 想要作为学习项目或作品集

**不建议选择方案 B 如果：**

- 时间紧张（1 周内需要完成）
- 只是想快速看到效果
- 优先考虑快速上线

---

## 📚 资源和参考

- Transformer 论文: https://arxiv.org/abs/1706.03762
- D3.js 文档: https://d3js.org/
- Svelte 文档: https://svelte.dev/
- ONNX 文档: https://onnx.ai/

