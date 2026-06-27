# Spec 021 — Deployment Panel UX Polish

## Metadata

| Field | Value |
|---|---|
| **ID** | 021 |
| **Phase** | 7.G |
| **Status** | shipped |
| **Spec path** | `specs/features/021-deployment-panel-ux.spec.md` |

## Summary

Improve Deployment Panel and Settings UX: skeleton loading, flame empty states, VPS-filtered deploy configs, not-found handling, deploy progress, delete confirmations, provider-agnostic copy.

## User journey

> As a **developer**, I want a **clearer Projects experience** so that **I always know system status and avoid mistakes**.

## UI

| Surface | Change |
|---|---|
| ProjectsPage | Filter local configs by active VPS; skeletons; empty states; deploy spinner |
| ProjectDetailPage | Not-found state; redeploy action; skeletons |
| Settings cards | Delete confirmations; provider-agnostic empty copy |
| Shared | `EmptyState` component per DESIGN.md |

## Tests

- [x] Unit: deploy config filter by `connectionProfileId`
- [x] Component: EmptyState renders flame icon

## Out of scope

- Full onboarding wizard (future)
- shadcn Select migration (all selects)

## Acceptance criteria

- [x] Local deploy configs filtered by active profile
- [x] Skeleton loading on projects/containers
- [x] Empty states use centered Flame icon
- [x] Invalid project URL shows not-found card
- [x] Deploy button shows progress during mutation
- [x] Destructive deletes require confirmation dialog
- [x] Provider-agnostic credential empty states
- [x] `pnpm quality` green

## Dependencies

- None (parallel with Phase 7)
