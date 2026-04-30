<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import InputForm from '~/components/InputForm.svelte';
	import { ga } from '~/utils/event';
	import Sampling from '~/components/Sampling.svelte';

	export let isActive;

	// Check if current page is about page
	$: isAboutPage = $page.url.pathname === '/about';
</script>

<div class="top-bar flex w-full items-center gap-4 px-10 py-2 pb-3" class:active={isActive}>
	<div class="logo text-bold text-gray-700" data-click="logo">
		TRANSFORMER EXPLAINER
	</div>
	<div class="inputs flex grow items-center">
		<div class="input-wrapper w-full" class:active={isActive}>
			{#if !isAboutPage}
				<InputForm />
			{/if}
		</div>
	</div>
	<div class="icons flex items-center gap-3">
		<!-- arxiv -->
		<a href="https://arxiv.org/abs/2408.04619" target="_blank" data-click="pdf-btn">
			<svg
				class="h-6 w-6 text-gray-800 dark:text-white"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					fill-rule="evenodd"
					d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2h-7Zm-6 9a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h.5a2.5 2.5 0 0 0 0-5H5Zm1.5 3H6v-1h.5a.5.5 0 0 1 0 1Zm4.5-3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1.376A2.626 2.626 0 0 0 15 15.375v-1.75A2.626 2.626 0 0 0 12.375 11H11Zm1 5v-3h.375a.626.626 0 0 1 .625.626v1.748a.625.625 0 0 1-.626.626H12Zm5-5a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h1a1 1 0 1 0 0-2h-1v-1h1a1 1 0 1 0 0-2h-2Z"
					clip-rule="evenodd"
				/>
			</svg>
		</a>
		<!-- original project demo site -->
		<a
			href="https://poloclub.github.io/transformer-explainer/"
			target="_blank"
			data-click="orig_demo_btn"
		>
			<svg
				class="h-6 w-6 text-gray-800 dark:text-white"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm6 8h-2.1a6.978 6.978 0 00-1.02-2.53A8.012 8.012 0 0118 10zM12 4c1.48 0 2.9.44 4.1 1.2A10.02 10.02 0 0012 9c-1.86 0-3.6.48-5.1 1.3A8.01 8.01 0 0112 4zm-6 6a8.01 8.01 0 012.9-3.3C9.4 9.48 10.86 10 12 10c1.14 0 2.6-.52 3.1-3.3A8.01 8.01 0 016 10zm6 10c-1.48 0-2.9-.44-4.1-1.2A10.02 10.02 0 0012 15c1.86 0 3.6-.48 5.1-1.3A8.01 8.01 0 0112 20zM18 14a8.01 8.01 0 01-2.9 3.3C14.6 14.52 13.14 14 12 14c-1.14 0-2.6.52-3.1 3.3A8.01 8.01 0 0118 14z"/>
			</svg>
		</a>
		<!-- repo -->
		<a
			href="https://github.com/Y-chen3164553757/transformer-explainer-Chinese"
			target="_blank"
			data-click="github_btn"
		>
			<svg
				class="h-6 w-6 text-gray-800 dark:text-white"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					fill-rule="evenodd"
					d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z"
					clip-rule="evenodd"
				/>
			</svg>
		</a>
	</div>
</div>

<style lang="scss">
	.top-bar {
		background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0) 100%);
		.input-wrapper {
			&.active {
				opacity: 1;
				pointer-events: initial;
			}
			opacity: 0;
			transition: opacity 0.2s;
			pointer-events: none;
		}
		.logo {
			flex-shrink: 0;
			white-space: nowrap;
			font-family:
				'Jersey 10',
				'Noto Sans SC',
				'PingFang SC',
				'Microsoft YaHei',
				sans-serif;

			font-optical-sizing: auto;
			font-style: normal;

			font-size: 1.85rem;
			// color: theme('colors.blue.800');

			background: linear-gradient(
				to right,
				theme('colors.blue.500') 0%,
				theme('colors.purple.500') 60%
			);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;

			.small {
				font-size: 1.65rem;
			}
		}
		.icons {
			flex-shrink: 0;
			svg {
				fill: theme('colors.gray.600');
			}
		}
	}
</style>
