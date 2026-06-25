# Spec 012 — React Page Component Tests

## Metadata

| Field | Value |
|---|---|
| **ID** | 012 |
| **Phase** | 5.C (polish) |
| **Status** | approved |
| **Spec path** | `specs/features/012-react-page-tests.spec.md` |

## Summary

Add Testing Library coverage for primary feature pages introduced in phases 1–5, using mocked Tauri invoke wrappers and shared test render utilities.

## User journey

> As a **maintainer**, I want **automated UI regression tests** so that **refactors to Settings and Projects do not break onboarding and deploy flows**.

## Tests

| Component | Scenarios |
|---|---|
| `CredentialsCard` | Not configured badge; Load VPS list button; Save disabled states |
| `ProjectsPage` | No VPS prompt; remote project cards; deploy picker when multiple configs |
| `VpsSwitcher` | Renders active profile options |
| `HistoryCard` | Empty state; history rows |

## Out of scope

- Full E2E against real Hostinger API
- Visual regression / Playwright
- Project detail page interaction tests (follow-up)

## Acceptance criteria

- [ ] Shared `renderWithProviders` test helper
- [ ] Colocated `*.test.tsx` for listed components
- [ ] `pnpm quality` green; coverage does not regress

## Dependencies

- Specs 002–010 shipped
