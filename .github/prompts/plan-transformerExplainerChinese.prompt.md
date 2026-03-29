# Transformer Explainer 中文化 & Bug修复 计划

## Task 1 - 字体修复 (HIGH PRIORITY)

- 添加 CJK 兼容字体（如 `'Noto Sans SC'`）到 `src/app.html`
- 更新 `src/components/Topbar.svelte` logo 的 font-family，加入 CJK 回退字体
- 将 `lang="en"` 改为 `lang="zh"` in app.html

## Task 2 - UI 翻译 (HIGH PRIORITY)

翻译 ~150+ 英文字符串，涉及以下文件：

- **app.html**: title, meta tags
- **Topbar.svelte**: logo 文字 "TRANSFORMER EXPLAINER"
- **Alert.svelte**: 数据收集提示 "We collect anonymous data for research." + "Learn more"
- **InputForm.svelte**: "Examples", placeholder "Test your own input text", "Generate", 辅助文字
- **Sampling.svelte**: "Sampling", "Top-k", "Top-p" 单选标签
- **Temperature.svelte**: "Temperature"
- **Embedding.svelte**: "Embedding", "Tokenization", "Token Embedding", "Positional Encoding"
- **Attention.svelte**: "Multi-head Self Attention", "Key"/"Query"/"Value"/"Out"
- **Mlp.svelte**: "MLP"
- **Operation.svelte**: "GeLU", "Dropout", "Layer Normalization", "Residual"
- **SubsequentBlocks.svelte**: "more identical Transformer Blocks"
- **LinearSoftmax.svelte**: "Probabilities", "Tokens", "Logits", "Scaled logits", "Top-k"/"Softmax & Top-p", "Softmax"/"Normalization"
- **BlockTransition.svelte**: "Transformer Block {n}"
- **QKV.svelte**: Q/K/V 标签, vector tooltips

## Task 3 - 教科书翻译 (MEDIUM PRIORITY)

翻译 `src/utils/textbookPages.ts` 中全部 20 页内容：

1. What is Transformer? → 什么是 Transformer？
2. How Transformers Work? → Transformer 如何工作？
3. Transformer Architecture → Transformer 架构
4. Embedding → 嵌入
5. Token Embedding → 词元嵌入
6. Positional Encoding → 位置编码
7. Repetitive Transformer Blocks → 重复的 Transformer 块
8. Multi-Head Self Attention → 多头自注意力
9. Query, Key, Value → 查询、键、值
10. Multi-head → 多头
11. Masked Self Attention → 掩码自注意力
12. Attention Output & Concatenation → 注意力输出与拼接
13. MLP → 多层感知机
14. Output Logit → 输出 Logit
15. Probabilities → 概率
16. Temperature → 温度
17. Sampling Strategy → 采样策略
18. Residual Connection → 残差连接
19. Layer Normalization → 层归一化
20. Dropout → Dropout（随机失活）

## Task 4 - 弹出层翻译 (MEDIUM PRIORITY)

翻译 `src/components/popovers/` 下 12 个弹出组件的描述文字：

- ActivationPopover
- AttentionWeightPopover
- CommonPopover
- DropoutPopover
- LayerNormPopover
- LogitWeightPopover
- MLPDownWeightPopover
- MLPWeightPopover
- PositionalEncodingPopover
- QKVWeightPopover
- ResidualPopover
- SoftmaxPopover

## Task 5 - 生成 Bug 修复

**问题**: 模型只执行单次推理，预测 token 后不能递归追加到输入继续生成。

**根因**: `runModel()` 在 `predictedToken.set(sampled)` 后执行停止，没有将预测 token 追加回输入并重新运行的机制。

**修复方案**: 在 InputForm 的 handleSubmit 或创建新的生成流程中，实现 token 追加 + 重新运行模型的循环逻辑。

## 执行优先级

1. **字体修复** — CJK 显示的阻断性问题
2. **核心 UI 翻译** — 用户直接可见的界面文字
3. **教科书 & 弹出层翻译** — 教育内容
4. **生成 Bug 修复** — 功能性修复

## 技术要点

- **字体**: Jersey 10 不支持 CJK，需要替换/添加回退字体（Noto Sans SC / PingFang SC）
- **翻译原则**: 严格翻译，保持专业术语准确性
- **美观性**: 中文化后需调整字体大小和间距，确保视觉效果不逊于原项目
- **Article.svelte**: 已部分中文化，需检查剩余英文内容
