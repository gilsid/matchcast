<script lang="ts">
  import type { Match } from "$lib/api/tournament";

  let {
    matches,
    admin = false,
    onstart,
    onscore,
    clazz = "",
  }: {
    matches: Match[];
    admin?: boolean;
    onstart?: (matchId: string) => void;
    onscore?: (match: Match) => void;
    clazz?: string;
  } = $props();

  function groupByRound(matches: Match[]) {
    const rounds = new Map<number, Match[]>();
    for (const m of matches) {
      if (!rounds.has(m.round)) rounds.set(m.round, []);
      rounds.get(m.round)!.push(m);
    }
    return Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);
  }

  const roundGroups = $derived(groupByRound(matches));
  const maxRounds = $derived(roundGroups.length);
</script>

<div class="bracket-grid {clazz}">
  {#each roundGroups as [round, ms], ri}
    <div class="bracket-col">
      <div class="bg-bg-surface clipped-sm inline-block border border-border-subtle mb-3 px-3 py-1">
        <span class="font-mono text-text-muted text-xs uppercase tracking-wider">Babak {round}</span>
      </div>

      <div class="bracket-matches">
        {#each ms as match, mi}
          <div class="bracket-match">
            <!-- connector from previous round -->
            {#if round > 1}
              <div class="bracket-line-top" class:active={match.homeTeamId !== null || match.awayTeamId !== null}></div>
            {/if}

            <div class="bg-bg-surface clipped border border-border-subtle p-3 sm:p-4">
              <div class="flex items-center justify-center gap-2 sm:gap-3">
                <div class="min-w-0 flex-1 text-right">
                  <p class="font-display truncate text-sm font-bold uppercase tracking-wide sm:text-base">
                    {match.homeTeam?.name ?? "?"}
                  </p>
                  {#if match.homeScore !== null}
                    <p class="scoreboard-font mt-1 text-xl sm:text-2xl {match.winnerTeamId === match.homeTeamId ? 'text-accent-primary' : 'text-text-muted'}">
                      {match.homeScore}
                    </p>
                  {/if}
                </div>

                <div class="flex-shrink-0 text-center">
                  {#if match.status === "finished" && match.winnerTeam}
                    <p class="text-text-muted font-mono text-xs">Selesai</p>
                    <p class="font-mono text-[10px] text-accent-primary uppercase tracking-wider">Winner</p>
                  {:else if match.status === "ongoing" && match.homeTeam && match.awayTeam}
                    {#if admin}
                      <button onclick={() => onscore?.(match)}
                        class="clipped-sm bg-accent-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white hover:bg-accent-primary/90">
                        Isi Skor
                      </button>
                    {/if}
                    <div class="live-badge mt-1 inline-block">Live</div>
                  {:else if match.status === "scheduled" && match.homeTeam && match.awayTeam}
                    {#if admin}
                      <button onclick={() => onstart?.(match.id)}
                        class="clipped-sm border border-accent-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-primary hover:bg-accent-primary/10">
                        Mulai
                      </button>
                    {:else}
                      <p class="text-text-muted font-mono text-xs tracking-wider uppercase">vs</p>
                    {/if}
                  {:else}
                    <p class="text-text-muted font-mono text-xs">Menunggu</p>
                  {/if}
                  <p class="text-text-muted mt-1 font-mono text-[10px] uppercase tracking-wider">R{round}·M{String(match.matchOrder).padStart(2, "0")}</p>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="font-display truncate text-sm font-bold uppercase tracking-wide sm:text-base">
                    {match.awayTeam?.name ?? "?"}
                  </p>
                  {#if match.awayScore !== null}
                    <p class="scoreboard-font mt-1 text-xl sm:text-2xl {match.winnerTeamId === match.awayTeamId ? 'text-accent-primary' : 'text-text-muted'}">
                      {match.awayScore}
                    </p>
                  {/if}
                </div>
              </div>
            </div>

            <!-- connector to next round -->
            {#if round < maxRounds}
              <div class="bracket-line-bottom" class:active={match.winnerTeamId !== null}></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .bracket-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .bracket-grid {
      flex-direction: row;
      justify-content: center;
      gap: 2rem;
      overflow-x: auto;
      padding-bottom: 1rem;
    }

    .bracket-col {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .bracket-matches {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      gap: 1rem;
      flex: 1;
    }

    .bracket-match {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* horizontal connector line */
    .bracket-match::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 100%;
      width: 2rem;
      height: 2px;
      background: #2A3142;
    }

    .bracket-match::after {
      background: #5B6EF5;
    }

    .bracket-col:last-child .bracket-match::after {
      display: none;
    }

    .bracket-line-top,
    .bracket-line-bottom {
      display: none;
    }
  }

  @media (max-width: 767px) {
    .bracket-line-top,
    .bracket-line-bottom {
      width: 2px;
      height: 0.75rem;
      margin: 0 auto;
      background: #2A3142;
      transition: background 0.3s;
    }

    .bracket-line-top.active,
    .bracket-line-bottom.active {
      background: #5B6EF5;
    }
  }
</style>