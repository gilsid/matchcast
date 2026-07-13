<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiLogin } from "$lib/api/auth";

  let email = $state("");
  let password = $state("");
  let loading = $state(false);
  let error = $state("");

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    error = "";
    try {
      await apiLogin(email, password);
      goto("/dashboard");
    } catch (err) {
      error = err instanceof Error ? err.message : "Login gagal";
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center px-4">
  <div class="w-full max-w-sm space-y-6">
    <div class="space-y-1 text-center">
      <h1 class="font-display text-3xl font-bold uppercase tracking-wide">Login</h1>
      <p class="text-text-muted font-mono text-xs uppercase tracking-wider">Masuk ke akun penyelenggara</p>
    </div>

    <div class="bg-bg-surface clipped border border-border-subtle p-6">
      <form onsubmit={handleLogin} class="space-y-4">
        <div class="space-y-1.5">
          <label for="email" class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary">Email</label>
          <input id="email" type="email" bind:value={email} placeholder="you@example.com" required
            class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" />
        </div>
        <div class="space-y-1.5">
          <label for="password" class="font-body text-xs font-semibold uppercase tracking-wider text-text-primary">Password</label>
          <input id="password" type="password" bind:value={password} placeholder="Your password" required
            class="clipped-sm w-full border border-border-subtle bg-bg-base px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" />
        </div>
        {#if error}
          <p class="text-accent-live font-mono text-xs">{error}</p>
        {/if}
        <button type="submit" disabled={loading}
          class="clipped-sm w-full bg-accent-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50">
          {loading ? "Memproses..." : "Login"}
        </button>
        <p class="text-text-muted text-center font-mono text-xs">
          Belum punya akun? <a href="/register" class="text-accent-primary hover:underline">Register</a>
        </p>
      </form>
    </div>
  </div>
</div>
