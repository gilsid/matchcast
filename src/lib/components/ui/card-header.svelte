<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { children: Snippet } = $props();
</script>

<div class={cn('flex flex-col space-y-1.5 px-4 py-3 sm:px-5 sm:py-4', className)} {...restProps}>
	{@render children()}
</div>
