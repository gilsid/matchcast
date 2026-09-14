<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { apiRegister } from '$lib/api/auth';
	import AuthForm from '$lib/components/ui/auth-form.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleRegister(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		try {
			await apiRegister(email, password, name);
			await goto(resolve('/login'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registrasi gagal';
		} finally {
			loading = false;
		}
	}
</script>

<AuthForm
	title="Register"
	subtitle="Buat akun penyelenggara baru"
	{error}
	{loading}
	submitLabel="Register"
	onsubmit={handleRegister}
>
	<div class="space-y-1.5">
		<label for="name" class="text-xs font-semibold uppercase tracking-wider text-text-primary"
			>Nama</label
		>
		<input
			id="name"
			bind:value={name}
			placeholder="Nama kamu"
			required
			class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
		/>
	</div>
	<div class="space-y-1.5">
		<label for="email" class="text-xs font-semibold uppercase tracking-wider text-text-primary"
			>Email</label
		>
		<input
			id="email"
			type="email"
			bind:value={email}
			placeholder="you@example.com"
			required
			class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
		/>
	</div>
	<div class="space-y-1.5">
		<label for="password" class="text-xs font-semibold uppercase tracking-wider text-text-primary"
			>Password</label
		>
		<input
			id="password"
			type="password"
			bind:value={password}
			placeholder="Min 8 karakter"
			required
			minlength={8}
			class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
		/>
	</div>
	{#snippet footer()}
		<p class="text-text-muted font-mono text-xs">
			Sudah punya akun?
			<a href={resolve('/login')} class="text-accent-primary hover:underline">Login</a>
		</p>
	{/snippet}
</AuthForm>
