# Spec 022 — Runner Uninstall + Rotate

## Metadata

| Field | Value |
|---|---|
| **ID** | 022 |
| **Phase** | 8.B |
| **Status** | shipped |
| **Spec path** | `specs/features/022-runner-uninstall-rotate.spec.md` |

## Summary

Uninstall or re-register a self-hosted GitHub Actions runner on the VPS via SSH whitelist commands.

## User journey

> As a **developer**, I want to **remove or refresh my VPS runner** so that **I can recover from failed installs or rotate registration**.

## Tauri commands

| Command | Input | Output |
|---|---|---|
| `uninstall_self_hosted_runner` | profileId, owner, repo | `RunnerUninstallResult` |
| `rotate_runner_registration` | profileId, owner, repo | `RunnerInstallResult` |

## Tests

- [x] Unit: `uninstall_runner_script` contains `config.sh remove`
- [x] Unit: `RunnerStatusCard` shows confirm before uninstall

## Acceptance criteria

- [x] Uninstall via SSH whitelist commands
- [x] Re-register reuses install flow with new token
- [x] Destructive actions require confirmation dialog
- [x] `pnpm quality` green

## Dependencies

- Spec 020
