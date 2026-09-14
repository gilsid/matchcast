<script lang="ts">
	let {
		class: className = '',
		label = 'Loading'
	}: {
		class?: string;
		label?: string;
	} = $props();
</script>

<div class="flex items-center gap-2 {className}">
	<span
		class="inline-block h-2 w-2 rounded-full bg-accent-live"
		style="animation: live-pulse 2s ease-in-out infinite"
	></span>
	<span
		class="inline-block h-2 w-2 rounded-full bg-accent-live"
		style="animation: live-pulse 2s ease-in-out infinite 0.3s"
	></span>
	<span
		class="inline-block h-2 w-2 rounded-full bg-accent-live"
		style="animation: live-pulse 2s ease-in-out infinite 0.6s"
	></span>
	<span class="font-mono text-xs uppercase tracking-wider text-text-muted">{label}</span>
</div>
