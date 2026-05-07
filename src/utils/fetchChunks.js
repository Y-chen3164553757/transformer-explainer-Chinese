const CACHE_PREFIX = 'onnx-model-cache';

function getCacheName(cacheVersion = 'v2') {
	return `${CACHE_PREFIX}-${cacheVersion}`;
}

async function fetchModelChunks(chunkUrls, cacheVersion = 'v2', onProgress = null) {
	const cacheName = getCacheName(cacheVersion);
	await clearOldCaches(cacheName);

	let hasCache = false;
	const cache = await caches.open(cacheName);
	const cachedResponses = await Promise.all(chunkUrls.map((url) => cache.match(url)));

	const modelBuffers = new Array(chunkUrls.length);
	const maxConcurrency = 3; // Limit concurrent downloads
	let currentIndex = 0;
	let completedChunks = 0;

	const reportProgress = () => {
		if (onProgress) {
			onProgress(completedChunks, chunkUrls.length);
		}
	};

	async function fetchWorker() {
		while (currentIndex < chunkUrls.length) {
			const index = currentIndex++;
			const url = chunkUrls[index];

			if (!cachedResponses[index]) {
				// console.log(`Fetching and caching: ${url}`);
				try {
					const response = await fetch(url);
					if (response.ok) {
						cache.put(url, response.clone());
						modelBuffers[index] = await response.arrayBuffer();
						completedChunks++;
						reportProgress();
					} else {
						throw new Error(`Failed to fetch ${url}`);
					}
				} catch (error) {
					console.error(`Error fetching chunk ${index}:`, error);
					throw error;
				}
			} else {
				hasCache = true;
				// console.log(`Using cached version: ${url}`);
				modelBuffers[index] = await cachedResponses[index].arrayBuffer();
				completedChunks++;
				reportProgress();
			}
		}
	}

	const workers = [];
	for (let i = 0; i < maxConcurrency; i++) {
		workers.push(fetchWorker());
	}
	
	await Promise.all(workers);

	return { hasCache, modelBuffers };
}

export async function fetchAndMergeChunks(urls, cacheVersion = 'v2', onProgress = null) {
	const { hasCache, modelBuffers: chunks } = await fetchModelChunks(urls, cacheVersion, onProgress);
	const totalSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
	const mergedArray = new Uint8Array(totalSize);
	let offset = 0;
	for (const chunk of chunks) {
		mergedArray.set(new Uint8Array(chunk), offset);
		offset += chunk.byteLength;
	}
	return { hasCache, mergedArray: mergedArray.buffer };
}

async function clearOldCaches(activeCacheName) {
	const cacheNames = await caches.keys();
	await Promise.all(
		cacheNames.map((name) => {
			if (name !== activeCacheName && name.includes(CACHE_PREFIX)) {
				console.log(`Deleting old cache: ${name}`);
				return caches.delete(name);
			}
		})
	);
}
