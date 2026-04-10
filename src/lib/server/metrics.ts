import type { ClockifyEntry, ClockifyUser } from './clockify';
import type { PlaneIssue } from './plane';

// ── Core types ────────────────────────────────────────────────────────────────

export interface UserTime {
  userId: string;
  userName: string;
  minutes: number;
}

export interface TaskAggregate {
  taskId: string;
  issue: PlaneIssue | null;
  entries: ClockifyEntry[];
  entryCount: number;
  totalMinutes: number;
  byUser: UserTime[];
}

export interface TaskMetrics extends TaskAggregate {
  totalHours: number;
  avgMinutesPerEntry: number;
  contributorCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parseDurationToMinutes(iso: string | number | null | undefined): number {
  if (iso === null || iso === undefined) return 0;
  if (typeof iso === 'number') return Math.round(iso / 60);
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0');
  const mins  = parseInt(match[2] ?? '0');
  const secs  = parseInt(match[3] ?? '0');
  return hours * 60 + mins + Math.round(secs / 60);
}

// ── Step 1: Aggregate raw entries by task ID ──────────────────────────────────

export function aggregateByTask(
  entries: ClockifyEntry[],
  issues: PlaneIssue[],
  users: ClockifyUser[]
): TaskAggregate[] {
  const issueMap = new Map<string, PlaneIssue>();
  for (const issue of issues) {
    issueMap.set(String(issue.sequence_id), issue);
  }

  // Fallback user map in case userName isn't on the entry
  const userMap = new Map<string, string>(users.map((u) => [u.id, u.name]));

  const grouped = new Map<string, ClockifyEntry[]>();
  for (const entry of entries) {
    if (!entry.planeTaskId) continue;
    if (!grouped.has(entry.planeTaskId)) grouped.set(entry.planeTaskId, []);
    grouped.get(entry.planeTaskId)!.push(entry);
  }

  return Array.from(grouped.entries()).map(([taskId, taskEntries]) => {
    const byUserMap = new Map<string, { name: string; minutes: number }>();
    let totalMinutes = 0;

    for (const e of taskEntries) {
      const mins = parseDurationToMinutes(e.timeInterval.duration);
      totalMinutes += mins;
      // Use userName from the entry (Reports API), fall back to workspace user map
      const name = e.userName || userMap.get(e.userId) || e.userId;
      const existing = byUserMap.get(e.userId);
      byUserMap.set(e.userId, { name, minutes: (existing?.minutes ?? 0) + mins });
    }

    const byUser: UserTime[] = Array.from(byUserMap.entries()).map(([userId, { name, minutes }]) => ({
      userId,
      userName: name,
      minutes
    }));

    const numericId = taskId.replace(/^[A-Z]+-/, '');
    const issue = issueMap.get(numericId) ?? null;

    return { taskId, issue, entries: taskEntries, entryCount: taskEntries.length, totalMinutes, byUser };
  });
}

// ── Step 2: Compute metrics ───────────────────────────────────────────────────

export function computeMetrics(aggregates: TaskAggregate[]): TaskMetrics[] {
  return aggregates.map((agg) => ({
    ...agg,
    totalHours: parseFloat((agg.totalMinutes / 60).toFixed(2)),
    avgMinutesPerEntry: agg.entryCount > 0
      ? parseFloat((agg.totalMinutes / agg.entryCount).toFixed(1))
      : 0,
    contributorCount: agg.byUser.length
  }));
}

// ── Full pipeline ─────────────────────────────────────────────────────────────

export function buildMetrics(
  entries: ClockifyEntry[],
  issues: PlaneIssue[],
  users: ClockifyUser[]
): TaskMetrics[] {
  return computeMetrics(aggregateByTask(entries, issues, users));
}
