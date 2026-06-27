# Spec 027 — GitHub App Device Flow

## Metadata

| Field | Value |
|---|---|
| **ID** | 027 |
| **Phase** | 8.A |
| **Status** | shipped |

## Summary

Connect GitHub via device flow (`user_code` at github.com/login/device); PAT remains fallback.

## Acceptance criteria

- [x] `start_github_device_flow` and `poll_github_device_token` commands
- [x] `githubAuthMethod` stored in vault
- [x] Device flow UI in GitHub credentials card
- [x] `pnpm quality` green
