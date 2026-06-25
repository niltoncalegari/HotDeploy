# Spec 007 — Lifecycle Actions

## Metadata

| Field | Value |
|---|---|
| **ID** | 007 |
| **Phase** | 4.A |
| **Status** | approved |
| **Spec path** | `specs/features/007-lifecycle-actions.spec.md` |

## Summary

Start, stop, restart, and update Docker Projects from the project detail page.

## Tauri commands

| Command | Action |
|---|---|
| `start_project` | POST `.../start` |
| `stop_project` | POST `.../stop` |
| `restart_project` | POST `.../restart` |
| `update_project` | POST `.../update` |

## Acceptance criteria

- [ ] Lifecycle buttons on project detail
- [ ] Confirmation for stop and update
- [ ] `pnpm quality` green

## Dependencies

- Spec 004
