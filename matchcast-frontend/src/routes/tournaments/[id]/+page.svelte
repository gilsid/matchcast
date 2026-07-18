<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import {
    addTeam,
    deleteTeam,
    generateBracket,
    startMatch,
    updateMatchScore,
    type Tournament,
    type Match,
  } from "$lib/api/tournament";
  import ScoreModal from "$lib/components/ui/score-modal.svelte";
  import Bracket from "$lib/components/ui/bracket.svelte";

  let {
    data,
  }: {
    data: { tournament: Tournament };
  } = $props();

  let tournament = $state<Tournament>(data.tournament);
  let error = $state("");

  let teamName = $state("");
  let adding = $state(false);
  let teamError = $state("");

  let generating = $state(false);
  let bracketGenerated = $state(tournament.status !== "draft");

  let scoreMatch = $state<Match | null>(null);
  let showScoreModal = $state(false);

  async function handleAdd(e: Event) {
    e.preventDefault();
    adding = true;
    teamError = "";
    try {
      await addTeam(page.params.id!, teamName);
      teamName = "";
      window.location.reload();
    } catch (e) {
      teamError = e instanceof Error ? e.message : "Gagal menambah tim";
    } finally {
      adding = false;
    }
  }

  async function handleDelete(teamId: string) {
    try {
      await deleteTeam(page.params.id!, teamId);
      window.location.reload();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal menghapus tim";
    }
  }

  async function handleGenerateBracket() {
    generating = true;
    try {
      await generateBracket(page.params.id!);
      window.location.reload();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal generate bracket";
    } finally {
      generating = false;
    }
  }

  async function handleStartMatch(matchId: string) {
    try {
      await startMatch(matchId);
      window.location.reload();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal mulai pertandingan";
    }
  }

  async function handleScore(match: Match, homeScore: number, awayScore: number) {
    try {
      await updateMatchScore(match.id, homeScore, awayScore);
      window.location.reload();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal update skor";
    }
  }
</script>

<div class="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
  <button class="text-text-muted font-mono text-xs uppercase tracking-wider hover:text-accent-primary" onclick={() => goto("/dashboard")}>
    &larr; Kembali ke Dashboard
  </button>

  {#if error}
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
      <div class="mt-6">
        <h2 class="font-display text-xl font-bold uppercase tracking-wide">Bracket</h2>
        <Bracket
          matches={tournament.matches}
          admin={true}
          onstart={handleStartMatch}
          onscore={(m) => { scoreMatch = m; showScoreModal = true; }}
          clazz="mt-4"
        />
      </div>
    {/if}
  {/if}

  {#if scoreMatch}
    <ScoreModal
      match={scoreMatch}
      open={showScoreModal}
      onsubmit={(h, a) => { showScoreModal = false; handleScore(scoreMatch, h, a); }}
      onclose={() => { showScoreModal = false; scoreMatch = null; }}
    />
  {/if}
</div>
