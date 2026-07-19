import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ScoreModal from '../score-modal.svelte';

const mockMatch = {
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

describe('ScoreModal', () => {
	it('renders content when open=true', () => {
		render(ScoreModal, {
			props: { match: mockMatch, open: true, onsubmit: () => {}, onclose: () => {} }
		});
		expect(screen.getByText(/Input Skor/)).toBeTruthy();
		expect(screen.getByText('Tim A')).toBeTruthy();
		expect(screen.getByText('Tim B')).toBeTruthy();
	});

	it('renders nothing when open=false', () => {
		const { container } = render(ScoreModal, {
			props: { match: mockMatch, open: false, onsubmit: () => {}, onclose: () => {} }
		});
		expect(container.innerHTML.trim()).toBe('<!---->');
	});
});
