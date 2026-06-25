# Spec 006 — GitHub Deploy

## Metadata

| Field | Value |
|---|---|
| **ID** | 006 |
| **Phase** | 3.B |
| **Status** | shipped |
| **Spec path** | `specs/features/006-github-deploy.spec.md` |

## Summary

Configure GitHub repository URL as deploy source and deploy via Hostinger API (VPS uses existing deploy key for private repos).

## User journey

> As a **developer**, I want to **deploy from my private GitHub repo** so that **the VPS pulls the latest compose from GitHub**.

1. In Settings, set deploy source type to GitHub.
2. Enter `https://github.com/user/repo`.
3. Deploy from Projects page.

## Out of scope

- Configuring GitHub deploy keys (VPS-side setup)

## Acceptance criteria

- [x] Deploy source toggle local/GitHub in Settings
- [x] `deploy_project` sends GitHub URL as `content`
- [x] `pnpm quality` green

## Dependencies

- Spec 005
