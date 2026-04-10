<script lang="ts">
  import type { UserTime, TaskMetrics } from '$lib/server/metrics';

  export let byUser: UserTime[];
  export let totalMinutes: number;
  export let entries: TaskMetrics['entries'] = [];

  function pct(mins: number): string {
    if (totalMinutes === 0) return '0%';
    return ((mins / totalMinutes) * 100).toFixed(0) + '%';
  }

  function toHours(mins: number): string {
    return (mins / 60).toFixed(2) + 'h';
  }

  function formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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

  $: sorted = [...byUser].sort((a, b) => b.minutes - a.minutes);

  // Group entries by userId for the detail table
  $: entriesByUser = entries.reduce((acc, e) => {
    const key = e.userId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {} as Record<string, typeof entries>);

  let expandedUser: string | null = null;
</script>

<div class="space-y-4">
  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
    Time by contributor
  </p>

  {#each sorted as u (u.userId)}
    <div class="space-y-2">
      <!-- User row -->
      <button
        class="w-full flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
        on:click={() => expandedUser = expandedUser === u.userId ? null : u.userId}
      >
        <!-- Avatar -->
        <div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span class="text-[10px] font-medium text-primary">
            {u.userName.charAt(0).toUpperCase()}
          </span>
        </div>

        <!-- Name -->
        <span class="w-28 text-sm text-foreground truncate">{u.userName}</span>

        <!-- Progress bar -->
        <div class="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            class="h-full rounded-full bg-primary transition-all duration-500"
            style="width: {pct(u.minutes)}"
          ></div>
        </div>

        <!-- Hours + pct -->
        <span class="text-xs font-mono text-foreground w-14 text-right">{toHours(u.minutes)}</span>
        <span class="text-xs text-muted-foreground w-9 text-right">{pct(u.minutes)}</span>

        <!-- Expand chevron -->
        <span class="text-muted-foreground text-xs w-4">
          {expandedUser === u.userId ? '▲' : '▼'}
        </span>
      </button>

      <!-- Individual entries for this user -->
      {#if expandedUser === u.userId}
        <div class="ml-9 space-y-1 border-l-2 border-border pl-3">
          {#each (entriesByUser[u.userId] ?? []) as entry (entry.id)}
            <div class="flex items-start justify-between gap-4 py-1">
              <div class="flex-1 min-w-0">
                <p class="text-xs text-foreground truncate">{entry.description || '(no description)'}</p>
                <p class="text-[11px] text-muted-foreground mt-0.5">{formatDate(entry.timeInterval.start)}</p>
              </div>
              <span class="text-xs font-mono text-muted-foreground flex-shrink-0">
                {formatDuration(entry.timeInterval.duration)}
              </span>
            </div>
          {/each}

          {#if !entriesByUser[u.userId]?.length}
            <p class="text-xs text-muted-foreground italic">No entries</p>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  {#if byUser.length === 0}
    <p class="text-xs text-muted-foreground italic">No contributor data available.</p>
  {/if}
</div>
