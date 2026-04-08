import { writable, derived, readable } from 'svelte/store';
import * as ort from 'onnxruntime-web';
import tailwindConfig from '../../tailwind.config';
import resolveConfig from 'tailwindcss/resolveConfig';
import { ex0 } from '~/constants/examples';
import { textPages } from '~/utils/textbookPages';
import modelConfig from '../../model-config.json';

const { theme } = resolveConfig(tailwindConfig);

export const attentionHeadIdxTemp = writable(0);
export const attentionHeadIdx = writable(0);
export const blockIdxTemp = writable(0);
export const blockIdx = writable(0);
export const isOnBlockTransition = writable(false);

export const isOnAnimation = writable(false);

// Textbook state management
export const textbookCurrentPage = writable<number>(0);
export const textbookPreviousPage = writable<number>(-1);
export const textbookCurrentPageId = writable<string>(textPages[0].id);
export const textbookPreviousPageId = writable<string>('');
export const isTextbookOpen = writable<boolean>(true);

// is transformer running?
export const isModelRunning = writable(false);
export const isFetchingModel = writable(true);
export const isLoaded = writable(false);

export const inputTextExample = modelConfig.examples;

const initialExIdx = 0;
export const selectedExampleIdx = writable<number>(initialExIdx);

export const modelSession = writable<ort.InferenceSession>();

// transformer model output
export const modelData = writable<ModelData>(ex0);
export const predictedToken = writable<Probability | undefined>(undefined);
export const tokens = writable<string[]>(ex0?.tokens);
export const tokenIds = writable<number[]>(ex0?.tokenIds);

export const modelMetaMap: Record<string, ModelMetaData> = {
	gpt2: {
		layer_num: modelConfig.runtime.layerCount,
		attention_head_num: modelConfig.runtime.headCount,
		dimension: modelConfig.runtime.embeddingDim,
		vocabSize: modelConfig.runtime.vocabSize,
		tokenizerId: modelConfig.tokenizerId,
		modelDir: modelConfig.paths.publicModelDir,
		chunkFilePrefix: modelConfig.paths.chunkFilePrefix,
		chunkTotal: modelConfig.runtime.chunkTotal,
		cacheVersion: modelConfig.runtime.cacheVersion
	},
	'gpt2-medium': { layer_num: 24, attention_head_num: 16, dimension: 1024 },
	'gpt2-large': { layer_num: 36, attention_head_num: 20, dimension: 1280 }
};

export const defaultModelId = 'gpt2';

export function getRuntimeModelMeta(modelId = defaultModelId) {
	const modelMeta = modelMetaMap[modelId];
	if (
		!modelMeta ||
		!modelMeta.tokenizerId ||
		!modelMeta.modelDir ||
		!modelMeta.chunkFilePrefix ||
		!modelMeta.chunkTotal ||
		!modelMeta.cacheVersion
	) {
		throw new Error(`Model runtime config is incomplete for ${modelId}`);
	}

	return modelMeta as ModelMetaData & {
		tokenizerId: string;
		modelDir: string;
		chunkFilePrefix: string;
		chunkTotal: number;
		cacheVersion: string;
	};
}

export function getModelChunkUrls(basePath: string, modelId = defaultModelId) {
	const modelMeta = getRuntimeModelMeta(modelId);
	return Array.from({ length: modelMeta.chunkTotal }, (_, index) => {
		return `${basePath}/${modelMeta.modelDir}/${modelMeta.chunkFilePrefix}${index}`;
	});
}

// selected token vector
export const highlightedToken = writable<HighlightedToken>({
	index: null,
	value: null,
	fix: false
});

export const highlightedHead = writable<HighlightedToken>({
	index: null,
	value: null,
	fix: false
});

// expanded block
export const expandedBlock = writable<ExpandedBlock>({ id: null });
export const isExpandOrCollapseRunning = writable(false);

// user input text
export const inputText = writable(inputTextExample[initialExIdx]);
// export const tokens = derived(inputText, ($inputText) => $inputText.trim().split(' '));

// selected model and meta data
const initialSelectedModel = defaultModelId;
export const selectedModel = writable(initialSelectedModel);
export const modelMeta = derived(selectedModel, ($selectedModel) => modelMetaMap[$selectedModel]);

// Temperature setting
export const initialTemperature = 0.8;
export const temperature = writable(initialTemperature);

// Sampling
export const sampling = writable<Sampling>({ type: 'top-k', value: 5 });

// Prediction visual
export const highlightedIndex = writable(null);
export const finalTokenIndex = writable(null);

// Visual element style
export const rootRem = 16;
/** 中文等宽字符需要略大的行高，避免标签与向量块挤在一起 */
export const minVectorHeight = 15;
export const maxVectorHeight = 32;
export const maxVectorScale = 3.05;

export const vectorHeight = writable(0);
export const headContentHeight = writable(0);
export const headGap = { x: 5, y: 8, scale: 0 };

export const isBoundingBoxActive = writable(false);

export const predictedColor = theme.colors.purple[600];

// Interactivity
export const hoveredPath = writable();
export const hoveredMatrixCell = writable({ row: null, col: null });
export const weightPopover = writable();
export const tooltip = writable();

export const isMobile = readable(false, (set) => {
	if (typeof window !== 'undefined') {
		// Only run in browser environment
		const userAgent = navigator.userAgent.toLowerCase();
		set(/android|iphone|ipad|ipod/i.test(userAgent));
	}
	return () => {}; // Cleanup function
});

// User identification
export const userId = writable<string | null>(null);