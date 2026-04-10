<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let syncedAt: string;
  export let loading: boolean;

  const dispatch = createEventDispatcher();

  function formatTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="flex items-center gap-3">
  {#if syncedAt}
    <span class="text-xs text-muted-foreground">
      Synced at {formatTime(syncedAt)}
    </span>
  {/if}

  <button
    on:click={() => dispatch('refresh')}
    disabled={loading}
    class="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5
           text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50
           transition-colors cursor-pointer"
  >
    <svg
      class="h-3 w-3 {loading ? 'animate-spin' : ''}"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    {loading ? 'Syncing…' : 'Refresh'}
  </button>
</div>
