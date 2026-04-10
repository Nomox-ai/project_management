import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchTimeEntries, fetchUsers } from '$lib/server/clockify';
import { fetchIssues } from '$lib/server/plane';
import { buildMetrics, parseDurationToMinutes } from '$lib/server/metrics';

export const POST: RequestHandler = async () => {
  try {
    const [entries, users, issues] = await Promise.all([
      fetchTimeEntries(),
      fetchUsers(),
      fetchIssues()
    ]);

    // Filter out zero-duration entries (timers that were started and immediately stopped)
    const validEntries = entries.filter(e => parseDurationToMinutes(e.timeInterval.duration) > 0);

    const metrics = buildMetrics(validEntries, issues, users);

    const unmatchedEntries = validEntries
      .filter(e => !e.planeTaskId)
      .map(e => ({
        id: e.id,
        description: e.description,
        userName: e.userName,
        userId: e.userId,
        duration: e.timeInterval.duration,
        start: e.timeInterval.start
      }));

    return json({
      ok: true,
      metrics,
      unmatchedEntries,
      counts: {
        entries: validEntries.length,
        issues: issues.length,
        tasks: metrics.length,
        unmatched: unmatchedEntries.length
      },
      syncedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[sync] error:', err);
    return json({ ok: false, error: err.message ?? 'Unknown error' }, { status: 500 });
  }
};
