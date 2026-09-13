<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { navigating } from '$app/stores';
  import Spinner from '$lib/components/ui/spinner.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if $navigating}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80">
    <Spinner />
  </div>
{/if}

{@render children()}
