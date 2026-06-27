# Spec 020 — Self-Hosted Runner

## Metadata

| Field | Value |
|---|---|
| **ID** | 020 |
| **Phase** | 7.F |
| **Status** | shipped |
| **Spec path** | `specs/features/020-self-hosted-runner.spec.md` |

## Summary

One-click install of a persistent GitHub Actions self-hosted runner on the VPS via SSH, with online/offline status.

## User journey

> As a **developer**, I want to **install a runner on my VPS in one click** so that **workflows run close to my Docker projects**.

1. Link repo + configure SSH.
2. Project detail → Install runner.
3. See status: installing → online / error.

## Tauri commands

| Command | Input | Output |
|---|---|---|
| `get_runner_registration_token` | `owner, repo` | `{ token: string, expires_at: string }` |
| `install_self_hosted_runner` | `profile_id, owner, repo` | `RunnerInstallResult` |
| `get_runner_status` | `profile_id, owner, repo` | `RunnerStatus` |

## Security notes

- Runner uses labels: `self-hosted`, `linux`, `hotdeploy`, `vps-{vmId}`
- Recommend dedicated `github-runner` user (documented in UI)
- Runner on same VPS as apps increases blast radius — warn in UI

## Tests

- [x] Unit: install script command sequence (no live SSH in CI)
- [x] Unit: runner name sanitization

## Out of scope

- JIT/ephemeral runners
- Uninstall / rotate UI
- Docker-based runner

## Acceptance criteria

- [x] Install via SSH whitelist commands
- [x] Status card on project detail
- [x] Requires PAT + SSH + repo link
- [x] `pnpm quality` green

## Dependencies

- Spec 015, 016, 017
