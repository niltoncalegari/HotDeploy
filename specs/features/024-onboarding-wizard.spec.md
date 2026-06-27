# Spec 024 — Onboarding Wizard

## Metadata

| Field | Value |
|---|---|
| **ID** | 024 |
| **Phase** | 8.E |
| **Status** | shipped |

## Summary

Skippable first-run wizard guiding provider setup, VPS selection, GitHub, and SSH.

## Acceptance criteria

- [x] `onboardingCompleted` in workspace schema
- [x] Redirect to `/onboarding` when incomplete
- [x] Wizard skippable; re-open from Settings
- [x] Welcome step checkbox to skip setup and mark `onboardingCompleted` (do not show again on launch)
- [x] `pnpm quality` green
