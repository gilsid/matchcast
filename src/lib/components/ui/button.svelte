<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		children,
		...restProps
	}: HTMLButtonAttributes & {
		variant?: 'default' | 'outline' | 'ghost';
		size?: 'default' | 'sm' | 'lg';
		children: Snippet;
	} = $props();

	const variants: Record<string, string> = {
		default: 'bg-accent-primary text-primary-foreground hover:bg-accent-primary/90',
		outline: 'border border-border-subtle bg-transparent hover:bg-bg-surface',
		ghost: 'hover:bg-bg-surface'
	};

	const sizes: Record<string, string> = {
		default: 'h-10 px-4 py-2 text-sm',
		sm: 'h-8 px-3 text-xs',
		lg: 'h-12 px-6 text-base'
	};
</script>

<button
	class={cn(
		'clipped-sm inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
		variants[variant],
		sizes[size],
		className
	)}
	{...restProps}
>
	{@render children()}
</button>
