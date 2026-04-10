<script lang="ts">
  export let entries: {
    id: string;
    description: string;
    userName: string;
    userId: string;
    duration: string;
    start: string;
  }[] = [];

  function formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function formatDuration(iso: string): string {
    if (!iso) return '—';
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return iso;
    const h = parseInt(match[1] ?? '0');
    const m = parseInt(match[2] ?? '0');
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
</script>

<div>
  <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
    <span class="inline-block h-2 w-2 rounded-full bg-destructive"></span>
    Unmatched entries
    <span class="text-xs font-normal text-muted-foreground">
      ({entries.length} {entries.length === 1 ? 'entry' : 'entries'} with no valid Plane task ID)
    </span>
  </h2>

  <div class="rounded-lg border border-destructive/30 overflow-hidden bg-card">
    <!-- Header -->
    <div class="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-4 py-3
                bg-destructive/5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
      <span>Description</span>
      <span>User</span>
      <span>Date</span>
      <span class="text-right">Duration</span>
    </div>

    {#if entries.length === 0}
      <div class="px-4 py-8 text-center text-sm text-muted-foreground border-t border-border">
        All entries are matched to a Plane task. 🎉
      </div>
    {:else}
      {#each entries as entry (entry.id)}
        <div class="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-4 py-3 border-t border-border">

          <span class="text-sm text-foreground truncate" title={entry.description}>
            {#if entry.description}
              {entry.description}
            {:else}
              <span class="italic text-muted-foreground">no description</span>
            {/if}
          </span>

          <div class="flex items-center gap-2">
            <div class="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span class="text-[10px] font-medium text-muted-foreground">
                {(entry.userName || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <span class="text-sm text-foreground truncate">{entry.userName || entry.userId}</span>
          </div>

          <span class="text-sm text-muted-foreground self-center">{formatDate(entry.start)}</span>

          <span class="text-sm font-mono text-muted-foreground text-right self-center">
            {formatDuration(entry.duration)}
          </span>

        </div>
      {/each}
    {/if}
  </div>
</div>
