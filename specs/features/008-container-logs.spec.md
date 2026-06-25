# Spec 008 — Container Logs

## Metadata

| Field | Value |
|---|---|
| **ID** | 008 |
| **Phase** | 4.B |
| **Status** | shipped |
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

- [x] Logs panel on project detail
- [x] Filter by service
- [x] `pnpm quality` green

## Dependencies

- Spec 007
