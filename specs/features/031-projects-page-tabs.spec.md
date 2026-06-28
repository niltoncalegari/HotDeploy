# Spec 031 — Projects Page Tabs (VPS vs GitHub CI)

## Metadata

| Field | Value |
|---|---|
| **ID** | 031 |
| **Phase** | 9.B |
| **Status** | shipped |
| **Spec path** | `specs/features/031-projects-page-tabs.spec.md` |

## Summary

Split the **Projects** home page into two tabs: **VPS & Containers** (current Docker project list) and **GitHub CI** (linked repositories with workflow run summaries and links to full pipeline views).

## User journey

> As a **developer**, I want to **switch between VPS containers and GitHub CI** on the Projects page so that **I can monitor infrastructure and pipelines from one entry point**.

1. Open **Projects** — default tab is **VPS & Containers** (unchanged behavior).
2. Switch to **GitHub CI** tab.
3. See cards for each deploy project with a linked GitHub repo on the active VPS profile.
4. Each card shows recent workflow runs and a **View pipelines** link to the project CI page.
5. Empty states guide to Settings when GitHub is not connected or no repo is linked.

## UI

| Surface | Change |
|---|---|
| `ProjectsPage` | Tab nav + `?tab=vps` (default) / `?tab=github` |
| `ProjectsTabsNav` | VPS & Containers · GitHub CI |
| `VpsProjectsPanel` | Extracted current VPS list, metrics, deploy dialogs |
| `GitHubProjectsPanel` | Linked-repo cards, empty states |
| `GitHubProjectCiCard` | Per-repo recent runs + link to `ProjectCiPage` |
| `ProjectCiPage` | Back link targets `/?tab=github` |

## Tauri commands

Reuses spec 030 commands — no new backend surface.

## Tests

- [x] Component: `ProjectsPage` VPS tab unchanged
- [x] Component: `GitHubProjectsPanel` empty states
- [x] Component: `GitHubProjectsPanel` linked project cards

## Out of scope

- Aggregated cross-repo dashboard metrics
- Removing per-project CI / Actions tab on detail page
- Editing deploy projects inline from GitHub tab

## Acceptance criteria

- [x] Projects page has VPS and GitHub CI tabs
- [x] VPS tab preserves existing list, metrics, deploy flow
- [x] GitHub tab lists linked repos with recent runs
- [x] Empty states link to Settings (GitHub or Deploy)
- [x] `pnpm quality` green

## Dependencies

- Spec 030
- Spec 016
