<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './button.svelte';

	let {
		title,
		subtitle,
		error = '',
		loading = false,
		submitLabel = 'Submit',
		loadingLabel = 'Memproses...',
		onsubmit = (e: Event) => e.preventDefault(),
		children,
		footer
	}: {
		title: string;
		subtitle: string;
		error?: string;
		loading?: boolean;
		submitLabel?: string;
		loadingLabel?: string;
		onsubmit?: (e: Event) => void;
		children: Snippet;
		footer: Snippet;
	} = $props();
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm space-y-6">
		<div class="space-y-1 text-center">
			<h1 class="font-display text-3xl font-bold uppercase tracking-wide">{title}</h1>
			<p class="text-text-muted font-mono text-xs uppercase tracking-wider">{subtitle}</p>
		</div>
		<div class="bg-bg-surface clipped border border-border-subtle p-6">
			<form {onsubmit} class="space-y-4">
				{@render children()}
				{#if error}
					<p class="text-accent-live font-mono text-xs">{error}</p>
				{/if}
				<Button type="submit" disabled={loading} class="w-full">
					{loading ? loadingLabel : submitLabel}
				</Button>
			</form>
			{#if footer}
				<div class="mt-4 text-center">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
</div>
