<script>
	import tailwindConfig from '../../../tailwind.config';
	import resolveConfig from 'tailwindcss/resolveConfig';
	import Katex from '~/utils/Katex.svelte';
</script>

<div id="description">
	<div class="article-section" data-click="article-intro">
		<h1>什么是 Transformer？</h1>

		<p>
			Transformer 是一种神经网络架构，从根本上改变了人工智能的研究范式。它最早出现在 2017 年的开创性论文
			<a
				href="https://dl.acm.org/doi/10.5555/3295222.3295349"
				title="ACM Digital Library"
				target="_blank">《Attention is All You Need》</a
			>中，此后成为深度学习模型的主流架构，驱动了 OpenAI 的 <strong>GPT</strong>、Meta 的 <strong>Llama</strong>、Google 的
			<strong>Gemini</strong> 等文本生成模型。除文本外，Transformer 还被应用于
			<a
				href="https://huggingface.co/learn/audio-course/en/chapter3/introduction"
				title="Hugging Face"
				target="_blank">音频生成</a
			>、
			<a
				href="https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformers-for-image-classification"
				title="Hugging Face"
				target="_blank">图像识别</a
			>、
			<a href="https://elifesciences.org/articles/82819" title="eLife"
				>蛋白质结构预测</a
			>，乃至
			<a
				href="https://www.deeplearning.ai/the-batch/reinforcement-learning-plus-transformers-equals-efficiency/"
				title="Deep Learning AI"
				target="_blank">游戏对弈</a
			>，展示了其在众多领域的强大通用性。
		</p>
		<p>
			从本质上看，文本生成 Transformer 模型遵循<strong>下一词元预测</strong>的原则：给定用户输入的文本提示，
			<em>最有可能跟随该输入的下一个词元（一个词或词的一部分）</em>是什么？Transformer 的核心创新与强大之处在于其自注意力机制，该机制能够处理整个序列，并比以往架构更有效地捕捉远距离依赖关系。
		</p>
		<p>
			GPT-2 系列是文本生成 Transformer 的典型代表。本工具使用
			<a href="https://huggingface.co/openai-community/gpt2" title="Hugging Face" target="_blank"
				>GPT-2</a
			>（small）模型，共拥有 1.24 亿个参数。它虽非最新或最强大的 Transformer 模型，但与当前最先进的模型共享许多相同的架构组件和设计原则，是理解基础知识的理想起点。
		</p>
	</div>

	<div class="article-section" data-click="article-overview">
		<h1>Transformer 架构</h1>

		<p>
			每个文本生成 Transformer 都由以下<strong>三个核心组件</strong>构成：
		</p>
		<ol>
			<li>
				<strong class="bold-purple">嵌入（Embedding）</strong>：文本输入被分割成称为词元的更小单元，可以是单词或子词。这些词元被转换为数值向量（即嵌入），以捕获词语的语义含义。
			</li>
			<li>
				<strong class="bold-purple">Transformer 块</strong>是模型处理和转换输入数据的基本构建单元。每个块包含：
				<ul class="">
					<li>
						<strong>注意力机制</strong>，Transformer 块的核心组件，允许词元之间相互通信，捕获上下文信息和词语间的关系。
					</li>
					<li>
						<strong>MLP（多层感知机）层</strong>，一种对每个词元独立操作的前馈网络。注意力层的目标是在词元之间路由信息，而 MLP 的目标是精炼每个词元的表示。
					</li>
				</ul>
			</li>
			<li>
				<strong class="bold-purple">输出概率</strong>：最终的线性层和 Softmax（归一化）层将处理后的嵌入转换为概率，使模型能够对序列中的下一个词元做出预测。
			</li>
		</ol>
	</div>

	<div class="article-section" id="embedding" data-click="article-embedding">
		<h2>词嵌入（Embedding）</h2>
		<p>
			假设你想用 Transformer 模型生成文字，输入了这样一段提示：<code>"数据可视化帮助用户"</code>。这段输入需要被转换为模型能够理解和处理的格式，这就是词嵌入（Embedding）的作用：它将文本转化为模型可处理的数值表示。将提示转换为嵌入需要经过以下四个步骤：1) 对输入进行分词（Tokenization），2) 获取词元嵌入（Token Embedding），3) 添加位置信息（Positional Encoding），最后 4) 将词元编码与位置编码相加，得到最终的嵌入表示。下面我们逐步了解每个步骤。
		</p>
		<div class="figure">
			<img src="./article_assets/embedding.png" width="65%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">1</span>. 展开词嵌入层视图，展示输入提示如何被转换为向量表示。该过程包括
			<span class="fig-numbering">(1)</span> 分词（Tokenization），(2) 词元嵌入（Token Embedding），(3) 位置编码（Positional Encoding），
			以及 (4) 最终嵌入（Final Embedding）。
		</div>
		<div class="article-subsection">
			<h3>步骤 1：分词（Tokenization）</h3>
			<p>
				分词是将输入文本拆分为更小、更易于处理的单元——词元（Token）的过程。词元可以是一个完整的词，也可以是词的一部分（子词）。词汇表在模型训练前确定：GPT-2 的词汇表共有 <code>50,257</code> 个唯一词元。将输入文本拆分为具有唯一 ID 的词元后，便可从嵌入矩阵中获取其对应的向量表示。
			</p>
		</div>
		<div class="article-subsection" id="article-token-embedding">
			<h3>步骤 2：词元嵌入（Token Embedding）</h3>
			<p>
				GPT-2 (small) 将词汇表中的每个词元表示为一个 768 维向量；向量维度取决于具体模型。这些嵌入向量存储在形状为 <code>(50,257, 768)</code> 的矩阵中，约包含 3,900 万个参数。这一庞大的矩阵使模型能够为每个词元赋予语义信息：在语言中用法或含义相近的词元，在这个高维空间中彼此靠近，而不相似的词元则相距较远。
			</p>
		</div>
		<div class="article-subsection" id="article-positional-embedding">
			<h3>步骤 3：位置编码（Positional Encoding）</h3>
			<p>
				词嵌入层还会编码每个词元在输入提示中的位置信息。不同模型采用不同的位置编码方式。GPT-2 从头开始训练自己的位置编码矩阵，将其直接融入训练过程。
			</p>

			<!-- <div class="article-subsection-l2">
	<h4>Alternative Positional Encoding Approach <strong class='attention'>[POTENTIALLY COLLAPSIBLE]</strong></h4>
	<p>
	  Other models, like the original Transformer and BERT,
	  use sinusoidal functions for positional encoding.

	  This sinusoidal encoding is deterministic and designed to reflect
	  the absolute as well as the relative position of each token.
	</p>
	<p>
	  Each position in a sequence is assigned a unique mathematical
	  representation using a combination of sine and cosine functions.

	  For a given position, the sine function represents even dimensions,
	  and the cosine function represents odd dimensions within the positional encoding vector.

	  This periodic nature ensures that each position has a consistent encoding,
	  independent of the surrounding context.
	</p>

	<p>
	  Here’s how it works:
	</p>

	<span class='attention'>
	  SINUSOIDAL POSITIONAL ENCODING EQUATION
	</span>

	<ul>
	  <li>
		<strong>Sine Function</strong>: Used for even indices of the embedding vector.
	  </li>
	  <li>
		<strong>Cosine Function</strong>: Used for odd indices of the embedding vector.
	</ul>

	<p>
	  Hover over individual encoding values in the matrix above to
	  see how it's calculated using the sins and cosine functions.
	</p>
  </div> -->
		</div>
		<div class="article-subsection">
			<h3>步骤 4：最终嵌入（Final Embedding）</h3>
			<p>
				最后，将词元编码与位置编码相加，得到最终的嵌入表示。这一组合表示同时捕获了词元的语义信息及其在输入序列中的位置信息。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-transformer-block">
		<h2>Transformer 块</h2>

		<p>
			Transformer 处理的核心在于 Transformer 块，它由多头自注意机制和多层感知机（MLP）层组成。大多数模型由多个顺序堆叠的这样的块构成。词元表示从第一个块到最后一个块逐层演化，使模型能够建立对每个词元的深层理解。这种层次化方式带来了输入的高阶表示。我们所考察的 GPT-2 (small) 共有 <code>12</code> 个这样的块。
		</p>
	</div>

	<div class="article-section" id="self-attention" data-click="article-attention">
		<h3>多头自注意机制（Multi-Head Self-Attention）</h3>
		<p>
			自注意机制使模型能够捕捉序列中词元之间的关系，使每个词元的表示受到其他词元的影响。多个注意头让模型能够从不同角度考察这些关系；例如，一个头可能捕捉短距离语法联系，另一个则更关注广泛的语义上下文。下面我们逐步介绍多头自注意的计算过程。
		</p>
		<div class="article-subsection-l2">
			<h4>步骤 1：Query、Key 与 Value 矩阵</h4>

			<div class="figure pt-10">
				<img src="./article_assets/QKV.png" width="80%" />
				<div class="text-xs">
					<Katex
						displayMode
						math={`
		QKV_{ij} = ( \\sum_{d=1}^{768} \\text{Embedding}_{i,d} \\cdot \\text{Weights}_{d,j}) + \\text{Bias}_j
		`}
					/>
				</div>
			</div>
			<div class="figure-caption">
				图 <span class="attention">2</span>. 由原始嵌入计算 Query、Key 和 Value 矩阵。
			</div>

			<p>
				每个词元的嵌入向量被转换为三个向量：
				<span class="q-color">Query (Q)（查询）</span>、
				<span class="k-color">Key (K)（键）</span>和
				<span class="v-color">Value (V)（值）</span>。这三个向量通过将输入嵌入矩阵与对应的可学习权重矩阵相乘得到。以下是一个网页搜索类比，帮助我们建立这些矩阵的直觉：
			</p>
			<ul>
				<li>
					<strong class="q-color font-medium">Query (Q)</strong> 是你在搜索框输入的搜索词。这是你想要“深入了解的”词元。
				</li>
				<li>
					<strong class="k-color font-medium">Key (K)</strong> 是搜索结果中每个网页的标题。它代表 Query 可以关注的候选词元。
				</li>
				<li>
					<strong class="v-color font-medium">Value (V)</strong> 是展示的网页实际内容。一旦匹配到合适的搜索词（Query）与相关结果（Key），我们就要获取最相关页面的内容（Value）。
				</li>
			</ul>
			<p>
				通过使用这些 QKV 值，模型可以计算注意力分数，并确定在生成预测时每个词元应获得多少关注。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>步骤 2：多头分割</h4>
			<p>
				<span class="q-color">Query</span>、<span class="k-color">Key</span> 和
				<span class="v-color">Value</span>
				向量被分割为多个头——在 GPT-2 (small) 中分为 <code>12</code> 个头。每个头独立处理嵌入的一个片段，捕捉不同的语法和语义关系。这种设计支持并行学习多种语言特征，增强了模型的表达能力。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>步骤 3：掩蔽自注意（Masked Self-Attention）</h4>
			<p>
				在每个头中，我们执行掩蔽自注意计算。该机制使模型在生成序列时，能集中关注输入的相关部分，同时阻止其访问未来的词元。
			</p>

			<div class="figure">
				<img src="./article_assets/attention.png" width="80%" align="middle" />
			</div>
			<div class="figure-caption">
				图 <span class="attention">3</span>. 使用 Query、Key 和 Value 矩阵计算掩蔽自注意力。
			</div>

			<ul>
				<li>
					<strong>点积（Dot Product）</strong>：<span class="q-color">Query</span> 与
					<span class="k-color">Key</span> 矩阵的点积决定了<strong>注意力分数</strong>，从而生成一个方阵，用于反映所有输入词元之间的关系。
				</li>
				<li>
					<strong>缩放与掩码（Scaling · Mask）</strong>：注意力分数会先进行缩放，再对注意力矩阵的上三角区域施加掩码，防止模型访问未来词元，并将这些位置的值设为负无穷。模型必须学会在不“偷看”未来的情况下预测下一个词元。
				</li>
				<li>
					<strong>Softmax 与 Dropout</strong>：在掩码和缩放之后，注意力分数会通过 softmax（归一化函数）转换为概率，并可选择进一步使用 dropout（随机失活）做正则化。矩阵的每一行之和都为 1，用来表示当前位置左侧其他词元与它的相关程度。
				</li>
			</ul>
		</div>
		<div class="article-subsection-l2">
			<h4>步骤 4：输出与拼接</h4>
			<p>
				模型将掩蔽自注意分数与 <span class="v-color">Value</span> 矩阵相乘，得到自注意机制的 <span class="purple-color">最终输出</span>。GPT-2 有 <code>12</code> 个自注意头，每个头捕捉不同的词元间关系。各头的输出将被拼接，再经线性投影处理。
			</p>
		</div>
	</div>

	<div class="article-section" id="article-activation" data-click="article-mlp">
		<h3>MLP（多层感知机）</h3>

		<div class="figure">
			<img src="./article_assets/mlp.png" width="70%" align="middle" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">4</span>. 使用 MLP 层将自注意力表示投影到更高维空间，以增强模型的表示能力。
		</div>

		<p>
			当多头自注意机制捕捉到输入词元之间的多样关系后，各个头的拼接输出会被送入多层感知机（MLP）层，以增强模型的表示能力。MLP 模块由两次线性变换组成，中间夹着一个 <a
				href="https://en.wikipedia.org/wiki/Rectified_linear_unit#Gaussian-error_linear_unit_(GELU)"
				>GELU</a
			>（高斯误差线性单元）激活函数。
		</p>
		<p>
			第一次线性变换会将输入维度从 <code>768</code> 扩展四倍到 <code>3072</code>。这一扩展步骤使模型能够将词元表示投影到更高维的空间中，从而捕捉在原始维度下可能并不明显的、更丰富也更复杂的模式。
		</p>
		<p>
			第二次线性变换会再将维度压缩回原始大小 <code>768</code>。这一步在保留扩展阶段引入的有用非线性变换的同时，也让表示重新回到可管理的规模。
		</p>
		<p>
			与在词元之间整合信息的自注意机制不同，MLP 会独立处理每个词元，只是将每个词元表示从一个空间映射到另一个空间，从而提升模型整体的表达能力。
		</p>
	</div>

	<div class="article-section" id="article-prob" data-click="article-prob">
		<h2>输出概率（Output Probabilities）</h2>
		<p>
			当输入经过所有 Transformer 块处理后，输出会进入最终的线性层，为词元预测做准备。这一层会将最终表示投影到一个 <code>50,257</code> 维空间中，词汇表中的每个词元在这里都对应一个称为 <code>logit</code>（未归一化分数）的数值。任何词元都可能成为下一个词，因此这一过程让我们能够按“成为下一个词的可能性”对所有词元进行排序。随后，我们再应用 softmax（归一化函数），将 logits（未归一化分数）转换为总和为 1 的概率分布，从而根据各自的概率对下一个词元进行采样。
		</p>

		<div class="figure py-5">
			<img src="./article_assets/softmax.png" width="70%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">5</span>. 词汇表中的每个词元都会依据模型输出的 logits（未归一化分数）被赋予一个概率，这些概率决定了各个词元成为序列中下一个词的可能性。
		</div>

		<p id="article-temperature" data-click="article-temperature">
			最后一步是从这个分布中采样，生成下一个词元。在这个过程中，<code>temperature</code>（温度）超参数起着关键作用。从数学上讲，它是一个非常简单的操作：将模型输出的 logits 直接除以 <code>temperature</code>：
		</p>

		<ul>
			<li>
				<code>temperature = 1</code>：将 logits 除以 1 不会对 softmax 输出产生任何影响。
			</li>
			<li>
				<code>temperature &lt; 1</code>：更低的温度会让概率分布更尖锐，使模型更“自信”、更具确定性，因此输出也更可预测。
			</li>
			<li>
				<code>temperature &gt; 1</code>：更高的温度会让概率分布更平缓，使生成文本包含更多随机性，也就是一些人所说的模型<em>“创造力”</em>。
			</li>
		</ul>

		<p id="article-sampling" data-click="article-sampling">
			此外，采样过程还可以通过 <code>top-k</code>（保留前 k 个候选）和 <code>top-p</code>（按累计概率截断）参数进一步细化：
		</p>
		<ul>
			<li>
				<code>top-k sampling</code>（前 k 采样）：将候选词元限制为概率最高的前 k 个词元，过滤掉可能性较低的选项。
			</li>
			<li>
				<code>top-p sampling</code>（核采样）：选择累计概率刚好超过阈值 p 的最小词元集合，在保证只保留高可能性候选的同时，仍然允许一定多样性。
			</li>
		</ul>
		<p>
			通过调节 <code>temperature</code>、<code>top-k</code> 和 <code>top-p</code>，你可以在确定性和多样性之间取得平衡，从而按自己的需求调整模型行为。
		</p>
	</div>

	<div class="article-section" data-click="article-advanced-features">
		<h2>辅助架构特性（Auxiliary Architectural Features）</h2>

		<p>
			Transformer 模型还包含若干辅助架构特性，用来提升整体性能。它们虽然对模型效果很重要，但相较于理解架构核心概念，本身并不是最关键的部分。层归一化（Layer Normalization）、Dropout（随机失活）和残差连接（Residual Connections）都是 Transformer 中的重要组件，尤其在训练阶段更为关键。层归一化有助于稳定训练并加快收敛；Dropout 通过随机停用部分神经元来防止过拟合；残差连接则让梯度可以更直接地在网络中传播，从而缓解梯度消失问题。
		</p>
		<div class="article-subsection" id="article-ln">
			<h3>层归一化（Layer Normalization）</h3>

			<p>
				层归一化有助于稳定训练过程并改善收敛表现。它通过在特征维度上对输入进行归一化，确保激活值的均值和方差保持一致。这种归一化能够缓解内部协变量偏移带来的问题，使模型学习更有效，也降低对初始权重的敏感性。在每个 Transformer 块中，层归一化会应用两次：一次在自注意机制之前，一次在 MLP 层之前。
			</p>
		</div>
		<div class="article-subsection" id="article-dropout">
			<h3>Dropout（随机失活）</h3>

			<p>
				Dropout（随机失活）是一种用于防止神经网络过拟合的正则化技术，它会在训练过程中随机将一部分模型连接置零。这会促使模型学习更稳健的特征，减少对特定神经元的依赖，从而帮助网络更好地泛化到新的、未见过的数据上。在模型推理阶段，dropout 会被关闭。从某种意义上说，这相当于利用训练得到的多个子网络的集成效果，因此通常能带来更好的模型表现。
			</p>
		</div>
		<div class="article-subsection" id="article-residual">
			<h3>残差连接（Residual Connections）</h3>

			<p>
				残差连接最早在 2015 年的 ResNet 模型中提出。这一架构创新改变了深度学习的发展轨迹，因为它使训练非常深的神经网络成为可能。残差连接本质上是一种跨越一个或多个层的捷径，它会把某一层的输入直接加到该层输出上。这有助于缓解梯度消失问题，使得训练由多个 Transformer 块堆叠而成的深层网络更容易。在 GPT-2 中，每个 Transformer 块内部会使用两次残差连接：一次在 MLP 之前，一次在之后，以确保梯度更顺畅地传播，并让前面的层在反向传播时获得足够更新。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-interactive-features">
		<h1>交互功能（Interactive Features）</h1>
		<p>
			Transformer Explainer 被设计成交互式工具，让你可以探索 Transformer 的内部工作机制。下面是一些可以直接上手体验的交互功能：
		</p>

		<ul>
			<li>
				<strong>输入你自己的文本序列</strong>，观察模型如何处理输入并预测下一个词。你可以查看注意力权重、中间计算结果，以及最终输出概率是如何得到的。
			</li>
			<li>
				<strong>使用 temperature 滑块</strong> 来控制模型预测的随机性。通过调整温度值，你可以让模型输出更确定，或者更有“创造力”。
			</li>
			<li>
				<strong>选择 top-k 和 top-p 采样方式</strong>，调整推理阶段的采样行为。你可以尝试不同参数，观察概率分布如何变化，以及它们如何影响模型预测。
			</li>
			<li>
				<strong>与注意力图交互</strong>，查看模型如何关注输入序列中的不同词元。将鼠标悬停在词元上即可高亮其注意力权重，并进一步理解模型如何捕捉上下文和词语之间的关系。
			</li>
		</ul>
	</div>

	<div class="article-section" data-click="article-video">
		<h2>视频教程（Video Tutorial）</h2>
		<div class="video-container">
			<iframe
				src="https://www.youtube.com/embed/ECR4oAwocjs"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			>
			</iframe>
		</div>
	</div>

	<div class="article-section" data-click="article-implementation">
		<h2>Transformer Explainer 是如何实现的？</h2>
		<p>
			Transformer Explainer 内置了一个可直接在浏览器中运行的 GPT-2（small）实时模型。该模型源自 Andrej Karpathy 的
			<a href="https://github.com/karpathy/nanoGPT" title="Github" target="_blank"
				>nanoGPT 项目</a
			>
			的 PyTorch 版 GPT 实现，并被转换为
			<a href="https://onnxruntime.ai/" title="ONNX" target="_blank">ONNX Runtime</a>
			格式，以便在浏览器中顺畅执行。界面使用 JavaScript 构建，前端框架采用
			<a href="https://kit.svelte.dev/" title="Svelte" target="_blank">Svelte</a>
			，动态可视化则使用
			<a href="https://d3js.org/" title="D3" target="_blank">D3.js</a>
			实现。所有数值都会随着用户输入实时更新。
		</p>
	</div>

	<div class="article-section" data-click="article-credit">
		<h2>谁开发了 Transformer Explainer？</h2>
		<p>
			Transformer Explainer 由以下成员共同开发：

			<a href="https://aereeeee.github.io/" target="_blank">Aeree Cho</a>,
			<a href="https://www.linkedin.com/in/chaeyeonggracekim/" target="_blank">Grace C. Kim</a>,
			<a href="https://alexkarpekov.com/" target="_blank">Alexander Karpekov</a>,
			<a href="https://alechelbling.com/" target="_blank">Alec Helbling</a>,
			<a href="https://zijie.wang/" target="_blank">Jay Wang</a>,
			<a href="https://seongmin.xyz/" target="_blank">Seongmin Lee</a>,
			<a href="https://bhoov.com/" target="_blank">Benjamin Hoover</a>, and
			<a href="https://poloclub.github.io/polochau/" target="_blank">Polo Chau</a>

			他们均来自佐治亚理工学院（Georgia Institute of Technology）。
		</p>
	</div>
