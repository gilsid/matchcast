<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLLabelAttributes & { children: Snippet } = $props();
</script>

<label
	class={cn(
		'font-body text-sm font-semibold uppercase tracking-wider text-text-primary',
		className
	)}
	{...restProps}
>
	{@render children()}
</label>
