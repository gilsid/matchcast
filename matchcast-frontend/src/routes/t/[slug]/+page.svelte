<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/state";
  import { getPublicTournament } from "$lib/api/tournament";
  import Bracket from "$lib/components/ui/bracket.svelte";

  const slug = $derived(page.params.slug);

  let tournament = $state<Tournament | null>(null);
  let loading = $state(true);
  let error = $state("");
  let pollInterval: ReturnType<typeof setInterval> | undefined;

  async function load() {
    try {
      tournament = await getPublicTournament(slug);
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load tournament";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    load();
    pollInterval = setInterval(load, 12000);
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
  });
</script>

<svelte:head>
  <title>{tournament?.name ?? "Turnamen"} - Tournament Manager</title>
</svelte:head>

<div class="mx-auto min-h-screen max-w-3xl space-y-4 p-4 sm:p-6">
  {#if loading}
    <p class="text-text-muted text-center text-sm">Memuat...</p>
  {:else if error}
    <div class="flex min-h-[50vh] flex-col items-center justify-center">
      <p class="text-accent-live text-lg">{error}</p>
      <p class="text-text-muted mt-2 text-sm">Link mungkin tidak valid atau turnamen sudah dihapus.</p>
    </div>
  {:else if tournament}
    <div class="space-y-1">
      <h1 class="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">{tournament.name}</h1>
      <p class="text-text-muted text-xs uppercase tracking-wider">{tournament.sport} · {tournament.status === "ongoing" ? "Sedang Berlangsung" : tournament.status === "finished" ? "Selesai" : "Draft"}</p>
    </div>

    {#if tournament.matches && tournament.matches.length > 0}
      <Bracket matches={tournament.matches} clazz="mt-2" />
    {:else}
      <p class="text-text-muted py-8 text-center">Belum ada pertandingan. Bracket belum di-generate.</p>
    {/if}

    {#if tournament.teams && tournament.teams.length > 0}
      <details class="mt-6">
        <summary class="text-text-muted cursor-pointer font-mono text-xs uppercase tracking-wider">
          Tim ({tournament.teams.length})
        </summary>
        <div class="mt-2 flex flex-wrap gap-2">
          {#each tournament.teams as team}
            <span class="bg-bg-surface clipped-sm border-border-subtle text-text-primary px-3 py-1 text-sm uppercase tracking-wide" style="border: 1px solid #2A3142;">
              {team.name}
            </span>
          {/each}
        </div>
      </details>
    {/if}

    <p class="text-text-muted mt-6 text-center font-mono text-[10px] tracking-wider">
      Skor diperbarui otomatis setiap 12 detik
    </p>
  {/if}
</div>
