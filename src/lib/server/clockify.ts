import { env } from '$env/dynamic/private';

const BASE = 'https://api.clockify.me/api/v1';
const REPORTS_BASE = 'https://reports.api.clockify.me/v1';

export interface ClockifyEntry {
  id: string;
  description: string;
  userId: string;
  userName: string;
  timeInterval: {
    start: string;
    end: string;
    duration: string;
  };
  planeTaskId: string | null;
}

export interface ClockifyUser {
  id: string;
  name: string;
  email: string;
}

function headers() {
  return {
    'X-Api-Key': env.CLOCKIFY_API_KEY,
    'Content-Type': 'application/json'
  };
}

/** Convert seconds (number) to ISO 8601 duration string e.g. PT1H30M45S */
function secondsToIso(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h > 0 ? h + 'H' : ''}${m > 0 ? m + 'M' : ''}${s > 0 ? s + 'S' : ''}` || 'PT0S';
}

/**
 * Extract the first Plane task ID (e.g. NOMOX-32) from anywhere in the description.
 * Handles formats like:
 *   "NOMOX-32 - some description"
 *   "NOMOX-15, 24,25,26 creation of new mock databases"
 *   "  NOMOX-7: refactoring"
 */
function extractPlaneTaskId(description: string): string | null {
  const match = description.match(/\b([A-Z]+-\d+)\b/);
  return match ? match[1] : null;
}

export async function fetchUsers(): Promise<ClockifyUser[]> {
  const res = await fetch(
    `${BASE}/workspaces/${env.CLOCKIFY_WORKSPACE_ID}/users`,
    { headers: headers() }
  );

  if (!res.ok) {
    throw new Error(`Clockify users error: ${res.status} ${await res.text()}`);
  }

  const raw: any[] = await res.json();
  const users = raw.map((u) => ({ id: u.id, name: u.name, email: u.email }));
  console.log(`[clockify] workspace users (${users.length}): ${users.map(u => `${u.name}(${u.id})`).join(', ')}`);
  return users;
}

export async function fetchTimeEntries(
  startDate?: string,
  endDate?: string
): Promise<ClockifyEntry[]> {
  const start = startDate ?? new Date(Date.now() - 365 * 86_400_000).toISOString();
  const end   = endDate   ?? new Date(Date.now() + 86_400_000).toISOString();

  const users = await fetchUsers();
  const userIds = users.map(u => u.id).filter(Boolean);

  console.log(`[clockify] date range: ${start} → ${end}`);

  const all: ClockifyEntry[] = [];
  let page = 1;

  while (true) {
    const body = {
      dateRangeStart: start,
      dateRangeEnd: end,
      detailedFilter: {
        page,
        pageSize: 500,
        sortColumn: 'DATE'
      },
      users: {
        ids: userIds,
        contains: 'CONTAINS',
        status: 'ALL'
      },
      exportType: 'JSON'
    };

    const res = await fetch(
      `${REPORTS_BASE}/workspaces/${env.CLOCKIFY_WORKSPACE_ID}/reports/detailed`,
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      throw new Error(`Clockify reports error: ${res.status} ${await res.text()}`);
    }

    const data: any = await res.json();
    const raw: any[] = data.timeentries ?? [];
    const totals = data.totals?.[0];
    console.log(`[clockify] page ${page}: ${raw.length} entries, total in API: ${totals?.entriesCount ?? '?'}`);

    for (const e of raw) {
      const description = e.description ?? '';
      const planeTaskId = extractPlaneTaskId(description);

      const rawDuration = e.timeInterval?.duration;
      const duration = typeof rawDuration === 'number'
        ? secondsToIso(rawDuration)
        : (rawDuration ?? 'PT0S');

      all.push({
        id: e._id ?? e.id ?? '',
        description,
        userId: e.userId ?? '',
        userName: e.userName ?? '',
        timeInterval: {
          start: e.timeInterval?.start ?? '',
          end:   e.timeInterval?.end   ?? '',
          duration
        },
        planeTaskId
      });
    }

    if (raw.length < 500) break;
    page++;
  }

  const byUser = all.reduce((acc, e) => {
    acc[e.userName || e.userId] = (acc[e.userName || e.userId] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`[clockify] entries by user:`, byUser);
  console.log(`[clockify] total: ${all.length}, with task ID: ${all.filter(e => e.planeTaskId).length}`);

  return all;
}
