import { PreTrainedTokenizer } from '@xenova/transformers';
import * as ort from 'onnxruntime-web';
import {
	modelData,
	tokens,
	tokenIds,
	isModelRunning,
	predictedToken,
	modelSession,
	defaultModelId,
	getRuntimeModelMeta,
	selectedModel
} from '~/store';
import { get } from 'svelte/store';
import { reshapeArray } from './array';
import { showFlowAnimation } from './animation';

export const fakeRunWithCachedData = async ({
	cachedData,
	tokenizer,
	temperature,
	sampling
}: {
	cachedData: any;
	tokenizer: PreTrainedTokenizer;
	temperature: number;
	sampling: Sampling;
}) => {
	isModelRunning.set(true);
	predictedToken.set(undefined);

	modelData.set(cachedData);
	tokens.set(cachedData.tokens);
	tokenIds.set(cachedData.tokenIds);

	setTimeout(async () => {
		await showFlowAnimation(cachedData.tokens.length, true);
		adjustTemperature({
			tokenizer,
			logits: cachedData.logits,
			temperature,
			sampling
		});
		isModelRunning.set(false);
	}, 0);
};

export const runModel = async ({
	tokenizer,
	input,
	temperature,
	sampling
}: {
	tokenizer: PreTrainedTokenizer;
	input: string;
	temperature: number;
	sampling: Sampling;
}) => {
	isModelRunning.set(true);
	predictedToken.set(undefined);

	try {
		const { token_ids, input_tokens } = await getTokenization(tokenizer, input === '' ? ' ' : input);

		let isOneTokenAdded: boolean;
		tokens.set(input_tokens);
		tokenIds.update((prev) => {
			isOneTokenAdded =
				prev.length === token_ids.length - 1 && prev.every((id, idx) => id === token_ids[idx]);
			return token_ids;
		});

		const { logits, outputs } = await getData(token_ids);

		const { probabilities, sampled } = getProbabilities({ tokenizer, logits, sampling, temperature });

		modelData.set({ logits, outputs, probabilities, sampled });

		// To ensure the animation starts after all elements have been rendered
		setTimeout(async () => {
			await showFlowAnimation(input_tokens.length, isOneTokenAdded);

			predictedToken.set(sampled);
			isModelRunning.set(false);
		}, 0);
	} catch (error) {
		console.error('Failed to run model:', error);
		alert('运行模型推理失败！错误信息: ' + error.message);
		isModelRunning.set(false);
	}
};

const setPredictedTokenForAnimation = (probabilities, sampled, sampling) => {
	let delay = 10;
	let topK = probabilities.slice(0, sampling.value);
	let animationTokens = [...topK, ...topK.slice(sampled.rank).reverse()];

	for (let i = 0; i < animationTokens.length; i++) {
		setTimeout(() => {
			predictedToken.set(animationTokens[i]);
		}, i * delay);
	}
};

export const adjustTemperature = async ({
	tokenizer,
	logits,
	temperature,
	sampling
}: {
	tokenizer: PreTrainedTokenizer;
	logits: number[];
	temperature: number;
	sampling: Sampling;
}) => {
	const { probabilities, sampled } = getProbabilities({ tokenizer, logits, sampling, temperature });

	modelData.update((d) => ({ ...d, probabilities, sampled }));

	predictedToken.set(sampled);
	// setPredictedTokenForAnimation(probabilities, sampled, sampling);
};

export const getTokenization = async (tokenizer: PreTrainedTokenizer, input: string) => {
	const token_ids = tokenizer.encode(input, null, { add_special_tokens: false });
	// 逐个 decode 取单字，替换 BERT wordpiece 的 ## 前缀
	const input_tokens = token_ids.map((id: number) =>
		formatTokenForDisplay(tokenizer.decode([id]))
	);

	return {
		token_ids,
		input_tokens
	};
};

