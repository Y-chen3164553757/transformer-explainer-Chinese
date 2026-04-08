import { get } from 'svelte/store';
import {
	expandedBlock,
	weightPopover,
	isBoundingBoxActive,
	textbookCurrentPageId,
	isExpandOrCollapseRunning,
	isFetchingModel,
	userId
} from '~/store';
import {
	highlightElements,
	removeHighlightFromElements,
	applyTransformerBoundingHeight,
	resetElementsHeight,
	highlightAttentionPath,
	removeAttentionPathHighlight,
	removeFingerFromElements
} from '~/utils/textbook';
import { drawResidualLine } from './animation';

export interface TextbookPage {
	id: string;
	title: string;
	content?: string;
	component?: any;
	timeoutId?: number;
	on: () => void;
	out: () => void;
	complete?: () => void;
}

const { drawLine, removeLine } = drawResidualLine();

export const textPages: TextbookPage[] = [
	{
		id: 'what-is-transformer',
		title: '什么是 Transformer？',
		content: `<p><strong>Transformer</strong> 是现代 AI 的核心架构，驱动着 ChatGPT、Gemini 等模型。它在 2017 年提出，彻底改变了 AI 处理信息的方式。同一套架构既可用于海量数据训练，也可用于推理生成输出。这里我们使用的是 GPT-2（small），它虽然比新模型更简单，但非常适合学习基础概念。</p>
`,
		on: () => {},
		out: () => {}
	},
	{
		id: 'how-transformers-work',
		title: 'Transformer 如何工作？',
		content: `<p>Transformer 并不神秘。它是通过不断追问下面这个问题，一步一步生成文本的：</p>
	<blockquote class="question">
		“在当前输入之后，最有可能出现的下一个词是什么？”
	</blockquote>
	<p>这里展示的是训练完成后的模型如何生成文本。你可以输入自己的文本，或直接使用示例，然后点击 <strong>Generate（生成）</strong> 按钮观察它的运行过程。如果模型还没准备好，可以先切换到另一个 <strong>Example（示例）</strong>。</p>`,
		on: () => {
			highlightElements(['.input-form']);
			if (get(isFetchingModel)) {
				highlightElements(['.input-form .select-button']);
			} else {
				highlightElements(['.input-form .generate-button']);
			}
		},
		out: () => {
			removeHighlightFromElements([
				'.input-form',
				'.input-form .select-button',
				'.input-form .generate-button'
			]);
		},
		complete: () => {
			removeFingerFromElements(['.input-form .select-button', '.input-form .generate-button']);
			if (get(textbookCurrentPageId) === 'how-transformers-work') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'how-transformers-work'
				});
			}
		}
	},
	{
		id: 'transformer-architecture',
		title: 'Transformer 架构',
		content:
			'<p>Transformer 主要由三个部分组成：</p><div class="numbered-list"><div class="numbered-item"><span class="number-circle">1</span><div class="item-content"><strong>词嵌入（Embedding）</strong> 将文本转换为数字表示。</div></div><div class="numbered-item"><span class="number-circle">2</span><div class="item-content"><strong>Transformer 块（Transformer Blocks）</strong> 通过自注意力机制整合信息，再用 MLP 做进一步精炼。</div></div><div class="numbered-item"><span class="number-circle">3</span><div class="item-content"><strong>输出概率（Output Probabilities）</strong> 用来决定下一个词元出现的可能性。</div></div></div>',
		on: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			highlightElements(selectors);
			applyTransformerBoundingHeight(['.softmax-bounding', '.embedding-bounding']);
		},
		out: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			removeHighlightFromElements(selectors);
			resetElementsHeight(['.softmax-bounding', '.embedding-bounding']);
		}
	},
	{
		id: 'embedding',
		title: '词嵌入（Embedding）',
		content: `<p>在 Transformer 使用文本之前，它会先把文本拆成更小的单位，并将每个单位表示为一串数字（向量）。这个过程称为<strong>词嵌入（embedding）</strong>，这个词既可以指过程，也可以指最终得到的向量。</p><p>在这个工具中，每个向量都会显示为一个矩形；将鼠标悬停其上时，可以看到它的尺寸。</p>`,
		on: () => {
			highlightElements(['.step.embedding .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.embedding .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.embedding .title']);
			if (get(textbookCurrentPageId) === 'embedding') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'embedding'
				});
			}
		}
	},
	{
		id: 'token-embedding',
		title: '词元嵌入（Token Embedding）',
		content: `<p><strong>分词（Tokenization）</strong> 会把输入文本拆分成词元（token），也就是像单词或子词这样的更小单位。GPT-2（small）拥有 50,257 个词元的词汇表，每个词元都有唯一的 ID。</p><p>在<strong>词元嵌入（token embedding）</strong>这一步中，每个词元都会从一个大型查找表中匹配到一个 768 维向量。这些向量是在训练过程中学出来的，用来尽可能准确地表示各个词元的含义。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'positional-encoding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'positional-encoding',
		title: '位置编码（Positional Encoding）',
		content: `<p>在语言中，词序非常重要。<strong>位置编码（Positional Encoding）</strong> 会让每个词元知道自己在序列中的位置。</p><p>GPT-2 的做法，是把一个学得的位置嵌入加到词元嵌入上；而较新的模型可能会采用其他方法，例如 RoPE（旋转位置编码），它通过旋转某些向量来编码位置信息。它们的目标都是帮助模型理解文本中的顺序。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'token-embedding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'blocks',
		title: '重复堆叠的 Transformer 块',
		content: `<p><strong>Transformer 块（Transformer block）</strong> 是模型中的主要处理单元。它包含两个部分：</p><ul><li><strong>多头自注意力（Multi-head self-attention）</strong>：让词元彼此共享信息</li><li><strong>MLP（多层感知机）</strong>：进一步精炼每个词元的表示</li></ul><p>模型会堆叠多个这样的块，使词元表示在逐层传递的过程中变得更加丰富。GPT-2（small）一共有 12 个这样的块。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements([
						'.transformer-bounding',
						'.step.transformer-blocks .guide',
						'.attention > .title',
						'.mlp > .title'
					]);
					highlightElements(['.transformer-bounding-title'], 'textbook-button-highlight');
					isBoundingBoxActive.set(true);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.transformer-bounding',
				'.step.transformer-blocks .guide',
				'.attention > .title',
				'.mlp > .title'
			]);
			removeHighlightFromElements(['.transformer-bounding-title'], 'textbook-button-highlight');
			isBoundingBoxActive.set(false);
		},
		complete: () => {
			removeFingerFromElements(['.transformer-bounding-title']);
			if (get(textbookCurrentPageId) === 'blocks') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'blocks'
				});
			}
		}
	},
	{
		id: 'self-attention',
		title: '多头自注意力（Multi-Head Self-Attention）',
		content:
			'<p><strong>自注意力（Self-attention）</strong> 让模型判断输入中的哪些部分与当前词元最相关。这使它能够捕捉意义和关系，即使两个词相隔很远也没问题。</p><p>在<strong>多头（multi-head）</strong>形式下，模型会并行运行多个注意力过程，每个头都专注于文本中的不同模式。</p>',
		on: () => {
			highlightElements(['.step.attention']);
		},
		out: () => {
			removeHighlightFromElements(['.step.attention']);
		}
	},
	{
		id: 'qkv',
		title: 'Query（查询）、Key（键）、Value（值）',
		content: `
	<p>为了执行自注意力计算，每个词元的嵌入都会被转换成 
	  <span class="highlight">三个新的嵌入向量</span>——
	  <span class="blue">Query（查询）</span>、  
	  <span class="red">Key（键）</span> 和  
	  <span class="green">Value（值）</span>。
	 这些新向量是通过对每个词元嵌入应用不同的权重和偏置得到的，而这些参数（权重与偏置）会在训练过程中被优化。</p>

<p>生成之后，<span class="blue">Query</span> 会与 <span class="red">Key</span> 比较来衡量相关性，而这个相关性分数会进一步用来加权 <span class="green">Value</span>。</p>
`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.step.qkv .qkv-column']);
			if (get(textbookCurrentPageId) === 'qkv') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'qkv'
				});
			}
		}
	},

	{
		id: 'multi-head',
		title: '多头机制（Multi-head）',
		content:
			'<p>在生成 <span class="blue">Q</span>、<span class="red">K</span> 和 <span class="green">V</span> 嵌入之后，模型会把它们切分成多个<strong>头（heads）</strong>，在 GPT-2 small 中一共是 12 个。每个头都会处理自己那一小部分 <span class="blue">Q</span>/<span class="red">K</span>/<span class="green">V</span>，从而关注文本中的不同模式，例如语法、语义或长距离依赖。</p><p>多个头可以让模型并行学习多种关系，因此对文本的理解也会更加丰富。</p>',
		on: () => {
			highlightAttentionPath();
			highlightElements(['.multi-head .head-title']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.multi-head .head-title']);
		},
		complete: () => {
			removeFingerFromElements(['.multi-head .head-title']);
			if (get(textbookCurrentPageId) === 'multi-head') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'multi-head'
				});
			}
		}
	},
	{
		id: 'masked-self-attention',
		title: '掩蔽自注意力（Masked Self-Attention）',
		content: `<p>在每个头中，模型都会决定每个词元应该关注其他词元到什么程度：</p><ul><li><strong>点积（Dot Product）</strong>：将 <span class="blue">Query</span>/<span class="red">Key</span> 向量中对应位置的数相乘并求和，得到 <span class="purple">注意力分数</span>。</li><li><strong>掩码（Mask）</strong>：遮住未来词元，防止模型提前偷看后面的内容。</li><li><strong>Softmax（归一化函数）</strong>：把分数转换成概率，每一行加起来都等于 1，表示它对前面各词元的关注程度。</li></ul>`,
		on: () => {
			highlightAttentionPath();
			highlightElements(['.attention-matrix.attention-result']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.attention-matrix.attention-result']);
			expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.attention-matrix.attention-result']);
			if (get(textbookCurrentPageId) === 'masked-self-attention') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'masked-self-attention'
				});
			}
		}
	},
	{
		id: 'output-concatenation',
		title: '注意力输出与拼接',
		content:
			'<p>每个头都会<span class="highlight">将自己的 <span class="purple">注意力分数</span> 与 <span class="green">Value</span> 嵌入相乘，从而得到各自的注意力输出</span>。这表示词元在结合上下文之后被重新提炼过的表示。</p><p>GPT-2（small）共有 12 份这样的输出，它们会被拼接起来，组成一个恢复到原始大小的向量（768 个数）。</p>',
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.attention .column.out']);
			if (get(textbookCurrentPageId) === 'output-concatenation') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-concatenation'
				});
			}
		}
	},
	{
		id: 'mlp',
		title: 'MLP（多层感知机）',
		content:
			'<p>注意力输出会进入一个 <strong>MLP（多层感知机）</strong>，进一步精炼词元表示。线性层会利用学得的权重和偏置改变嵌入的数值与维度，而后续的非线性激活函数则决定每个值能通过多少。</p><p>激活函数有很多种；GPT-2 使用的是 <strong>GELU（高斯误差线性单元）</strong>，它会让较小的值部分通过、较大的值更完整地通过，因此既能保留细微模式，也能保留强烈模式。</p>',
		on: () => {
			highlightElements(['.step.mlp', '.operation-col.activation']);
		},
		out: () => {
			removeHighlightFromElements(['.step.mlp', '.operation-col.activation']);
		}
	},

	{
		id: 'output-logit',
		title: '输出 Logit（未归一化分数）',
		content: `<p>经过所有 Transformer 块之后，最后一个词元的输出嵌入已经整合了之前所有词元的上下文信息，它会在最终层中与学得的权重相乘。</p><p>这会产生 <strong>logits（未归一化分数）</strong>，也就是 50,257 个数，对应 GPT-2 词汇表中的每一个词元，用来表示各个词元作为下一个输出的可能性有多大。</p>`,
		on: () => {
			highlightElements(['g.path-group.softmax', '.column.final']);
		},
		out: () => {
			removeHighlightFromElements(['g.path-group.softmax', '.column.final']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.column.final']);
			if (get(textbookCurrentPageId) === 'output-logit') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-logit'
				});
			}
		}
	},
	{
		id: 'output-probabilities',
		title: '概率（Probabilities）',
		content:
			'<p>Logits（未归一化分数）只是原始分数。为了让它们更容易理解，我们会把它们转换成 0 到 1 之间的<strong>概率（Probabilities）</strong>，并且所有概率加起来等于 1。这就表示每个词元成为下一个词的可能性。</p><p>我们不一定总是选择概率最高的词元，也可以采用不同的选择策略，在生成文本时平衡确定性与多样性。</p>',
		on: () => {
			highlightElements(['.step.softmax .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.softmax .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.softmax .title']);
			if (get(textbookCurrentPageId) === 'output-probabilities') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-probabilities'
				});
			}
		}
	},
	{
		id: 'temperature',
		title: '温度（Temperature）',
		content:
			'<p><strong>温度（Temperature）</strong> 的作用，是在把 logits（未归一化分数）转成概率之前先对它们进行缩放。<strong>低温</strong>（例如 0.2）会让大的 logits 更大、小的更小，更偏向最高分词元，因此输出更<strong>可预测</strong>。<strong>高温</strong>（例如 1.0 或更高）会缩小差距，让低概率词元也更有机会被选中，因此输出会更<strong>具多样性</strong>。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.scaled',
						'.title-box.scaled',
						'.content-box.scaled',
						'.temperature-input'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.scaled',
					'.title-box.scaled',
					'.content-box.scaled',
					'.temperature-input'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.scaled',
				'.title-box.scaled',
				'.temperature-input',
				'.content-box.scaled'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.temperature-input']);
			if (get(textbookCurrentPageId) === 'temperature') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'temperature'
				});
			}
		}
	},
	{
		id: 'sampling',
		title: '采样策略（Sampling Strategy）',
		content:
			'<p>最后，我们还需要一种策略来选出下一个词元。方法有很多，这里展示几种常见方式：贪心搜索（Greedy Search）直接选概率最高的那个；<strong>Top-k（前 k 采样）</strong> 只保留概率最高的前 k 个词元；<strong>Top-p（核采样）</strong> 则保留累计概率至少达到 p 的最小词元集合，从而尽早剔除明显不可能的候选。</p><p>之后，softmax（归一化函数）会把剩余 logits 转成概率，再从允许的候选集合中随机选出一个词元。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.sampling',
						'.title-box.sampling',
						'.sampling-input',
						'.content-box.sampling'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.sampling',
					'.title-box.sampling',
					'.sampling-input',
					'.content-box.sampling'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.sampling',
				'.title-box.sampling',
				'.sampling-input',
				'.content-box.sampling'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.sampling-input']);
			if (get(textbookCurrentPageId) === 'sampling') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'sampling'
				});
			}
		}
	},
	{
		id: 'residual',
		title: '残差连接（Residual Connection）',
		content: `<p>Transformer 还包含一些能提升模型性能的辅助特性。例如，<strong>残差连接（residual connection）</strong> 会把某一层的输入直接加到它的输出上，避免信息在经过很多层之后逐渐衰减。在 GPT-2 中，每个块都会使用两次残差连接，以便更有效地训练更深的堆叠结构。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['.operation-col.residual', '.residual-start']);
					drawLine();
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['.operation-col.residual', '.residual-start']);
			removeLine();
		}
	},
	{
		id: 'layer-normalization',
		title: '层归一化（Layer Normalization）',
		content: `<p><strong>层归一化（Layer Normalization）</strong> 通过调整输入数值，使其均值和方差保持稳定，从而帮助稳定训练与推理过程。这会降低模型对初始权重的敏感性，也让学习过程更高效。在 GPT-2 中，它会用在自注意力之前、MLP 之前，以及最终输出之前的一次归一化步骤中。</p>`,
		on: () => {
			highlightElements(['.operation-col.ln']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.ln']);
		}
	},
	{
		id: 'dropout',
		title: 'Dropout（随机失活）',
		content: `<p>在训练过程中，<strong>dropout（随机失活）</strong> 会随机关闭一部分连接，避免模型对某些特定模式过拟合。这有助于它学到更具泛化能力的特征。GPT-2 使用了 dropout，但较新的大语言模型往往会省略它，因为它们基于极大的数据集训练，过拟合通常不是那么突出的问题。在推理阶段，dropout 会被关闭。</p>`,
		on: () => {
			highlightElements(['.operation-col.dropout']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.dropout']);
		}
	}
	// {
	// 	id: 'final',
	// 	title: `Let's explore!`,
	// 	content: '',
	// 	on: () => {},
	// 	out: () => {}
	// }
];
