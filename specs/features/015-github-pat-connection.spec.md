# Spec 015 — GitHub PAT Connection

## Metadata

| Field | Value |
|---|---|
| **ID** | 015 |
| **Phase** | 7.A |
| **Status** | shipped |
| **Spec path** | `specs/features/015-github-pat-connection.spec.md` |

## Summary

Save a GitHub Personal Access Token in the Credential Vault, test connectivity, and show Connected/Disconnected status in Settings.

## User journey

> As a **developer**, I want to **connect my GitHub account** so that **HotDeploy can list repos and manage CI/CD**.

1. Open Settings → GitHub card.
2. Paste PAT and save.
3. Click Test connection → see login name and Connected badge.

## UI

| Surface | Change |
|---|---|
| Settings | `GitHubCredentialsCard` with PAT input, status badges, test button |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `save_github_pat` | `pat: String` | `()` | Vault only |
| `get_github_status` | — | `{ connected: bool, login?: string }` | Never returns PAT |
| `test_github_connection` | — | `{ login: string, scopes: string[] }` | `GET /user` |

## Tests

- [x] Unit: `github/client.rs` — parse user response
- [x] Unit: `src/lib/github/client.test.ts` — invoke wrappers
- [x] Manual: save PAT, test, clear

## Out of scope

- GitHub App / OAuth device flow (Phase 7+ future slice)
- Org-level PAT management UI

## Acceptance criteria

- [x] PAT stored in vault, not workspace.json
- [x] `get_github_status` never returns token
- [x] Test connection shows GitHub login
- [x] `pnpm quality` green

## Dependencies

- ADR 001 (SSH unrelated but same Phase 7 docs batch)
