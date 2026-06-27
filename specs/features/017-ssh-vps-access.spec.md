# Spec 017 — SSH VPS Access

## Metadata

| Field | Value |
|---|---|
| **ID** | 017 |
| **Phase** | 7.C |
| **Status** | shipped |
| **Spec path** | `specs/features/017-ssh-vps-access.spec.md` |

## Summary

Store SSH private key in vault, configure username/host per connection profile, and test SSH connectivity to the active VPS.

## User journey

> As a **DevOps lead**, I want to **save SSH credentials** so that **HotDeploy can install runners without manual shell access**.

1. Settings → SSH card: paste private key, set username (default `root`).
2. Optional host override per profile in workspace.
3. Test SSH → Connected badge.

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `save_ssh_credentials` | `private_key, username` | `()` | Vault |
| `get_ssh_status` | — | `{ configured: bool }` | |
| `test_ssh_connection` | `profile_id: String` | `{ connected: bool, message: string }` | Whitelist: echo only |

## Tests

- [x] Unit: SSH config parsing
- [x] Unit: missing key returns clear error

## Out of scope

- Arbitrary remote shell / REPL
- SSH for non-Hostinger providers

## Acceptance criteria

- [x] SSH key in vault only
- [x] Test uses VPS hostname from Provider API
- [x] ADR 001 referenced
- [x] `pnpm quality` green

## Dependencies

- ADR 001
- Spec 002 (connection profiles)
