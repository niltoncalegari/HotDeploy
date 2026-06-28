# Spec 030 — GitHub Actions CI Panel

## Metadata

| Field | Value |
|---|---|
| **ID** | 030 |
| **Phase** | 9.A |
| **Status** | shipped |
| **Spec path** | `specs/features/030-github-actions-panel.spec.md` |

## Summary

Add a **CI / Actions** tab on linked Docker Projects to list all GitHub workflows and recent runs, expand runs into jobs/steps (pipeline view), poll while the tab is open, and trigger `workflow_dispatch` runs from the app — without opening github.com.

## User journey

> As a **developer**, I want to **see CI and deploy pipelines in HotDeploy** so that **I can monitor and trigger workflows without switching to GitHub**.

1. Link a repository to a Docker Project (existing flow).
2. Open project detail → **CI / Actions** tab.
3. See all workflows in the repo and recent runs (all branches by default).
4. Expand a run to view jobs and steps with status badges.
5. Click **Run workflow** on dispatchable workflows; confirm branch and trigger.
6. Poll refreshes every 15–30s while the tab is active; manual Refresh available.

## UI

| Surface | Change |
|---|---|
| `ProjectDetailPage` | Tab nav: Overview + CI / Actions (sub-route) |
| `App.tsx` | Route `projects/:projectName/ci` → `ProjectCiPage` |
| `ProjectCiPage` | Workflows list, runs list, branch filter, refresh, external links |
| `WorkflowRunPipeline` | Accordion: run → jobs → steps |
| `DispatchWorkflowDialog` | Manual dispatch with branch picker |

Polling: 15s when any run is `in_progress` / `queued`; 30s otherwise. No background polling on this tab.

Empty/error: `EmptyState` when no GitHub link or no workflows; scope hint when PAT lacks `actions:read`.

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `list_github_workflows` | `owner, repo` | `GitHubWorkflow[]` | |
| `list_github_workflow_runs` | `owner, repo, workflowId?, branch?, status?, perPage?` | `WorkflowRunDetail[]` | |
| `get_github_workflow_run_jobs` | `owner, repo, runId` | `WorkflowJob[]` | |
| `dispatch_github_workflow` | `owner, repo, workflowId, ref, inputs?` | `void` | Requires `actions:write` |

## Tests

- [x] Unit: parse GitHub workflows/runs/jobs JSON in Rust
- [x] Unit: dispatch payload shape
- [x] Unit: TS invoke wrappers
- [x] Component: `WorkflowRunPipeline` status rendering
- [x] Component: `ProjectCiPage` empty state

## Out of scope

- Webhook receiver / relay (Phase 9.B)
- Inline step logs (link to GitHub instead)
- Re-run / cancel workflow run
- Check suites / annotations
- OS notifications on failure
- Custom `workflow_dispatch` inputs (v1: `ref` only)

## Acceptance criteria

- [x] CI / Actions tab on linked projects
- [x] All repo workflows and recent runs visible
- [x] Expandable pipeline (jobs + steps)
- [x] Polling while tab active
- [x] Manual workflow dispatch with branch selection
- [x] `pnpm quality` green
- [x] CONTEXT.md updated with Workflow Run term

## Dependencies

- Spec 016 (repository linking)
- Spec 015 / 027 (GitHub connection)
