<script lang="ts">
  import type { Match } from "$lib/api/tournament";

  let {
    match,
    open,
    onsubmit,
    onclose,
  }: {
    match: Match;
    open: boolean;
    onsubmit: (homeScore: number, awayScore: number) => void;
    onclose: () => void;
  } = $props();

  let homeScore = $state<number | string>("");
  let awayScore = $state<number | string>("");
  let validationError = $state("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    validationError = "";

    const h = typeof homeScore === "string" ? parseInt(homeScore) : homeScore;
    const a = typeof awayScore === "string" ? parseInt(awayScore) : awayScore;

    if (isNaN(h) || isNaN(a) || homeScore === "" || awayScore === "") {
      validationError = "Skor tidak boleh kosong";
      return;
    }
    if (h < 0 || a < 0) {
      validationError = "Skor tidak boleh negatif";
      return;
    }
    if (h === a) {
      validationError = "Skor tidak boleh seri (knockout)";
      return;
    }

    onsubmit(h, a);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onclose();
  }

  function reset() {
    homeScore = "";
    awayScore = "";
    validationError = "";
  }

  $effect(() => {
    if (open) reset();
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    onclick={onclose}
    onkeydown={handleKeydown}
    role="dialog"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="clipped bg-bg-surface border border-border-subtle w-full max-w-sm p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="font-display mb-4 text-lg font-bold uppercase tracking-wide">
        Input Skor
      </h3>
      <form onsubmit={handleSubmit} class="space-y-4">
        <div class="space-y-2">
          <label for="home-score" class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary">
            {match.homeTeam?.name ?? "Home"}
          </label>
          <input
            id="home-score"
            type="number"
            min="0"
            bind:value={homeScore}
            placeholder="0"
            required
            class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-center text-2xl font-display font-bold text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          />
        </div>
        <div class="text-center font-mono text-xs uppercase tracking-wider text-text-muted">VS</div>
        <div class="space-y-2">
          <label for="away-score" class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary">
            {match.awayTeam?.name ?? "Away"}
          </label>
          <input
            id="away-score"
            type="number"
            min="0"
            bind:value={awayScore}
            placeholder="0"
            required
            class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-center text-2xl font-display font-bold text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          />
        </div>
        {#if validationError}
          <p class="text-accent-live font-mono text-xs">{validationError}</p>
        {/if}
        <div class="flex gap-3">
          <button type="button" onclick={onclose}
            class="clipped-sm flex-1 border border-border-subtle px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-text-primary transition-colors hover:bg-bg-base">
            Batal
          </button>
          <button type="submit"
            class="clipped-sm flex-1 bg-accent-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90">
            Simpan
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}