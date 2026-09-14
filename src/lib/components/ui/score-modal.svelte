<script lang="ts">
	import { tick } from 'svelte';
	import type { Match } from '$lib/types';

	let {
		match,
		open,
		onsubmit,
		onclose
	}: {
		match: Match;
		open: boolean;
		onsubmit: (homeScore: number, awayScore: number) => void;
		onclose: () => void;
	} = $props();

	let homeScore = $state<number | string>('');
	let awayScore = $state<number | string>('');
	let validationError = $state('');

	let dialogEl: HTMLDivElement | undefined = $state();
	let homeInputEl: HTMLInputElement | undefined = $state();

	function handleSubmit(e: Event) {
		e.preventDefault();
		validationError = '';

		const h = typeof homeScore === 'string' ? parseInt(homeScore) : homeScore;
		const a = typeof awayScore === 'string' ? parseInt(awayScore) : awayScore;

		if (isNaN(h) || isNaN(a) || homeScore === '' || awayScore === '') {
			validationError = 'Skor tidak boleh kosong';
			return;
		}
		// Domain checks (integer, range, no tie) live in updateMatchScore.

		onsubmit(h, a);
	}

	function onEscape(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) onclose();
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function reset() {
		homeScore = '';
		awayScore = '';
		validationError = '';
	}

	$effect(() => {
		if (open) {
			reset();
			tick().then(() => homeInputEl?.focus());
		}
	});
</script>

<svelte:window onkeydown={onEscape} />

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events: backdrop closes on outside click, Escape handled on window -->
	<div
		bind:this={dialogEl}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
		onclick={onBackdropClick}
		role="presentation"
	>
		<div
			class="clipped bg-bg-surface border border-border-subtle w-full max-w-sm p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="score-modal-title"
			tabindex="-1"
			onkeydown={(e) => {
				// focus trap: Tab on last focusable cycles to first
				if (e.key === 'Tab' && !e.shiftKey) {
					const focusable = dialogEl?.querySelectorAll<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					);
					if (
						focusable &&
						focusable.length > 0 &&
						document.activeElement === focusable[focusable.length - 1]
					) {
						e.preventDefault();
						focusable[0].focus();
					}
				}
				// focus trap: Shift+Tab on first focusable cycles to last
				if (e.key === 'Tab' && e.shiftKey) {
					const focusable = dialogEl?.querySelectorAll<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					);
					if (focusable && focusable.length > 0 && document.activeElement === focusable[0]) {
						e.preventDefault();
						focusable[focusable.length - 1].focus();
					}
				}
			}}
		>
			<h3
				id="score-modal-title"
				class="font-display mb-4 text-lg font-bold uppercase tracking-wide"
			>
				Input Skor
			</h3>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="space-y-2">
					<label
						for="home-score"
						class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary"
					>
						{match.homeTeam?.name ?? 'Home'}
					</label>
					<input
						id="home-score"
						bind:this={homeInputEl}
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
					<label
						for="away-score"
						class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary"
					>
						{match.awayTeam?.name ?? 'Away'}
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
					<p class="text-accent-live font-mono text-xs" role="alert">{validationError}</p>
				{/if}
				<div class="flex gap-3">
					<button
						type="button"
						onclick={onclose}
						class="clipped-sm flex-1 border border-border-subtle px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-text-primary transition-colors hover:bg-bg-base"
					>
						Batal
					</button>
					<button
						type="submit"
						class="clipped-sm flex-1 bg-accent-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90"
					>
						Simpan
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
