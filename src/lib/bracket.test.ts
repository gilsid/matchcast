import { describe, it, expect } from 'vitest';
import { groupByRound, maxRound } from './bracket';
import type { Match } from './types';

function match(id: string, round: number, matchOrder: number): Match {
	return {
		id,
		tournamentId: 't1',
		round,
		matchOrder,
		homeTeamId: null,
		awayTeamId: null,
		homeScore: null,
		awayScore: null,
		winnerTeamId: null,
		status: 'scheduled'
	};
}

describe('groupByRound', () => {
	it('groups and sorts ascending', () => {
		const groups = groupByRound([match('m2', 2, 1), match('m1', 1, 1)]);
		expect(groups.map(([r]) => r)).toEqual([1, 2]);
		expect(groups[0]?.[1].map((m) => m.id)).toEqual(['m1']);
	});
});

describe('maxRound', () => {
	it('returns 0 for empty', () => {
		expect(maxRound([])).toBe(0);
	});

	it('returns highest round, not group count', () => {
		// Non-contiguous rounds: count would say 2, answer is 3.
		const groups = groupByRound([match('m1', 1, 1), match('m3', 3, 1)]);
		expect(maxRound(groups)).toBe(3);
	});
});
