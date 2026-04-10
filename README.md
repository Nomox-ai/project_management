# Time Management

SvelteKit platform integrating **Clockify** (time tracking) and **Plane** (project management). Loads time entries from Clockify, matches them to Plane tasks by ID, aggregates hours per task, and displays metrics on a dashboard.

---

## Stack

- **SvelteKit** — fullstack framework (routing, server endpoints, SSR)
- **Tailwind CSS** — styling with shadcn-style CSS variables
- **TypeScript** — throughout
- **Vercel** — deployment target (`@sveltejs/adapter-vercel`)

---

## Project structure

```
src/
├── hooks.server.ts          # Auth guard — protects all routes except /login
├── lib/
│   ├── server/
│   │   ├── auth.ts          # Session cookie logic
│   │   ├── clockify.ts      # Clockify API client
│   │   ├── plane.ts         # Plane API client
│   │   └── metrics.ts       # Aggregation + metric computation
│   └── components/
│       ├── StatsBar.svelte       # Summary stat cards
│       ├── SyncStatus.svelte     # Last synced timestamp + refresh button
│       ├── TaskTable.svelte      # Main expandable task table
│       ├── PriorityBadge.svelte  # Coloured priority pill
│       └── UserBreakdown.svelte  # Per-contributor time bars
└── routes/
    ├── login/               # Login page + form action
    ├── dashboard/           # Main dashboard (triggers sync on load)
    └── api/
        ├── sync/            # POST — fetches Clockify + Plane, returns metrics
        └── logout/          # POST — clears session cookie
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to find it |
|---|---|
| `AUTH_USERNAME` | Choose any username |
| `AUTH_PASSWORD` | Choose a secure password |
| `AUTH_SECRET` | Any random string, 32+ characters |
| `CLOCKIFY_API_KEY` | Clockify → Profile (bottom left) → API token |
| `CLOCKIFY_WORKSPACE_ID` | Clockify → Workspace settings URL |
| `PLANE_API_KEY` | Plane → Settings → API tokens |
| `PLANE_WORKSPACE_SLUG` | Your Plane workspace slug (from the URL) |
| `PLANE_PROJECT_ID` | Your Plane project ID (from the URL) |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You'll be redirected to `/login`.

---

## Clockify convention

Time entry descriptions **must start with the Plane task ID** as the first word:

```
PROJ-42 fixed the login redirect bug
PROJ-17 refactored auth module
```

The sync script extracts the first word, uppercases it, and matches it against `sequence_id` in Plane. Entries without a recognisable task ID are silently ignored.

---

## How sync works

1. User logs in → redirected to `/dashboard`
2. Dashboard calls `POST /api/sync` on mount
3. Server fetches Clockify time entries + users and Plane issues **in parallel**
4. `metrics.ts` aggregates entries by task ID and computes metrics
5. Results are returned as JSON and rendered in the table
6. The **Refresh** button in the header re-triggers the same sync at any time

---

## Adding metrics

Open `src/lib/server/metrics.ts` and extend `computeMetrics()`:

```ts
export function computeMetrics(aggregates: TaskAggregate[]): TaskMetrics[] {
  return aggregates.map((agg) => ({
    ...agg,
    totalHours: parseFloat((agg.totalMinutes / 60).toFixed(2)),
    avgMinutesPerEntry: ...,
    contributorCount: agg.byUser.length,

    // Add your metric here:
    myNewMetric: computeMyMetric(agg),
  }));
}
```

Then add the field to the `TaskMetrics` interface and display it in `TaskTable.svelte`.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add all `.env` variables under **Project → Settings → Environment Variables**
4. Deploy — Vercel detects SvelteKit automatically via `vercel.json`