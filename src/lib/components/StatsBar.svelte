<script lang="ts">
  import type { TaskMetrics } from '$lib/server/metrics';

  export let counts: { entries: number; issues: number; tasks: number };
  export let metrics: TaskMetrics[];

  $: totalHours = metrics.reduce((sum, t) => sum + t.totalHours, 0).toFixed(1);
  $: matchedTasks = metrics.filter((t) => t.issue !== null).length;
  $: unmatchedTasks = metrics.filter((t) => t.issue === null).length;

  const statClass = 'rounded-lg border border-border bg-card p-4 space-y-1';
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
  <div class={statClass}>
    <p class="text-xs text-muted-foreground">Total hours tracked</p>
    <p class="text-2xl font-semibold text-foreground">{totalHours}h</p>
  </div>

  <div class={statClass}>
    <p class="text-xs text-muted-foreground">Time entries</p>
    <p class="text-2xl font-semibold text-foreground">{counts.entries}</p>
  </div>

  <div class={statClass}>
    <p class="text-xs text-muted-foreground">Tasks matched</p>
    <p class="text-2xl font-semibold text-foreground">{matchedTasks}</p>
    <p class="text-xs text-muted-foreground">of {counts.tasks} with entries</p>
  </div>

  <div class={statClass}>
    <p class="text-xs text-muted-foreground">Unmatched tasks</p>
    <p class="text-2xl font-semibold {unmatchedTasks > 0 ? 'text-destructive' : 'text-foreground'}">{unmatchedTasks}</p>
    <p class="text-xs text-muted-foreground">no Plane issue found</p>
  </div>
</div>
