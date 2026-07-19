import { describe, it, expect } from "vitest";
import { nextPowerOf2, shuffleArray } from "../bracket.service";

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
