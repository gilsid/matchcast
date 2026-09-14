import type { Match } from './types';

// Group matches by round, ascending. Pure view helper shared by the
// Bracket component and its tests.
export function groupByRound(matches: Match[]): [number, Match[]][] {
	const rounds = new Map<number, Match[]>();
	for (const m of matches) {
		if (!rounds.has(m.round)) rounds.set(m.round, []);
		rounds.get(m.round)!.push(m);
	}
	return Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);
}

// Highest round number, not group count: rounds may be non-contiguous.
export function maxRound(groups: [number, Match[]][]): number {
	if (groups.length === 0) return 0;
	return groups[groups.length - 1]?.[0] ?? 0;
}
