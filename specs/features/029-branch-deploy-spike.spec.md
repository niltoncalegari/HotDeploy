# Spec 029 — Branch Deploy Spike

## Metadata

| Field | Value |
|---|---|
| **ID** | 029 |
| **Phase** | 8.D |
| **Status** | blocked |

## Summary

Document Hostinger API gap; disabled branch pinning placeholder in deploy UI.

## Acceptance criteria

- [x] ADR 003 documents blocker
- [x] Deploy UI shows disabled branch field
- [x] `pnpm quality` green

## Open questions

- Does Hostinger Docker Manager API accept `ref` or `branch` on deploy? Not documented as of Phase 8.
