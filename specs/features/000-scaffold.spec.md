# Spec 000 — Project Scaffold

## Metadata

| Field | Value |
|---|---|
| **ID** | 000 |
| **Phase** | 0 |
| **Status** | shipped |
| **Spec path** | `specs/features/000-scaffold.spec.md` |

## Summary

Establish the HotDeploy desktop foundation: Tauri 2 + React + shadcn shell, flame branding, Rust credential stubs, api-harness package, agent harness, spec-driven docs, CI quality gate, and PR workflow for agents.

## User journey

> As a **developer**, I want to **clone and run HotDeploy locally** so that **I can build Hostinger deployment features on a consistent foundation**.

1. Clone repo, install deps, run `pnpm tauri:dev`.
2. See AppShell with Projects empty state and Settings placeholder.
3. Agents read AGENTS.md, CONTEXT.md, and specs before coding.

## UI

| Surface | Change |
|---|---|
| AppShell | Sidebar (Projects, Settings), header with flame branding |
| Projects | Empty state card — no VPS connected |
| Settings | Credential status card (reads Tauri command) |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `get_credentials_status` | — | `{ configured, virtualMachineId }` | Scaffold |
| `save_credentials` | apiKey, virtualMachineId | — | Keychain |
| `clear_credentials` | — | — | Keychain |
| `list_vms` | — | VM[] | Stub NOT_IMPLEMENTED |
| `list_projects` | virtualMachineId | Project[] | Stub |
| `get_project_logs` | virtualMachineId, projectName | string | Stub |

## Hostinger API

No live integration in Phase 0. Shapes defined in `packages/api-harness`.

## Tests

- [x] `FakeHostingerClient` contract tests
- [x] `cn()` utility test
- [ ] Manual: `pnpm tauri:dev` launches window

## Out of scope

- Real Hostinger API calls
- Deploy UI
- App signing / notarization
- Non-Hostinger providers

## Acceptance criteria

- [x] Tauri 2 + React + Vite + pnpm workspace
- [x] shadcn/ui + flame tokens in DESIGN.md
- [x] CONTEXT.md ≤200 lines
- [x] AGENTS.md, CONTRIBUTING.md, PLAN.md
- [x] specs/, .cursor/rules/, .agents/skills/
- [x] docs/PR-WORKFLOW.md + GitHub templates
- [x] `packages/api-harness` with Zod + fakes
- [x] `pnpm quality` script and baseline.json
- [x] CI workflow for lint/test/rust checks

## Dependencies

None — greenfield scaffold.
