<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let { class: className, children, ...restProps }: HTMLAttributes<HTMLDivElement> & { children: Snippet } = $props();
</script>

<div
  class={cn("bg-card text-card-foreground clipped border border-border-subtle", className)}
  {...restProps}
>
  {@render children()}
</div>
