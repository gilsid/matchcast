<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/state";
  import { getPublicTournament, type Tournament, type Match } from "$lib/api/tournament";

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

  function groupByRound(matches: Match[]) {
    const rounds = new Map<number, Match[]>();
    for (const m of matches) {
      if (!rounds.has(m.round)) rounds.set(m.round, []);
      rounds.get(m.round)!.push(m);
    }
    return Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);
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
      <div class="space-y-6">
        {#each groupByRound(tournament.matches) as [round, matches]}
          <div>
            <div class="bg-bg-surface clipped mb-3 inline-block px-3 py-1">
              <span class="font-mono text-text-muted text-xs tracking-wider uppercase">Babak {round}</span>
            </div>
            <div class="space-y-2">
              {#each matches as match}
                <div class="bg-bg-surface clipped relative border border-border-subtle p-3 sm:p-4">
                  <div class="flex items-center justify-center gap-2 sm:gap-3">
                    <div class="min-w-0 flex-1 text-right">
                      <p class="font-display truncate text-base font-bold uppercase tracking-wide sm:text-lg">
                        {match.homeTeam?.name ?? "?"}
                      </p>
                      {#if match.homeScore !== null}
                        <p class="scoreboard-font mt-1 text-2xl sm:text-3xl {match.winnerTeamId === match.homeTeamId ? 'text-accent-primary' : 'text-text-muted'}">
                          {match.homeScore}
                        </p>
                      {/if}
                    </div>

                    <div class="flex-shrink-0 text-center">
                      {#if match.status === "ongoing"}
                        <div class="live-badge">Live</div>
                      {:else if match.status === "finished"}
                        <p class="text-text-muted font-mono text-xs">Selesai</p>
                      {:else}
                        <p class="text-text-muted font-mono text-xs tracking-wider uppercase">vs</p>
                      {/if}
                      <div class="mt-1">
                        <span class="font-mono text-text-muted text-[10px] tracking-wider uppercase">
                          R{round}·M{String(match.matchOrder).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    <div class="min-w-0 flex-1">
                      <p class="font-display truncate text-base font-bold uppercase tracking-wide sm:text-lg">
                        {match.awayTeam?.name ?? "?"}
                      </p>
                      {#if match.awayScore !== null}
                        <p class="scoreboard-font mt-1 text-2xl sm:text-3xl {match.winnerTeamId === match.awayTeamId ? 'text-accent-primary' : 'text-text-muted'}">
                          {match.awayScore}
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
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
