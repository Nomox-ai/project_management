<script lang="ts">
  import type { TaskMetrics } from '$lib/server/metrics';
  import PriorityBadge from './PriorityBadge.svelte';
  import EstimateBadge from './EstimateBadge.svelte';
  import UserBreakdown from './UserBreakdown.svelte';

  export let metrics: TaskMetrics[];
  export let loading: boolean;

  $: sorted = [...metrics].sort((a, b) => b.totalMinutes - a.totalMinutes);

  let expanded: string | null = null;

  function toggle(taskId: string) {
    expanded = expanded === taskId ? null : taskId;
  }
</script>

<div class="rounded-lg border border-border overflow-hidden bg-card">

  <!-- Table header -->
  <div class="grid gap-4 px-4 py-3 bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wide"
       style="grid-template-columns: 6rem 1fr 9rem 7rem 6rem 5rem 4rem;">
    <span>Task ID</span>
    <span>Name</span>
    <span>State</span>
    <span>Priority</span>
    <span>Estimate</span>
    <span class="text-right">Hours</span>
    <span class="text-right">Entries</span>
  </div>

  {#if loading}
    {#each Array(5) as _}
      <div class="grid gap-4 px-4 py-3 border-t border-border animate-pulse"
           style="grid-template-columns: 6rem 1fr 9rem 7rem 6rem 5rem 4rem;">
        {#each Array(7) as _}
          <div class="h-4 rounded bg-muted"></div>
        {/each}
      </div>
    {/each}

  {:else if sorted.length === 0}
    <div class="px-4 py-16 text-center text-sm text-muted-foreground border-t border-border">
      No time entries found. Make sure Clockify entries start with a Plane task ID (e.g. <code class="font-mono">PROJ-42 description</code>).
    </div>

  {:else}
    {#each sorted as task (task.taskId)}
      <button
        class="w-full grid gap-4 px-4 py-3 border-t border-border text-left hover:bg-muted/50 transition-colors {expanded === task.taskId ? 'bg-muted/30' : ''}"
        style="grid-template-columns: 6rem 1fr 9rem 7rem 6rem 5rem 4rem;"
        on:click={() => toggle(task.taskId)}
      >
        <span class="font-mono text-xs text-muted-foreground self-center">{task.taskId}</span>

        <span class="text-sm text-foreground self-center truncate">
          {#if task.issue}
            {task.issue.name}
          {:else}
            <span class="italic text-muted-foreground">Not found in Plane</span>
          {/if}
        </span>

        <span class="self-center">
          {#if task.issue?.state_detail}
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
              <span
                class="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style="background-color: {task.issue.state_detail.color}"
              ></span>
              {task.issue.state_detail.name}
            </span>
          {:else}
            <span class="text-muted-foreground text-sm">—</span>
          {/if}
        </span>

        <span class="self-center">
          {#if task.issue}
            <PriorityBadge priority={task.issue.priority} />
          {:else}
            <span class="text-muted-foreground text-sm">—</span>
          {/if}
        </span>

        <span class="self-center">
          <EstimateBadge estimate={task.issue?.estimate ?? null} />
        </span>

        <span class="font-mono text-sm text-right self-center">{task.totalHours}h</span>
        <span class="text-sm text-muted-foreground text-right self-center">{task.entryCount}</span>
      </button>

      {#if expanded === task.taskId}
        <div class="border-t border-border bg-muted/20 px-6 py-4">
          <UserBreakdown byUser={task.byUser} totalMinutes={task.totalMinutes} entries={task.entries} />
        </div>
      {/if}
    {/each}
  {/if}
</div>
