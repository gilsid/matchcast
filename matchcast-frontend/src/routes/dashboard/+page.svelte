<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { listTournaments, createTournament, type Tournament } from "$lib/api/tournament";

  let tournaments = $state<Tournament[]>([]);
  let loading = $state(true);
  let error = $state("");

  let name = $state("");
  let sport = $state("");
  let creating = $state(false);
  let createError = $state("");

  async function load() {
    loading = true;
    error = "";
    try {
      tournaments = await listTournaments();
    } catch (e) {
      error = e instanceof Error ? e.message : "Gagal memuat data";
    } finally {
      loading = false;
    }
  }

  async function handleCreate(e: Event) {
    e.preventDefault();
    creating = true;
    createError = "";
    try {
      await createTournament({ name, sport });
      name = "";
      sport = "";
      await load();
    } catch (e) {
      createError = e instanceof Error ? e.message : "Gagal membuat turnamen";
    } finally {
      creating = false;
    }
  }

  onMount(load);
</script>

<div class="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
  <div class="mb-6 space-y-1">
    <h1 class="font-display text-3xl font-bold uppercase tracking-wide">Dashboard</h1>
    <p class="text-text-muted font-mono text-xs uppercase tracking-wider">Kelola turnamen kamu</p>
  </div>

  <div class="bg-bg-surface clipped border border-border-subtle mb-8 p-5 sm:p-6">
    <h2 class="font-display mb-4 text-xl font-bold uppercase tracking-wide">Buat Turnamen Baru</h2>
    <form onsubmit={handleCreate} class="space-y-4">
      <div class="space-y-1.5">
        <label for="name" class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary">Nama Turnamen</label>
        <input id="name" bind:value={name} placeholder="Futsal RT 05 2026" required
          class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" />
      </div>
      <div class="space-y-1.5">
        <label for="sport" class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary">Olahraga</label>
        <input id="sport" bind:value={sport} placeholder="futsal" required
          class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" />
      </div>
      {#if createError}
        <p class="text-accent-live font-mono text-xs">{createError}</p>
      {/if}
      <button type="submit" disabled={creating}
        class="clipped-sm bg-accent-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50">
        {creating ? "Membuat..." : "Buat Turnamen"}
      </button>
    </form>
  </div>

  <div class="space-y-3">
    <h2 class="font-display text-xl font-bold uppercase tracking-wide">Turnamen Kamu</h2>
    {#if loading}
      <p class="text-text-muted font-mono text-xs">Memuat...</p>
    {:else if error}
      <p class="text-accent-live font-mono text-xs">{error}</p>
    {:else if tournaments.length === 0}
      <p class="text-text-muted font-mono text-xs">Belum ada turnamen.</p>
    {:else}
      <div class="grid gap-3">
        {#each tournaments as t}
          <button onclick={() => goto(`/tournaments/${t.id}`)} class="w-full text-left">
            <div class="bg-bg-surface clipped border border-border-subtle p-4 transition-colors hover:border-accent-primary/50">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="font-display truncate text-base font-bold uppercase tracking-wide">{t.name}</p>
                  <p class="text-text-muted font-mono text-xs uppercase tracking-wider">{t.sport} · {t.status}</p>
                </div>
                <p class="text-text-muted ml-3 font-mono text-xs">{t._count?.teams ?? 0} tim</p>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
