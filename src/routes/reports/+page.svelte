<svelte:head><title>Reports — Nomox Management</title></svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import type { TaskMetrics } from '$lib/server/metrics';
  import SyncStatus from '$lib/components/SyncStatus.svelte';

  let metrics: TaskMetrics[] = [];
  let syncedAt = '';
  let loading = true;
  let error = '';

  type GroupBy = 'estimate' | 'priority' | 'state';
  let groupBy: GroupBy = 'estimate';
  let doneOnly = false;

  const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
    { value: 'estimate', label: 'Estimate' },
    { value: 'priority', label: 'Priority' },
    { value: 'state',    label: 'State' },
  ];

  const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low', 'none'];
  const ESTIMATE_ORDER = ['XS', 'S', 'M', 'L', 'XL'];

  const ESTIMATE_COLORS: Record<string, string> = {
    XS: '#9494f9', S: '#6060f8', M: '#2D2DF6', L: '#1a1aae', XL: '#0f0f5e'
  };
  const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', none: '#94a3b8'
  };

  function barColor(label: string): string {
    if (groupBy === 'estimate') return ESTIMATE_COLORS[label] ?? '#2D2DF6';
    if (groupBy === 'priority') return PRIORITY_COLORS[label] ?? '#94a3b8';
    return '#2D2DF6';
  }

  async function sync() {
    loading = true; error = '';
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.ok) { metrics = data.metrics; syncedAt = data.syncedAt; }
      else { error = data.error ?? 'Sync failed'; }
    } catch (e: any) { error = e.message ?? 'Network error'; }
    loading = false;
  }

  onMount(sync);

  interface GroupData {
    label: string;
    taskCount: number;
    avgHours: number;
    totalHours: number;
  }

  function getGroupKey(task: TaskMetrics, by: GroupBy): string {
    if (by === 'estimate') return task.issue?.estimate ?? 'No estimate';
    if (by === 'priority') return task.issue?.priority ?? 'none';
    if (by === 'state')    return task.issue?.state_detail?.name ?? 'Unknown';
    return '—';
  }

  $: filteredMetrics = doneOnly
    ? metrics.filter(t => t.issue?.completed_at != null)
    : metrics;

  $: groups = (() => {
    const map = new Map<string, { totalMinutes: number; tasks: number }>();
    for (const task of filteredMetrics) {
      const key = getGroupKey(task, groupBy);
      const e = map.get(key) ?? { totalMinutes: 0, tasks: 0 };
      map.set(key, { totalMinutes: e.totalMinutes + task.totalMinutes, tasks: e.tasks + 1 });
    }

    let entries: GroupData[] = Array.from(map.entries()).map(([label, { totalMinutes, tasks }]) => ({
      label,
      taskCount: tasks,
      avgHours: parseFloat((totalMinutes / tasks / 60).toFixed(2)),
      totalHours: parseFloat((totalMinutes / 60).toFixed(2))
    }));

    if (groupBy === 'estimate') {
      entries.sort((a, b) => {
        const ai = ESTIMATE_ORDER.indexOf(a.label), bi = ESTIMATE_ORDER.indexOf(b.label);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    } else if (groupBy === 'priority') {
      entries.sort((a, b) => {
        const ai = PRIORITY_ORDER.indexOf(a.label), bi = PRIORITY_ORDER.indexOf(b.label);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    } else {
      entries.sort((a, b) => b.totalHours - a.totalHours);
    }
    return entries;
  })();

  $: maxAvg   = Math.max(...groups.map(g => g.avgHours), 0.1);
  $: maxTotal = Math.max(...groups.map(g => g.totalHours), 0.1);

  const W = 560;
  const H = 260;
  const PAD_TOP = 28;
  const PAD_BOTTOM = 36;
  const PAD_LEFT = 48;
  const PAD_RIGHT = 20;
  const CHART_H = H - PAD_TOP - PAD_BOTTOM;
  const CHART_W = W - PAD_LEFT - PAD_RIGHT;

  function buildBars(groups: GroupData[], maxVal: number, valueKey: 'avgHours' | 'totalHours') {
    const n = groups.length;
    const gap = CHART_W / n;
    const barW = Math.min(64, gap * 0.55);
    return groups.map((g, i) => {
      const val = g[valueKey];
      const barH = Math.max((val / maxVal) * CHART_H, 2);
      const x = PAD_LEFT + gap * i + gap / 2 - barW / 2;
      const y = PAD_TOP + CHART_H - barH;
      return { ...g, val, barH, barW, x, y };
    });
  }

  function yTicks(maxVal: number) {
    return [0, 0.25, 0.5, 0.75, 1].map(t => ({
      val: (maxVal * t).toFixed(1),
      y: PAD_TOP + CHART_H - t * CHART_H
    }));
  }
</script>

<main class="mx-auto max-w-7xl px-6 py-8 space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-semibold text-foreground">Reports</h1>
      <p class="text-sm text-muted-foreground mt-0.5">Aggregated task metrics by group</p>
    </div>
    <SyncStatus {syncedAt} {loading} on:refresh={sync} />
  </div>

  {#if error}
    <div class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
  {/if}

  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-sm text-muted-foreground">Group by:</span>
      <div class="flex gap-1 bg-muted p-1 rounded-lg">
        {#each GROUP_OPTIONS as opt}
          <button
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              {groupBy === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
            on:click={() => groupBy = opt.value}
          >{opt.label}</button>
        {/each}
      </div>
    </div>

    <label class="flex items-center gap-2 cursor-pointer select-none">
      <span class="text-sm text-muted-foreground">Done tasks only</span>
      <button
        role="switch"
        aria-checked={doneOnly}
        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors
          {doneOnly ? 'bg-primary' : 'bg-muted border border-border'}"
        on:click={() => doneOnly = !doneOnly}
      >
        <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
          {doneOnly ? 'translate-x-4' : 'translate-x-1'}"></span>
      </button>
    </label>
  </div>

  {#if loading}
    <div class="grid grid-cols-2 gap-6">
      {#each Array(2) as _}
        <div class="rounded-lg border border-border bg-card p-6 h-80 animate-pulse"></div>
      {/each}
    </div>
  {:else if groups.length === 0}
    <div class="text-center py-16 text-sm text-muted-foreground">
      {doneOnly ? 'No completed tasks found.' : 'No data available.'}
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-6">
      <section class="rounded-lg border border-border bg-card p-6">
        <h2 class="text-sm font-semibold text-foreground">Average hours per task</h2>
        <p class="text-xs text-muted-foreground mt-1 mb-6">Mean time spent per task within each group</p>
        <svg width="100%" viewBox="0 0 {W} {H}">
          {#each yTicks(maxAvg) as tick}
            <line x1={PAD_LEFT} y1={tick.y} x2={W - PAD_RIGHT} y2={tick.y}
                  stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>
            <text x={PAD_LEFT - 8} y={tick.y + 4} text-anchor="end"
                  font-size="10" fill="currentColor" opacity="0.45">{tick.val}h</text>
          {/each}
          <line x1={PAD_LEFT} y1={PAD_TOP + CHART_H} x2={W - PAD_RIGHT} y2={PAD_TOP + CHART_H}
                stroke="currentColor" stroke-opacity="0.15" stroke-width="1"/>
          {#each buildBars(groups, maxAvg, 'avgHours') as b}
            <rect x={b.x} y={b.y} width={b.barW} height={b.barH} rx="4" fill={barColor(b.label)}/>
            <text x={b.x + b.barW / 2} y={b.y - 8} text-anchor="middle"
                  font-size="11" font-family="monospace" fill="currentColor" opacity="0.75">{b.val}h</text>
            <text x={b.x + b.barW / 2} y={PAD_TOP + CHART_H + 18} text-anchor="middle"
                  font-size="12" fill="currentColor" opacity="0.65">{b.label}</text>
          {/each}
        </svg>
      </section>

      <section class="rounded-lg border border-border bg-card p-6">
        <h2 class="text-sm font-semibold text-foreground">Total hours logged</h2>
        <p class="text-xs text-muted-foreground mt-1 mb-6">Combined time across all tasks in each group</p>
        <svg width="100%" viewBox="0 0 {W} {H}">
          {#each yTicks(maxTotal) as tick}
            <line x1={PAD_LEFT} y1={tick.y} x2={W - PAD_RIGHT} y2={tick.y}
                  stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>
            <text x={PAD_LEFT - 8} y={tick.y + 4} text-anchor="end"
                  font-size="10" fill="currentColor" opacity="0.45">{tick.val}h</text>
          {/each}
          <line x1={PAD_LEFT} y1={PAD_TOP + CHART_H} x2={W - PAD_RIGHT} y2={PAD_TOP + CHART_H}
                stroke="currentColor" stroke-opacity="0.15" stroke-width="1"/>
          {#each buildBars(groups, maxTotal, 'totalHours') as b}
            <rect x={b.x} y={b.y} width={b.barW} height={b.barH} rx="4" fill={barColor(b.label)}/>
            <text x={b.x + b.barW / 2} y={b.y - 8} text-anchor="middle"
                  font-size="11" font-family="monospace" fill="currentColor" opacity="0.75">{b.val}h</text>
            <text x={b.x + b.barW / 2} y={PAD_TOP + CHART_H + 18} text-anchor="middle"
                  font-size="12" fill="currentColor" opacity="0.65">{b.label}</text>
          {/each}
        </svg>
      </section>
    </div>

    <section class="rounded-lg border border-border bg-card overflow-hidden">
      <div class="grid gap-4 px-5 py-3 bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wide"
           style="grid-template-columns: 1fr 5rem 6rem 6rem;">
        <span>Group</span>
        <span class="text-right">Tasks</span>
        <span class="text-right">Avg hours</span>
        <span class="text-right">Total hours</span>
      </div>
      {#each groups as g}
        <div class="grid gap-4 px-5 py-3.5 border-t border-border items-center"
             style="grid-template-columns: 1fr 5rem 6rem 6rem;">
          <div class="flex items-center gap-2.5">
            <span class="h-2.5 w-2.5 rounded-sm flex-shrink-0" style="background-color: {barColor(g.label)};"></span>
            <span class="text-sm text-foreground">{g.label}</span>
          </div>
          <span class="text-sm text-muted-foreground text-right">{g.taskCount}</span>
          <span class="text-sm font-mono text-right">{g.avgHours}h</span>
          <span class="text-sm font-mono text-right">{g.totalHours}h</span>
        </div>
      {/each}
    </section>
  {/if}
</main>
