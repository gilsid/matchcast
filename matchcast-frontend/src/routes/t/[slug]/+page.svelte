<script lang="ts">
  import { onDestroy } from "svelte";
  import { page } from "$app/state";
  import { getPublicTournament } from "$lib/api/tournament";
  import type { Tournament } from "$lib/api/tournament";
  import Bracket from "$lib/components/ui/bracket.svelte";

  let {
    data,
  }: {
    data: { tournament: Tournament | null; error: boolean };
  } = $props();

  let tournament = $state<Tournament | null>(data.tournament);
  let error = $state(data.error ? "Tournament not found" : "");

  let pollTimer: ReturnType<typeof setTimeout> | undefined;

  async function poll() {
    try {
      tournament = await getPublicTournament(page.params.slug!);
      error = "";
    } catch (e) {
      // silently retry
    } finally {
      pollTimer = setTimeout(poll, 12000);
    }
  }

  $effect(() => {
    if (!error) pollTimer = setTimeout(poll, 12000);
    return () => { if (pollTimer) clearTimeout(pollTimer); };
  });

  onDestroy(() => {
    if (pollTimer) clearTimeout(pollTimer);
  });
</script>

<svelte:head>
  <title>{tournament?.name ?? "Turnamen"} - Tournament Manager</title>
</svelte:head>

<div class="mx-auto min-h-screen max-w-3xl space-y-4 p-4 sm:p-6">
  {#if error}
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
            <span class="bg-bg-surface clipped-sm border-border-subtle text-text-primary px-3 py-1 text-sm uppercase tracking-wide" style="border-color: var(--color-border-subtle); border-width: 1px; border-style: solid;">
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
