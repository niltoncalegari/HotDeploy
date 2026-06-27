# Spec 025 — Environment Profile Secrets Sync

## Metadata

| Field | Value |
|---|---|
| **ID** | 025 |
| **Phase** | 8.G |
| **Status** | shipped |

## Summary

One-way import of Environment Profile keys into GitHub repository secrets.

## Acceptance criteria

- [x] Parse `KEY=value` lines from environment profile
- [x] Preview with masked values; import selected keys
- [x] `pnpm quality` green
