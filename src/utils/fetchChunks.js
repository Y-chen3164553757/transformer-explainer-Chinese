const CACHE_PREFIX = 'onnx-model-cache';

function getCacheName(cacheVersion = 'v2') {
	return `${CACHE_PREFIX}-${cacheVersion}`;
}

async function fetchModelChunks(chunkUrls, cacheVersion = 'v2') {
	const cacheName = getCacheName(cacheVersion);
	await clearOldCaches(cacheName);

	let hasCache = false;
	const cache = await caches.open(cacheName);
	const cachedResponses = await Promise.all(chunkUrls.map((url) => cache.match(url)));

	// add cache
	const fetchPromises = chunkUrls.map((url, index) => {
		if (!cachedResponses[index]) {
			// console.log(`Fetching and caching: ${url}`);
			return fetch(url).then((response) => {
				if (response.ok) {
					cache.put(url, response.clone());
					return response.arrayBuffer();
				} else {
					throw new Error(`Failed to fetch ${url}`);
				}
			});
		} else {
			hasCache = true;
			// console.log(`Using cached version: ${url}`);
			return cachedResponses[index].arrayBuffer();
		}
	});

	const modelBuffers = await Promise.all(fetchPromises);
	return { hasCache, modelBuffers };
}

export async function fetchAndMergeChunks(urls, cacheVersion = 'v2') {
	const { hasCache, modelBuffers: chunks } = await fetchModelChunks(urls, cacheVersion);
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
