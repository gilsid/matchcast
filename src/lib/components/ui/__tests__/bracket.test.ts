import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Bracket from '../bracket.svelte';

const baseMatch = {
	id: 'm1',
	tournamentId: 't1',
	round: 1,
	matchOrder: 1,
	homeTeamId: 'h1',
	awayTeamId: 'a1',
	homeScore: null,
	awayScore: null,
	winnerTeamId: null,
	status: 'scheduled',
	homeTeam: { id: 'h1', name: 'Tim A' },
	awayTeam: { id: 'a1', name: 'Tim B' },
	winnerTeam: null
};

describe('Bracket', () => {
	it('renders scheduled match', () => {
		render(Bracket, { props: { matches: [baseMatch] } });
		expect(screen.getByText('Tim A')).toBeTruthy();
		expect(screen.getByText('Tim B')).toBeTruthy();
		expect(screen.getByText(/Babak 1/)).toBeTruthy();
	});

	it('renders finished match with winner score', () => {
		const finished = {
			...baseMatch,
			status: 'finished',
			homeScore: 3,
			awayScore: 1,
			winnerTeamId: 'h1',
			winnerTeam: { id: 'h1', name: 'Tim A' }
		};
		render(Bracket, { props: { matches: [finished] } });
		expect(screen.getByText('3')).toBeTruthy();
		expect(screen.getByText('1')).toBeTruthy();
		expect(screen.getByText(/Selesai/)).toBeTruthy();
	});

	it('groups matches by round', () => {
		const matches = [
			baseMatch,
			{
				...baseMatch,
				id: 'm2',
				round: 2,
				matchOrder: 1,
				homeTeamId: null,
				awayTeamId: null,
				homeTeam: null,
				awayTeam: null
			}
		];
		render(Bracket, { props: { matches } });
		expect(screen.getByText(/Babak 1/)).toBeTruthy();
		expect(screen.getByText(/Babak 2/)).toBeTruthy();
	});

	it('shows admin buttons when admin=true', () => {
		render(Bracket, { props: { matches: [baseMatch], admin: true } });
		expect(screen.getByText('Mulai')).toBeTruthy();
	});
});
