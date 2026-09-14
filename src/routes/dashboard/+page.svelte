<script lang="ts">
	import { createTournament, apiLogout } from '$lib/api/tournament';
	import type { Tournament } from '$lib/types';
	import { invalidateAll, goto } from '$app/navigation';

	let { data }: { data: { tournaments: Tournament[] } } = $props();

	let tournaments = $derived(data.tournaments);
	let error = $state('');

	let name = $state('');
	let sport = $state('');
	let creating = $state(false);
	let createError = $state('');

	async function handleLogout() {
		try {
			await apiLogout();
			goto('/login');
		} catch {}
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		creating = true;
		createError = '';
		try {
			await createTournament({ name, sport });
			name = '';
			sport = '';
			await invalidateAll();
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Gagal membuat turnamen';
		} finally {
			creating = false;
		}
	}
</script>

<div class="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
	<div class="mb-6 flex items-start justify-between">
		<div class="space-y-1">
			<h1 class="font-display text-3xl font-bold uppercase tracking-wide">Dashboard</h1>
			<p class="text-text-muted font-mono text-xs uppercase tracking-wider">Kelola turnamen kamu</p>
		</div>
		<button
			onclick={handleLogout}
			class="clipped-sm border border-border-subtle px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-accent-live hover:border-accent-live/50"
		>
			Logout
		</button>
	</div>

	<div class="bg-bg-surface clipped border border-border-subtle mb-8 p-5 sm:p-6">
		<h2 class="font-display mb-4 text-xl font-bold uppercase tracking-wide">Buat Turnamen Baru</h2>
		<form onsubmit={handleCreate} class="space-y-4">
			<div class="space-y-1.5">
				<label
					for="name"
					class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary"
					>Nama Turnamen</label
				>
				<input
					id="name"
					bind:value={name}
					placeholder="Futsal RT 05 2026"
					required
					class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
				/>
			</div>
			<div class="space-y-1.5">
				<label
					for="sport"
					class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary"
					>Olahraga</label
				>
				<input
					id="sport"
					bind:value={sport}
					placeholder="futsal"
					required
					class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
				/>
			</div>
			{#if createError}
				<p class="text-accent-live font-mono text-xs">{createError}</p>
			{/if}
			<button
				type="submit"
				disabled={creating}
				class="clipped-sm bg-accent-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
			>
				{creating ? 'Membuat...' : 'Buat Turnamen'}
			</button>
		</form>
	</div>

	<div class="space-y-3">
		<h2 class="font-display text-xl font-bold uppercase tracking-wide">Turnamen Kamu</h2>
		{#if error}
			<p class="text-accent-live font-mono text-xs">{error}</p>
		{:else if tournaments.length === 0}
			<p class="text-text-muted font-mono text-xs">Belum ada turnamen.</p>
		{:else}
			<div class="grid gap-3">
				{#each tournaments as t}
					<a href={`/tournaments/${t.id}`} class="block w-full text-left">
						<div
							class="bg-bg-surface clipped border border-border-subtle p-4 transition-colors hover:border-accent-primary/50"
						>
							<div class="flex items-center justify-between">
								<div class="min-w-0 flex-1">
									<p class="font-display truncate text-base font-bold uppercase tracking-wide">
										{t.name}
									</p>
									<p class="text-text-muted font-mono text-xs uppercase tracking-wider">
										{t.sport} · {t.status}
									</p>
								</div>
								<p class="text-text-muted ml-3 font-mono text-xs">{t._count?.teams ?? 0} tim</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
