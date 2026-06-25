# Spec 009 — Multi-VPS

## Metadata

| Field | Value |
|---|---|
| **ID** | 009 |
| **Phase** | 5.A |
| **Status** | approved |
| **Spec path** | `specs/features/009-multi-vps.spec.md` |

## Summary

Switch active VPS connection profile from the app header; preference persists in workspace.

## Acceptance criteria

- [ ] VpsSwitcher in app shell when profiles exist
- [ ] `activeConnectionProfileId` persisted
- [ ] Projects queries keyed by active profile VM ID
- [ ] `pnpm quality` green

## Dependencies

- Spec 003
