<script lang="ts">
  let {
    class: className = "",
    variant = "text",
  }: {
    class?: string;
    variant?: "text" | "card" | "avatar";
  } = $props();
</script>

{#if variant === "text"}
  <div
    class="h-4 w-full animate-pulse rounded-none bg-border-subtle {className}"
  ></div>
{:else if variant === "card"}
  <div
    class="h-24 w-full animate-pulse rounded-none bg-bg-surface {className}"
  ></div>
{:else if variant === "avatar"}
  <div
    class="h-10 w-10 animate-pulse rounded-full bg-border-subtle {className}"
  ></div>
{/if}
