<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import {
    getTournament,
    addTeam,
    deleteTeam,
    generateBracket,
    updateMatchScore,
    type Tournament,
    type Match,
  } from "$lib/api/tournament";

  const id = $derived(page.params.id);

  let tournament = $state<Tournament | null>(null);
  let loading = $state(true);
  let error = $state("");

  let teamName = $state("");
  let adding = $state(false);
  let teamError = $state("");

  let generating = $state(false);
  let bracketGenerated = $state(false);

  async function load() {
    loading = true;
    error = "";
    try {
      tournament = await getTournament(id);
      bracketGenerated = tournament.status !== "draft";
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal memuat turnamen";
    } finally {
      loading = false;
    }
  }

  async function handleAdd(e: Event) {
    e.preventDefault();
    adding = true;
    teamError = "";
    try {
      await addTeam(id, teamName);
      teamName = "";
      await load();
    } catch (e) {
      teamError = e instanceof Error ? e.message : "Gagal menambah tim";
    } finally {
      adding = false;
    }
  }

  async function handleDelete(teamId: string) {
    try {
      await deleteTeam(id, teamId);
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal menghapus tim";
    }
  }

  async function handleGenerateBracket() {
    generating = true;
    try {
      await generateBracket(id);
      bracketGenerated = true;
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal generate bracket";
    } finally {
      generating = false;
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

  async function handleScore(match: Match, homeScore: number, awayScore: number) {
    try {
      await updateMatchScore(match.id, homeScore, awayScore);
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal update skor";
    }
  }

  onMount(load);
</script>

<div class="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
  <button class="text-text-muted font-mono text-xs uppercase tracking-wider hover:text-accent-primary" onclick={() => goto("/dashboard")}>
    &larr; Kembali ke Dashboard
  </button>

  {#if loading}
    <p class="text-text-muted mt-8 font-mono text-xs">Memuat...</p>
  {:else if error}
    <div class="mt-8">
      <p class="text-accent-live font-mono text-xs">{error}</p>
    </div>
  {:else if tournament}
    <div class="mt-4 space-y-1">
      <h1 class="font-display text-3xl font-bold uppercase tracking-wide">{tournament.name}</h1>
      <p class="text-text-muted font-mono text-xs uppercase tracking-wider">{tournament.sport} · {tournament.status}</p>
    </div>

    {#if !bracketGenerated}
      <div class="bg-bg-surface clipped border border-border-subtle mt-6 p-5 sm:p-6">
        <h2 class="font-display mb-4 text-lg font-bold uppercase tracking-wide">
          Tim ({tournament.teams?.length ?? 0})
        </h2>
        <form onsubmit={handleAdd} class="mb-4 flex items-end gap-3">
          <div class="flex-1 space-y-1.5">
            <label for="team" class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary">Nama Tim</label>
            <input id="team" bind:value={teamName} placeholder="Tim A" required
              class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" />
          </div>
          <button type="submit" disabled={adding}
            class="clipped-sm bg-accent-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50">
            {adding ? "Menambah..." : "Tambah"}
          </button>
        </form>
        {#if teamError}
          <p class="text-accent-live font-mono text-xs">{teamError}</p>
        {/if}
      </div>

      {#if tournament.teams && tournament.teams.length > 0}
        <div class="mt-4 space-y-2">
          {#each tournament.teams as team}
            <div class="bg-bg-surface clipped-sm border border-border-subtle flex items-center justify-between p-3">
              <p class="font-display text-sm font-bold uppercase tracking-wide">{team.name}</p>
              <button onclick={() => handleDelete(team.id)}
                class="font-mono text-xs uppercase tracking-wider text-accent-live hover:text-accent-live/80">
                Hapus
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-text-muted mt-4 font-mono text-xs">Belum ada tim.</p>
      {/if}

      {#if tournament.teams && tournament.teams.length >= 2}
        <div class="bg-bg-surface clipped mt-8 border border-accent-primary/30 p-5 sm:p-6">
          <button onclick={handleGenerateBracket} disabled={generating}
            class="clipped-sm w-full bg-accent-primary px-6 py-3 text-base font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50">
            {generating ? "Generate Bracket..." : "Generate Bracket"}
          </button>
          <p class="text-text-muted mt-2 text-center font-mono text-xs">
            Tim akan diacak. Jumlah ganjil mendapat bye otomatis.
          </p>
        </div>
      {/if}
    {:else}
      <div class="mt-6 space-y-6">
        <h2 class="font-display text-xl font-bold uppercase tracking-wide">Bracket</h2>
        {#each groupByRound(tournament.matches) as [round, matches]}
          <div class="space-y-2">
            <div class="bg-bg-surface clipped-sm inline-block border border-border-subtle px-3 py-1">
              <span class="font-mono text-text-muted text-xs uppercase tracking-wider">Babak {round}</span>
            </div>
            <div class="space-y-2">
              {#each matches as match}
                <div class="bg-bg-surface clipped border border-border-subtle p-3 sm:p-4">
                  <div class="flex items-center justify-center gap-2 sm:gap-3">
                    <div class="min-w-0 flex-1 text-right">
                      {#if match.homeTeam}
                        <p class="font-display truncate text-sm font-bold uppercase tracking-wide sm:text-base">{match.homeTeam.name}</p>
                      {:else}
                        <p class="text-text-muted font-mono text-xs">(Menunggu)</p>
                      {/if}
                      {#if match.homeScore !== null}
                        <p class="scoreboard-font mt-1 text-xl sm:text-2xl {match.winnerTeamId === match.homeTeamId ? 'text-accent-primary' : 'text-text-muted'}">{match.homeScore}</p>
                      {/if}
                    </div>

                    <div class="flex-shrink-0 text-center">
                      {#if match.status === "finished" && match.winnerTeam}
                        <p class="text-text-muted font-mono text-xs">Selesai</p>
                        <p class="font-mono text-[10px] text-accent-primary uppercase tracking-wider">Winner</p>
                      {:else if match.homeTeam && match.awayTeam}
                        <button onclick={() => {
                          const h = parseInt(prompt(`Skor ${match.homeTeam?.name} (home):`) ?? "0");
                          const a = parseInt(prompt(`Skor ${match.awayTeam?.name} (away):`) ?? "0");
                          if (!isNaN(h) && !isNaN(a)) handleScore(match, h, a);
                        }}
                          class="clipped-sm bg-accent-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white hover:bg-accent-primary/90">
                          Isi Skor
                        </button>
                      {:else}
                        <p class="text-text-muted font-mono text-xs">Menunggu</p>
                      {/if}
                      <p class="text-text-muted mt-1 font-mono text-[10px] uppercase tracking-wider">R{round}·M{String(match.matchOrder).padStart(2, "0")}</p>
                    </div>

                    <div class="min-w-0 flex-1">
                      {#if match.awayTeam}
                        <p class="font-display truncate text-sm font-bold uppercase tracking-wide sm:text-base">{match.awayTeam.name}</p>
                      {:else}
                        <p class="text-text-muted font-mono text-xs">(Menunggu)</p>
                      {/if}
                      {#if match.awayScore !== null}
                        <p class="scoreboard-font mt-1 text-xl sm:text-2xl {match.winnerTeamId === match.awayTeamId ? 'text-accent-primary' : 'text-text-muted'}">{match.awayScore}</p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
