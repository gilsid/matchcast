<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { getHealth } from '$lib/api/health';

	let status = $state<{ loading: boolean; data: string | null; error: string | null }>({
		loading: true,
		data: null,
		error: null
	});

	async function checkHealth() {
		status.loading = true;
		status.error = null;
		try {
			const res = await getHealth();
			status.data = res.status;
		} catch (e) {
			status.error = e instanceof Error ? e.message : 'Koneksi gagal';
		} finally {
			status.loading = false;
		}
	}

	onMount(checkHealth);
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
	<h1 class="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
		Tournament Manager
	</h1>
	<p class="text-text-muted font-mono text-xs uppercase tracking-wider">
		Kelola turnamen olahraga amatir dengan mudah
	</p>

	<div class="flex gap-3">
		<a
			href={resolve('/login')}
			class="clipped-sm inline-flex h-10 items-center justify-center bg-accent-primary px-6 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90"
		>
			Login
		</a>
		<a
			href={resolve('/register')}
			class="clipped-sm inline-flex h-10 items-center justify-center border border-border-subtle px-6 text-sm font-semibold uppercase tracking-wider text-text-primary transition-colors hover:bg-bg-surface"
		>
			Register
		</a>
	</div>

	{#if status.loading}
		<p class="text-text-muted font-mono text-xs">Menghubungkan ke server...</p>
	{:else if status.error}
		<p class="text-accent-live font-mono text-xs">Server tidak merespon — {status.error}</p>
	{:else}
		<p class="text-text-muted font-mono text-xs">Server: {status.data}</p>
	{/if}
</div>
