# Spec 009 — Multi-VPS

## Metadata

| Field | Value |
|---|---|
| **ID** | 009 |
| **Phase** | 5.A |
| **Status** | shipped |
| **Spec path** | `specs/features/009-multi-vps.spec.md` |

## Summary

Switch active VPS connection profile from the app header; preference persists in workspace.

## Acceptance criteria

- [x] VpsSwitcher in app shell when profiles exist
- [x] `activeConnectionProfileId` persisted
- [x] Projects queries keyed by active profile VM ID
- [x] `pnpm quality` green

## Dependencies

- Spec 003
