# Spec 008 — Container Logs

## Metadata

| Field | Value |
|---|---|
| **ID** | 008 |
| **Phase** | 4.B |
| **Status** | approved |
| **Spec path** | `specs/features/008-container-logs.spec.md` |

## Summary

View aggregated container logs on the project detail page with service filter and refresh.

## Tauri commands

| Command | Input | Output |
|---|---|---|
| `get_project_logs` | `vmId`, `projectName` | `LogEntry[]` |

## Hostinger API

| Method | Path |
|---|---|
| GET | `.../docker/{projectName}/logs` |

## Acceptance criteria

- [ ] Logs panel on project detail
- [ ] Filter by service
- [ ] `pnpm quality` green

## Dependencies

- Spec 007
