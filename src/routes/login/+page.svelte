<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { apiLogin } from '$lib/api/auth';
	import AuthForm from '$lib/components/ui/auth-form.svelte';

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
			await goto(resolve('/dashboard'));
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
			placeholder="Your password"
			required
			class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
		/>
	</div>
	{#snippet footer()}
		<p class="text-text-muted font-mono text-xs">
			Belum punya akun?
			<a href={resolve('/register')} class="text-accent-primary hover:underline">Register</a>
		</p>
	{/snippet}
</AuthForm>
