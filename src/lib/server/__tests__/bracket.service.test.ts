import { describe, it, expect } from "vitest";
import { nextPowerOf2, shuffleArray, planBracketMatches } from "../bracket.service";

describe("nextPowerOf2", () => {
	it("n=1 → 1", () => expect(nextPowerOf2(1)).toBe(1));
	it("n=2 → 2", () => expect(nextPowerOf2(2)).toBe(2));
	it("n=3 → 4", () => expect(nextPowerOf2(3)).toBe(4));
	it("n=5 → 8", () => expect(nextPowerOf2(5)).toBe(8));
	it("n=8 → 8", () => expect(nextPowerOf2(8)).toBe(8));
	it("n=9 → 16", () => expect(nextPowerOf2(9)).toBe(16));
	it("n=16 → 16", () => expect(nextPowerOf2(16)).toBe(16));
	it("n=17 → 32", () => expect(nextPowerOf2(17)).toBe(32));
});

describe("shuffleArray", () => {
	it("returns same length", () => {
		const input = [1, 2, 3, 4, 5];
		expect(shuffleArray(input)).toHaveLength(5);
	});

	it("contains all original elements", () => {
		const input = [1, 2, 3, 4, 5];
		const result = shuffleArray(input);
		expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
	});

	it("does not mutate input", () => {
		const input = [1, 2, 3, 4, 5];
		const copy = [...input];
		shuffleArray(input);
		expect(input).toEqual(copy);
	});

	it("preserves duplicates", () => {
		const input = ["a", "a", "b", "c"];
		const result = shuffleArray(input);
		expect(result.filter((x) => x === "a")).toHaveLength(2);
		expect(result.filter((x) => x === "b")).toHaveLength(1);
	});

	it("empty array returns empty", () => {
		expect(shuffleArray([])).toEqual([]);
	});

	it("single element returns copy", () => {
		const input = [42];
		const result = shuffleArray(input);
		expect(result).toEqual([42]);
		expect(result).not.toBe(input);
	});
});

function seeds(n: number) {
	return Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Tim ${i + 1}`, seed: i + 1 }));
}

describe("planBracketMatches", () => {
	it("4 teams: numbering restarts per round", () => {
		const matches = planBracketMatches(seeds(4), 2, 0, 2);
		expect(matches.map((m) => [m.round, m.matchOrder])).toEqual([
			[1, 1],
			[1, 2],
			[2, 1],
		]);
	});

	it("6 teams: bye slots land outside propagate slots", () => {
		const matches = planBracketMatches(seeds(6), 2, 2, 3);
		expect(matches).toHaveLength(5);
		const round2 = matches.filter((m) => m.round === 2);
		expect(round2.map((m) => m.matchOrder)).toEqual([1, 2]);
		// First round-2 match waits for round-1 winners; second holds both byes.
		expect([round2[0]?.homeTeamId, round2[0]?.awayTeamId]).toEqual([null, null]);
		expect(round2[1]?.homeTeamId).toBe("t1");
		expect(round2[1]?.awayTeamId).toBe("t2");
		expect(matches.filter((m) => m.round === 3).map((m) => m.matchOrder)).toEqual([1]);
	});

	it("8 teams: full bracket with per-round numbering", () => {
		const matches = planBracketMatches(seeds(8), 4, 0, 3);
		expect(matches).toHaveLength(7);
		expect(matches.filter((m) => m.round === 2).map((m) => m.matchOrder)).toEqual([1, 2]);
		expect(matches.filter((m) => m.round === 3).map((m) => m.matchOrder)).toEqual([1]);
	});
});
