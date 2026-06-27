# Spec 028 — Push Deploy Polling

## Metadata

| Field | Value |
|---|---|
| **ID** | 028 |
| **Phase** | 8.C |
| **Status** | shipped |

## Summary

Toggle auto-deploy when a successful workflow run completes on the default branch.

## Acceptance criteria

- [x] `autoDeployOnPush` on deploy project config
- [x] Poll workflow runs and trigger deploy on success
- [x] `pnpm quality` green