export const getData = async (token_ids: number[]) => {
	try {
		// Convert token_ids to tensor
		const inputTensor = new ort.Tensor('int64', token_ids, [1, token_ids.length]);

		// Get the session from the store
		const session = get(modelSession);
		if (!session) {
			throw new Error('Model session is not initialized.');
		}

		// Prepare the feeds (inputs) dynamically depending on the model
		const inputName = session.inputNames[0] || 'input_ids';
		const feeds = { [inputName]: inputTensor };

		const runtimeModelMeta = getRuntimeModelMeta(get(selectedModel));
		const layerNum = runtimeModelMeta.layer_num;
		const headNum = runtimeModelMeta.attention_head_num;

		// Optimize: specify exactly what outputs to fetch, skipping unused hidden states
		const outputNames = ['logits'];
		for (let i = 0; i < layerNum; i++) {
			outputNames.push(`attentions_${i}`);
		}

		// Run inference
		const results = await session.run(feeds, outputNames);

		// Extract the logits
		const logitsTensor = results['logits'] || results['linear_output'];
		if (!logitsTensor) {
			throw new Error('Logits output not found in model results.');
		}

		const seqLen = token_ids.length;
		const vocabSize = logitsTensor.dims[logitsTensor.dims.length - 1];
		const fullLogits = logitsTensor.data as Float32Array;

		// Slice logits to extract only the last token's logits (size [vocabSize])
		const logits = Array.from(
			fullLogits.subarray((seqLen - 1) * vocabSize, seqLen * vocabSize)
		);

		// Extract the dictionary values
		const outputs = {} as ModelData['outputs'];

		for (let i = 0; i < layerNum; i++) {
			const attnTensor = results[`attentions_${i}`];
			
			if (attnTensor && 'dims' in attnTensor) {
				const fullData = attnTensor.data as Float32Array;
				const headDim = seqLen * seqLen;
				
				for (let j = 0; j < headNum; j++) {
					// Use subarray view to avoid copy and Array.from for fast array conversion
					const start = j * headDim;
					const headData = fullData.subarray(start, start + headDim);
					const matrix = reshapeArray(Array.from(headData), [seqLen, seqLen]);
					
					const suffixes = ["attn", "attn_scaled", "attn_masked", "attn_softmax", "attn_dropout"];
					for (const suffix of suffixes) {
						outputs[`block_${i}_attn_head_${j}_${suffix}`] = {
							data: matrix
						};
					}
				}
			} else {
				// Fallback to old behavior or mock if missing
				for (let j = 0; j < headNum; j++) {
					const suffixes = ["attn", "attn_scaled", "attn_masked", "attn_softmax", "attn_dropout"];
					for (const suffix of suffixes) {
						const key = `block_${i}_attn_head_${j}_${suffix}`;
						const out = results[key];
						if (out) {
							outputs[key] = {
								data: reshapeArray(Array.from(out.cpuData as Float32Array), out.dims)
							};
						} else {
							const mockMatrix = reshapeArray(new Array(seqLen * seqLen).fill(1 / seqLen), [seqLen, seqLen]);
							outputs[key] = {
								data: mockMatrix
							};
						}
					}
				}
			}
		}

		return {
			logits,
			outputs
		};
	} catch (error) {
		console.error('Error during inference:', error.message);
		throw error;
	}
};

export const getProbabilities = ({
	tokenizer,
	logits,
	sampling = { type: 'top-k', value: 10 },
	temperature = 1
}: {
	tokenizer: PreTrainedTokenizer;
	logits: number[];
	sampling: Sampling;
	temperature: number;
}): { probabilities: Probabilities; sampled: Probability } => {
	if (sampling.type === 'top-p') {
		return topPSampling(tokenizer, logits, sampling.value, temperature);
	} else {
		return topKSampling(tokenizer, logits, sampling.value, temperature);
	}
};

