# Spec 018 — GitHub Secrets and Variables

## Metadata

| Field | Value |
|---|---|
| **ID** | 018 |
| **Phase** | 7.D |
| **Status** | shipped |
| **Spec path** | `specs/features/018-github-secrets-variables.spec.md` |

## Summary

Manage GitHub Actions secrets (write-only) and variables for a linked repository from Project Detail.

## User journey

> As a **developer**, I want to **manage repo secrets from HotDeploy** so that **CI/CD and deploy workflows have the right credentials**.

1. Open linked project detail → GitHub tab.
2. List secrets (names + updated_at) and variables (names + values).
3. Create/update/delete entries.

## Tauri commands

| Command | Input | Output |
|---|---|---|
| `list_github_secrets` | `owner, repo` | `GitHubSecretMeta[]` |
| `upsert_github_secret` | `owner, repo, name, value` | `()` |
| `delete_github_secret` | `owner, repo, name` | `()` |
| `list_github_variables` | `owner, repo` | `GitHubVariable[]` |
| `upsert_github_variable` | `owner, repo, name, value` | `()` |
| `delete_github_variable` | `owner, repo, name` | `()` |

## Tests

- [x] Unit: libsodium sealed-box encrypt with fixture public key
- [x] Component: secrets panel renders list

## Out of scope

- Environment secrets (GitHub Environments)
- Sync with Environment Profile

## Acceptance criteria

- [x] Secret values never returned to UI after save
- [x] Variables show values (GitHub API behavior)
- [x] Requires linked repo + PAT
- [x] `pnpm quality` green

## Dependencies

- Spec 015, 016
