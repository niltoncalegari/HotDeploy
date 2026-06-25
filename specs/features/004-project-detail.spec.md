# Spec 004 — Project Detail

## Metadata

| Field | Value |
|---|---|
| **ID** | 004 |
| **Phase** | 2.B |
| **Status** | shipped |
| **Spec path** | `specs/features/004-project-detail.spec.md` |

## Summary

View Docker Project detail with container list, health badges, ports, and compose contents.

## User journey

> As a **developer**, I want to **inspect containers in a Docker Project** so that **I can verify health and configuration**.

1. Open **Projects** and click a project name.
2. See container table with health badges and ports.
3. View compose file contents from the VPS.

## Tauri commands

| Command | Input | Output |
|---|---|---|
| `get_project` | `vmId`, `projectName` | `ProjectContent` |
| `get_project_containers` | `vmId`, `projectName` | `Container[]` |

## Hostinger API

| Method | Path |
|---|---|
| GET | `.../docker/{projectName}` |
| GET | `.../docker/{projectName}/containers` |

## Acceptance criteria

- [x] Route `/projects/:projectName` shows containers and compose
- [x] Health badges use design tokens
- [x] `pnpm quality` green

## Dependencies

- Spec 003