function topKSampling(
	tokenizer: PreTrainedTokenizer,
	logits: number[],
	k: number,
	temperature: number
): { probabilities: Probabilities; sampled: Probability } {
	// Trim the list to a reasonable number that can be displayed on the screen
	const max = 50;
	const sortedLogits = Array.from(logits)
		.map((logit, index) => ({
			tokenId: index,
			logit
		}))
		.sort((a, b) => b.logit - a.logit)
		.slice(0, max);

	// Temperature Scaling
	const scaledLogits = sortedLogits.map((item) => ({
		...item,
		scaledLogit: item.logit / temperature
	}));

	// Apply Top-k: Keep topK logits and set others to -Infinity
	const filteredLogits = scaledLogits.map((item, index) => ({
		...item,
		topKLogit: index < k ? item.scaledLogit : -Infinity
	}));

	// Softmax Normalization
	const topKLogits = filteredLogits.map((item) => item.topKLogit);
	const { expLogits, probabilities } = softmax(topKLogits);

	const output = filteredLogits.map((item, i) => ({
		...item,
		rank: i,
		token: formatTokenForDisplay(tokenizer.decode([item.tokenId])),
		expLogit: expLogits[i],
		probability: probabilities[i]
	}));

	// Sample from the top-k tokens
	const sampled = randomChoice(output);

	return { probabilities: output, sampled };
}

function topPSampling(
	tokenizer: PreTrainedTokenizer,
	logits: number[],
	p: number,
	temperature: number
): { probabilities: Probabilities; sampled: Probability } {
	// Trim the list to a reasonable number that can be displayed on the screen
	const max = 50;
	const sortedLogits = Array.from(logits)
		.map((logit, index) => ({
			tokenId: index,
			logit
		}))
		.sort((a, b) => b.logit - a.logit)
		.slice(0, max);

	// Temperature Scaling
	const scaledLogits = sortedLogits.map((item) => ({
		...item,
		scaledLogit: item.logit / temperature
	}));

	// Softmax Normalization
	const { expLogits, probabilities } = softmax(scaledLogits.map((item) => item.scaledLogit));

	// Compute cumulative probabilities
	const cumulativeProbabilities: number[] = [];
	probabilities.reduce((acc, prob, idx) => {
		cumulativeProbabilities[idx] = acc + prob;
		return cumulativeProbabilities[idx];
	}, 0);

	let cutoffIndex = cumulativeProbabilities.findIndex((cumProb) => cumProb >= p);
	cutoffIndex = cutoffIndex === -1 ? cumulativeProbabilities.length - 1 : cutoffIndex;

	const topIndices = scaledLogits.slice(0, cutoffIndex + 1);
	const topProbabilities = topIndices.map((d, i) => probabilities[i]);

	// Renormalize probabilities for top-p tokens
	const sumTopProbabilities = topProbabilities.reduce((sum, val) => sum + val, 0);
	const newProbabilities = topProbabilities.map((val) => val / sumTopProbabilities);

	// Sample from the top-p tokens
	const output = scaledLogits.map((item, i) => ({
		...item,
		rank: i,
		token: formatTokenForDisplay(tokenizer.decode([item.tokenId])),
		expLogit: expLogits[i],
		probability: newProbabilities[i] || 0,
		topPProbability: probabilities[i], //original
		cumulativeProbability: cumulativeProbabilities[i],
		cutoffIndex
	}));

	const nextToken = randomChoice(output);
	return { probabilities: output, sampled: nextToken };
}

function softmax(logits: number[]): { expLogits: number[]; probabilities: number[] } {
	const maxLogit = Math.max(...logits);
	const expLogits = logits.map((logit) => (logit === -Infinity ? 0 : Math.exp(logit - maxLogit)));
	const sumExpLogits = expLogits.reduce((sum, val) => sum + val, 0);
	const probabilities = expLogits.map((val) => val / sumExpLogits);

	return { expLogits, probabilities };
}

