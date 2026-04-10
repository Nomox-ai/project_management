<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData } from "./$types";

  export let form: ActionData;

  let loading = false;
</script>

<svelte:head>
  <title>Sign in — Nomox Management</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background px-4">
  <div class="w-full max-w-sm">
    <div class="mb-8 text-center">
      <h1 class="text-2xl font-semibold tracking-tight text-foreground">
        Nomox Management
      </h1>
      <p class="text-sm text-muted-foreground mt-2">
        Sign in to access your dashboard
      </p>
    </div>

    <div class="rounded-lg border border-border bg-card p-8 shadow-sm">
      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
        class="space-y-4"
      >
        <div class="space-y-2">
          <label for="username" class="text-sm font-medium text-foreground">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            required
            class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm
                   placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-foreground">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm
                   placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {#if form?.error}
          <p class="text-sm text-destructive">{form.error}</p>
        {/if}

        <button
          type="submit"
          disabled={loading}
          class="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium
                 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  </div>
</div>
