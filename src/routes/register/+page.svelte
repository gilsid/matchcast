<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiRegister } from '$lib/api/auth';
	import AuthForm from '$lib/components/ui/auth-form.svelte';
	import Input from '$lib/components/ui/input.svelte';

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
			goto('/login');
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
	{#snippet children()}
		<div class="space-y-1.5">
			<label for="name" class="text-xs font-semibold uppercase tracking-wider text-text-primary"
				>Nama</label
			>
			<Input id="name" bind:value={name} placeholder="Nama kamu" required />
		</div>
		<div class="space-y-1.5">
			<label for="email" class="text-xs font-semibold uppercase tracking-wider text-text-primary"
				>Email</label
			>
			<Input id="email" type="email" bind:value={email} placeholder="you@example.com" required />
		</div>
		<div class="space-y-1.5">
			<label for="password" class="text-xs font-semibold uppercase tracking-wider text-text-primary"
				>Password</label
			>
			<Input
				id="password"
				type="password"
				bind:value={password}
				placeholder="Min 8 karakter"
				required
				minlength={8}
			/>
		</div>
	{/snippet}
	{#snippet footer()}
		<p class="text-text-muted font-mono text-xs">
			Sudah punya akun? <a href="/login" class="text-accent-primary hover:underline">Login</a>
		</p>
	{/snippet}
</AuthForm>
