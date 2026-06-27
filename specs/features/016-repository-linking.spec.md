# Spec 016 — Repository Linking

## Metadata

| Field | Value |
|---|---|
| **ID** | 016 |
| **Phase** | 7.B |
| **Status** | shipped |
| **Spec path** | `specs/features/016-repository-linking.spec.md` |

## Summary

Link Deploy Projects and Docker Projects to GitHub `owner/repo`; show badges and deep links in Projects list and detail page.

## User journey

> As a **developer**, I want to **see which GitHub repo backs each Docker Project** so that **I can jump to source and CI settings**.

1. Register deploy project with GitHub source (picker or URL).
2. Projects list shows repo badge.
3. Detail page shows GitHub link and default branch.

## UI

| Surface | Change |
|---|---|
| DeployProjectsCard | Repo picker when GitHub PAT connected |
| ProjectsPage | GitHub badge on linked projects |
| ProjectDetailPage | Repo link in header area |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `list_github_repos` | `page?: u32` | `GitHubRepo[]` | Paginated user repos |

## Tests

- [x] Unit: `parse_github_repo_url` Rust + TS
- [x] Unit: schema `githubLink` optional field

## Out of scope

- Auto-sync branch on deploy
- Link containers to individual repo paths

## Acceptance criteria

- [x] `githubLink` on deploy project config
- [x] Auto-fill from GitHub deploy source URL
- [x] Repo badge visible on list and detail
- [x] `pnpm quality` green

## Dependencies

- Spec 015
