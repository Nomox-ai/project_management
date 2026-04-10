<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  $: path = $page.url.pathname;
</script>

<div class="min-h-screen bg-background">
  <nav class="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
    <div class="mx-auto max-w-7xl px-6 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <!-- Logo + name -->
        <div class="flex items-center gap-2.5 py-2">
          <img src="/favicon.svg" alt="Nomox" class="h-6 w-6 object-contain" />
          <span class="text-sm font-semibold text-foreground">Project Management</span>
        </div>

        <div class="flex items-center gap-6">
          <a
            href="/overview"
            class="py-3 text-sm transition-colors border-b-2 {path.startsWith('/overview') || path.startsWith('/dashboard')
              ? 'border-primary text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'}"
          >
            Overview
          </a>
          <a
            href="/reports"
            class="py-3 text-sm transition-colors border-b-2 {path.startsWith('/reports')
              ? 'border-primary text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'}"
          >
            Reports
          </a>
        </div>
      </div>

      <div class="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Clockify + Plane</span>
        <a
          href="/api/logout"
          class="hover:text-foreground transition-colors"
          on:click|preventDefault={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login'; }}
        >
          Sign out
        </a>
      </div>
    </div>
  </nav>

  <slot />
</div>
