<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let { class: className, type = "text", ...restProps }: HTMLInputAttributes = $props();
</script>

<input
  {type}
  class={cn(
    "clipped-sm flex h-10 w-full border border-border-subtle bg-bg-surface px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className,
  )}
  {...restProps}
/>