// Helper function to format tokens for display
function formatTokenForDisplay(token: string): string {
	return token
		.replace(/^##/, '')           // 去除 BERT wordpiece 的 ## 前缀
		.replace(/^ /, '')             // 去除 BERT decode 的前导空格
		.replace(/\n/g, '[NEWLINE]')
		.replace(/\t/g, '[TAB]')
		.replace(/\r/g, '[CR]')
		.replace(/\s{2,}/g, (match) => `[${match.length} SPACES]`);
}

// Simulates the np.random.choice function in Python.
function randomChoice(items: Probabilities): Probability {
	const probabilities = items.map((d) => d.probability);

	// Ensure probabilities sum to 1
	// const totalProb = probabilities.reduce((sum, p) => sum + p, 0);
	// if (Math.abs(totalProb - 1.0) > 1e-6) {
	// 	throw new Error('Probabilities must sum to 1.');
	// }

	// Generate a random number between 0 and 1
	const random = Math.random();

	// Accumulate probabilities and find the corresponding item
	let cumulativeProbability = 0;
	for (let i = 0; i < probabilities.length; i++) {
		cumulativeProbability += probabilities[i];
		if (random < cumulativeProbability) {
			return items[i];
		}
	}

	// Fallback in case of numerical issues
	return items[items.length - 1];
}

const runtimeModelMeta = getRuntimeModelMeta(defaultModelId);

const attentionTensors = Array(runtimeModelMeta.layer_num)
	.fill(0)
	.flatMap((_, i) => {
		return Array(runtimeModelMeta.attention_head_num)
			.fill(0)
			.flatMap((_, j) => [
				`block_${i}_attn_head_${j}_attn`,
				`block_${i}_attn_head_${j}_attn_scaled`,
				`block_${i}_attn_head_${j}_attn_masked`,
				`block_${i}_attn_head_${j}_attn_softmax`,
				`block_${i}_attn_head_${j}_attn_dropout`
			]);
	});

const targetTensors = [...attentionTensors];

// const targetTensors = [
// 'tok_emb',
// 'transformer_wpe_weight',
// 'pos_emb',
// 'input_emb',
// 'input_emb_dropout',
// 'block_0_ln_1_input_mean',
// 'block_0_ln_1_input_var',
// 'block_0_ln_1_input_normalized',
// 'block_0_ln_1_weight',
// 'block_0_ln_1_bias',
// 'block_0_ln_1_output',
// 'block_0_attn_head_0_q_weights',
// 'block_0_attn_head_0_k_weights',
// 'block_0_attn_head_0_v_weights',
// 'block_0_attn_head_0_q_bias',
// 'block_0_attn_head_0_k_bias',
// 'block_0_attn_head_0_v_bias',
// 'block_0_attn_head_0_q',
// 'block_0_attn_head_0_k',
// 'block_0_attn_head_0_v',
// 'block_0_attn_head_0_q_transposed',
// 'block_0_attn_head_0_k_transposed',
// 'block_0_attn_head_0_v_transposed',
// 'block_0_attn_head_0_attn',
// 'block_0_attn_head_0_attn_scaled',
// 'block_0_attn_head_0_attn_masked',
// 'block_0_attn_head_0_attn_softmax',
// 'block_0_attn_head_0_attn_dropout',
// 'block_0_attn_head_0_v_output',
// 'block_0_attn_v_output_combined',
// 'block_0_attn_proj_weights',
// 'block_0_attn_proj_bias',
// 'block_0_attn_attn_output',
// 'block_0_res_1',
// 'block_0_ln_2_input_mean',
// 'block_0_ln_2_input_var',
// 'block_0_ln_2_input_normalized',
// 'block_0_ln_2_weight',
// 'block_0_ln_2_bias',
// 'block_0_ln_2_output',
// 'block_0_mlp_linear_1_weight',
// 'block_0_mlp_linear_1_bias',
// 'block_0_mlp_linear_1_output',
// 'block_0_mlp_gelu_output',
// 'block_0_mlp_linear_2_weight',
// 'block_0_mlp_linear_2_bias',
// 'block_0_mlp_linear_2_output',
// 'block_0_mlp_output_after_dropout',
// 'block_0_res_2',
// 'ln_f_input_mean',
// 'ln_f_input_var',
// 'ln_f_input_normalized',
// 'ln_f_weight',
// 'ln_f_bias',
// 'ln_f_output',
// 'linear_weight',
// 	'linear_output'
// ];
