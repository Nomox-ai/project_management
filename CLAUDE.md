# CLAUDE.md — Nomox Project Management

## Project Overview

A SvelteKit internal tool that syncs **Clockify** time entries with **Plane** project management issues, providing an overview and reports dashboard for the Nomox team.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 4
- **Styling:** Tailwind CSS 3 with CSS variables for theming
- **Language:** TypeScript
- **Deployment:** Vercel (`@sveltejs/adapter-vercel`)
- **Package manager:** npm

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build locally
npm run check        # Type-check with svelte-check
```

## Project Structure

```
src/
├── app.html                  # HTML shell — favicon defined here
├── app.css                   # Tailwind base + CSS variable theme
├── hooks.server.ts           # Auth guard — redirects unauthenticated users to /login
├── routes/
│   ├── +layout.svelte        # Root layout: top nav (Overview / Reports), logo, sign out
│   ├── +page.server.ts       # Redirects / → /overview
│   ├── login/                # Login page (username/password against .env)
│   ├── overview/             # Main task table + unmatched entries
│   ├── reports/              # Bar charts grouped by estimate / priority / state
│   ├── dashboard/            # Legacy route — redirects to /overview
│   └── api/
│       ├── sync/             # POST — fetches Clockify + Plane data, returns metrics
│       └── logout/           # POST — clears auth cookie
└── lib/
    ├── server/
    │   ├── clockify.ts       # Clockify Reports API integration (all-user time entries)
    │   ├── plane.ts          # Plane API: issues, states, estimate resolution
    │   ├── metrics.ts        # Aggregation pipeline: entries → TaskMetrics[]
    │   └── auth.ts           # Session cookie helpers
    └── components/
        ├── TaskTable.svelte      # Main table with expandable user breakdown
        ├── UserBreakdown.svelte  # Per-user time + individual entry drill-down
        ├── UnmatchedTable.svelte # Entries with no valid Plane task ID
        ├── StatsBar.svelte       # Summary counts bar
        ├── SyncStatus.svelte     # Last synced time + Refresh button
        ├── EstimateBadge.svelte  # XS/S/M/L/XL colour-coded badge
        └── PriorityBadge.svelte  # urgent/high/medium/low/none badge
static/
└── favicon.svg               # Nomox logo (dark background, white paths)
```

## Environment Variables

All required — copy `.env.example` to `.env`:

```env
# Auth (simple username/password, no external provider)
AUTH_USERNAME=
AUTH_PASSWORD=
AUTH_SECRET=          # 32+ random chars, used to sign session cookie

# Clockify
CLOCKIFY_API_KEY=             # Must belong to a workspace Admin
CLOCKIFY_WORKSPACE_ID=

# Plane
PLANE_API_KEY=
PLANE_WORKSPACE_SLUG=
PLANE_PROJECT_ID=

# Plane estimate point UUID → label mapping
# These UUIDs come from Plane's estimate configuration.
# The API does not return labels directly — they are hardcoded here.
# To find UUIDs: sync the app and check the [plane] logs for "unique estimate_point UUIDs found"
PLANE_ESTIMATE_XS=
PLANE_ESTIMATE_S=
PLANE_ESTIMATE_M=
PLANE_ESTIMATE_L=
PLANE_ESTIMATE_XL=
```

## Key Design Decisions

### Clockify: Reports API instead of per-user endpoint
The regular `GET /user/{id}/time-entries` endpoint only returns the API key owner's entries even for admins. The **Clockify Reports API** (`POST reports.api.clockify.me/v1/workspaces/{id}/reports/detailed`) returns all users' entries when all workspace user IDs are passed in the `users.ids` field.

The Reports API returns `duration` as **seconds (integer)**, not ISO 8601 — `parseDurationToMinutes()` in `metrics.ts` handles both formats.

### Plane: estimate labels are not in the API
Plane's estimate API returns a single config object with no points. The `/estimates/{id}/points/` endpoint returns 404 in this version. The UUID→label mapping is hardcoded via `PLANE_ESTIMATE_*` env vars. If estimates are reconfigured in Plane, update these vars.

### Task ID parsing
Clockify entry descriptions are scanned for the pattern `/\b([A-Z]+-\d+)\b/` anywhere in the string. This handles formats like:
- `NOMOX-32 - some description`
- `NOMOX-15, 24,25,26 creation of databases`
- Entries with no match go to the **Unmatched entries** table

### Auth
Simple cookie-based auth using `AUTH_USERNAME` / `AUTH_PASSWORD` from env. No OAuth. The `hooks.server.ts` guards all routes except `/login`.

## Data Flow

```
POST /api/sync
  ├── fetchTimeEntries()   → Clockify Reports API (all users, last 365 days + 1 day ahead)
  ├── fetchUsers()         → Clockify workspace users (for display names)
  └── fetchIssues()        → Plane issues + state map + estimate map
        ↓
  buildMetrics(entries, issues, users)
    ├── aggregateByTask()  → groups entries by task ID, sums minutes per user
    └── computeMetrics()   → adds totalHours, avgMinutesPerEntry, contributorCount
        ↓
  Returns: { metrics, unmatchedEntries, counts, syncedAt }
```

## Pages

### Overview (`/overview`)
- Syncs on mount
- Shows `StatsBar` (entry/issue/task counts)
- `TaskTable`: expandable rows → `UserBreakdown` (per-user bars + individual entry list)
- `UnmatchedTable`: entries with no task ID (only shown if non-empty)

### Reports (`/reports`)
- Two SVG bar charts side by side: **Average hours per task** and **Total hours logged**
- Group by selector: **Estimate** (XS→XL) | **Priority** (urgent→none) | **State** (by total hours)
- **Done tasks only** toggle — filters to `issue.completed_at != null`
- Summary table below charts

## Deployment (Vercel)

- Adapter: `@sveltejs/adapter-vercel`
- Set **Root Directory** to `operational/time_management` if deploying from the monorepo
- Add all `.env` variables in Vercel → Settings → Environment Variables
- `.env` is gitignored and never committed
