# Transformer Explainer 中文版

本项目由本人独立改造，基于中文 GPT-2 模型，支持中文输入、推理与可视化。软件著作权归本人所有，未经许可禁止复制、分发、商用。

## 主要特性
- 支持中文 GPT-2（uer/gpt2-chinese-cluecorpussmall）推理与可视化
- 全界面中文化，适配中文分词与显示
- 保留原项目全部交互与可视化能力
- 示例数据、tokenizer、模型分片均已适配中文

## 快速开始
1. 安装依赖：`npm install`
2. 启动开发环境：`npm run dev`
3. 按照 `替换中文模型全流程.md` 可复现模型转换与分片

## 目录结构
- `src/`：前端核心代码
- `static/`：静态资源（图片、tokenizer 配置、模型分片等）
- `models/`：本地模型权重与中间文件（不上传）

## 协议声明
本项目为私有协议，著作权归本人所有，禁止任何第三方在未获授权情况下复制、分发、商用。

## 致谢
- 原项目 poloclub/transformer-explainer
- 中文模型 uer/gpt2-chinese-cluecorpussmall
