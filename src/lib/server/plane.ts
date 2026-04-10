import { env } from '$env/dynamic/private';

const BASE = 'https://api.plane.so/api/v1';

export interface PlaneIssue {
  id: string;
  sequence_id: number;
  name: string;
  description_html: string;
  state: string;
  state_detail?: { name: string; color: string };
  priority: string;
  assignees: string[];
  label_ids: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  estimate_point: string | null;
  estimate: string | null;
}

function headers() {
  return {
    'X-API-Key': env.PLANE_API_KEY,
    'Content-Type': 'application/json'
  };
}

/** Built from PLANE_ESTIMATE_* env vars — update .env if Plane estimate points are reconfigured */
function buildEstimateMap(): Map<string, string> {
  return new Map([
    [env.PLANE_ESTIMATE_XS, 'XS'],
    [env.PLANE_ESTIMATE_S,  'S'],
    [env.PLANE_ESTIMATE_M,  'M'],
    [env.PLANE_ESTIMATE_L,  'L'],
    [env.PLANE_ESTIMATE_XL, 'XL'],
  ].filter(([id]) => !!id) as [string, string][]);
}

async function fetchStateMap(): Promise<Map<string, { name: string; color: string }>> {
  const map = new Map<string, { name: string; color: string }>();
  try {
    const res = await fetch(
      `${BASE}/workspaces/${env.PLANE_WORKSPACE_SLUG}/projects/${env.PLANE_PROJECT_ID}/states/`,
      { headers: headers() }
    );
    if (!res.ok) { console.warn(`[plane] states fetch failed: ${res.status}`); return map; }
    const data = await res.json();
    const states: any[] = data.results ?? data;
    for (const s of states) map.set(s.id, { name: s.name, color: s.color });
  } catch (e) { console.warn('[plane] states error:', e); }
  return map;
}

export async function fetchIssues(): Promise<PlaneIssue[]> {
  const estimateMap = buildEstimateMap();
  console.log(`[plane] estimate map:`, Object.fromEntries(estimateMap));

  const [issuesRes, stateMap] = await Promise.all([
    fetch(
      `${BASE}/workspaces/${env.PLANE_WORKSPACE_SLUG}/projects/${env.PLANE_PROJECT_ID}/issues/?per_page=500`,
      { headers: headers() }
    ),
    fetchStateMap()
  ]);

  if (!issuesRes.ok) {
    throw new Error(`Plane issues error: ${issuesRes.status} ${await issuesRes.text()}`);
  }

  const data = await issuesRes.json();
  const raw: any[] = data.results ?? data;

  return raw.map((issue) => {
    const stateId: string = issue.state ?? '';
    const estimatePointId: string | null = issue.estimate_point ?? null;
    const estimate = estimatePointId ? (estimateMap.get(estimatePointId) ?? null) : null;

    return {
      id: issue.id,
      sequence_id: issue.sequence_id,
      name: issue.name,
      description_html: issue.description_html,
      state: stateId,
      state_detail: stateMap.get(stateId) ?? undefined,
      priority: issue.priority,
      assignees: issue.assignees ?? [],
      label_ids: issue.label_ids ?? [],
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      completed_at: issue.completed_at ?? null,
      estimate_point: estimatePointId,
      estimate
    };
  });
}

export async function fetchStates(): Promise<{ id: string; name: string; color: string; group: string }[]> {
  const res = await fetch(
    `${BASE}/workspaces/${env.PLANE_WORKSPACE_SLUG}/projects/${env.PLANE_PROJECT_ID}/states/`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Plane states error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.results ?? data;
}
