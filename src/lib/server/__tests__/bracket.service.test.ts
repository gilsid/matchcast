import { describe, it, expect } from 'vitest';
import { planBracketMatches } from '../bracket.service';

function seeds(n: number) {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${i + 1}`,
		name: `Tim ${i + 1}`,
		seed: i + 1
	}));
}

describe('planBracketMatches', () => {
	it('4 teams: numbering restarts per round', () => {
		const matches = planBracketMatches(seeds(4));
		expect(matches.map((m) => [m.round, m.matchOrder])).toEqual([
			[1, 1],
			[1, 2],
			[2, 1]
		]);
	});

	it('6 teams: bye slots land outside propagate slots', () => {
		const matches = planBracketMatches(seeds(6));
		expect(matches).toHaveLength(5);
		const round2 = matches.filter((m) => m.round === 2);
		expect(round2.map((m) => m.matchOrder)).toEqual([1, 2]);
		// First round-2 match waits for round-1 winners; second holds both byes.
		expect([round2[0]?.homeTeamId, round2[0]?.awayTeamId]).toEqual([null, null]);
		expect(round2[1]?.homeTeamId).toBe('t1');
		expect(round2[1]?.awayTeamId).toBe('t2');
		expect(matches.filter((m) => m.round === 3).map((m) => m.matchOrder)).toEqual([1]);
	});

	it('8 teams: full bracket with per-round numbering', () => {
		const matches = planBracketMatches(seeds(8));
		expect(matches).toHaveLength(7);
		expect(matches.filter((m) => m.round === 2).map((m) => m.matchOrder)).toEqual([1, 2]);
		expect(matches.filter((m) => m.round === 3).map((m) => m.matchOrder)).toEqual([1]);
	});
});