</div>

<style lang="scss">
	a {
		color: theme('colors.blue.500');

		&:hover {
			color: theme('colors.blue.700');
		}
	}

	.bold-purple {
		color: theme('colors.purple.700');
		font-weight: bold;
	}

	code {
		color: theme('colors.gray.500');
		background-color: theme('colors.gray.50');
		font-family: theme('fontFamily.mono');
	}

	.q-color {
		color: theme('colors.blue.400');
	}

	.k-color {
		color: theme('colors.red.400');
	}

	.v-color {
		color: theme('colors.green.400');
	}

	.purple-color {
		color: theme('colors.purple.500');
	}

	.article-section {
		padding-bottom: 2rem;
	}
	.architecture-section {
		padding-top: 1rem;
	}
	.video-container {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		max-width: 100%;
		background: #000;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	#description {
		padding-bottom: 3rem;
		margin-left: auto;
		margin-right: auto;
		max-width: 78ch;
	}

	#description h1 {
		color: theme('colors.purple.700');
		font-size: 2.2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h2 {
		// color: #444;
		color: theme('colors.purple.700');
		font-size: 2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h3 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description h4 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description p {
		margin: 1rem 0;
	}

	#description p img {
		vertical-align: middle;
	}

	#description .figure-caption {
		font-size: 0.8rem;
		margin-top: 0.5rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	#description ol {
		margin-left: 3rem;
		list-style-type: decimal;
	}

	#description li {
		margin: 0.6rem 0;
	}

	#description p,
	#description div,
	#description li {
		color: theme('colors.gray.600');
		line-height: 1.6;
	}

	#description small {
		font-size: 0.8rem;
	}

	#description ol li img {
		vertical-align: middle;
	}

	#description .video-link {
		color: theme('colors.blue.600');
		cursor: pointer;
		font-weight: normal;
		text-decoration: none;
	}

	#description ul {
		list-style-type: disc;
		margin-left: 2.5rem;
		margin-bottom: 1rem;
	}

	#description a:hover,
	#description .video-link:hover {
		text-decoration: underline;
	}

	.figure,
	.video {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
