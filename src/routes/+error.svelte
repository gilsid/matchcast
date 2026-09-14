<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { error } = $props();
</script>

<svelte:head>
	<title>{page.status} - Tournament Manager</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
	<h1 class="font-display text-6xl font-bold uppercase tracking-wide text-accent-primary">
		{page.status}
	</h1>
	<p class="text-text-muted font-mono text-xs uppercase tracking-wider">
		{page.status === 404
			? 'Halaman tidak ditemukan'
			: page.status === 500
				? 'Kesalahan server'
				: 'Terjadi kesalahan'}
	</p>
	{#if error && page.url.pathname !== '/'}
		<p class="text-text-muted max-w-md text-sm">{error.message}</p>
	{/if}
	<a
		href={resolve('/')}
		class="clipped-sm mt-2 inline-flex h-10 items-center justify-center bg-accent-primary px-6 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90"
	>
		Kembali ke Beranda
	</a>
</div>
