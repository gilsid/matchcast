<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiLogin } from '$lib/api/auth';
	import AuthForm from '$lib/components/ui/auth-form.svelte';
	import Input from '$lib/components/ui/input.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		try {
			await apiLogin(email, password);
			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login gagal';
		} finally {
			loading = false;
		}
	}
</script>

<AuthForm
	title="Login"
	subtitle="Masuk ke akun penyelenggara"
	{error}
	{loading}
	submitLabel="Login"
	onsubmit={handleLogin}
>
	{#snippet children()}
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
				placeholder="Your password"
				required
			/>
		</div>
	{/snippet}
	{#snippet footer()}
		<p class="text-text-muted font-mono text-xs">
			Belum punya akun? <a href="/register" class="text-accent-primary hover:underline">Register</a>
		</p>
	{/snippet}
</AuthForm>
