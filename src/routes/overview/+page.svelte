<svelte:head>
  <title>Overview — Nomox Management</title>
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import TaskTable from '$lib/components/TaskTable.svelte';
  import UnmatchedTable from '$lib/components/UnmatchedTable.svelte';
  import SyncStatus from '$lib/components/SyncStatus.svelte';
  import StatsBar from '$lib/components/StatsBar.svelte';
  import type { TaskMetrics } from '$lib/server/metrics';

  let metrics: TaskMetrics[] = [];
  let unmatchedEntries: {
    id: string;
    description: string;
    userName: string;
    userId: string;
    duration: string;
    start: string;
  }[] = [];
  let counts = { entries: 0, issues: 0, tasks: 0, unmatched: 0 };
  let syncedAt = '';
  let loading = true;
  let error = '';

  async function sync() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        metrics = data.metrics;
        unmatchedEntries = data.unmatchedEntries ?? [];
        counts = data.counts;
        syncedAt = data.syncedAt;
      } else {
        error = data.error ?? 'Sync failed';
      }
    } catch (e: any) {
      error = e.message ?? 'Network error';
    }
    loading = false;
  }

  onMount(sync);
</script>

<main class="mx-auto max-w-7xl px-6 py-6 space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-semibold text-foreground">Overview</h1>
      <p class="text-sm text-muted-foreground mt-0.5">Tracked time across all tasks</p>
    </div>
    <SyncStatus {syncedAt} {loading} on:refresh={sync} />
  </div>

  {#if error}
    <div class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {error}
    </div>
  {/if}

  {#if !loading}
    <StatsBar {counts} {metrics} />
  {/if}

  <section>
    <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <span class="inline-block h-2 w-2 rounded-full bg-primary"></span>
      Tracked tasks
      {#if !loading}
        <span class="text-xs font-normal text-muted-foreground">({metrics.length} tasks)</span>
      {/if}
    </h2>
    <TaskTable {metrics} {loading} />
  </section>

  {#if !loading && unmatchedEntries.length > 0}
    <UnmatchedTable entries={unmatchedEntries} />
  {/if}
</main>
