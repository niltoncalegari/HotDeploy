# Spec 013 — Release Hardening

## Metadata

| Field | Value |
|---|---|
| **ID** | 013 |
| **Phase** | 5.D (polish) |
| **Status** | approved |
| **Spec path** | `specs/features/013-release-hardening.spec.md` |

## Summary

Prepare HotDeploy for public distribution: tighten Content Security Policy, scaffold Tauri auto-updater (disabled until signing keys exist), and document code-signing steps per platform in RUNBOOK.

## User journey

> As a **release engineer**, I want **documented signing and updater hooks** so that **we can ship signed builds when certificates are available**.

## Changes

| Area | Change |
|---|---|
| `tauri.conf.json` | Production CSP; updater plugin config with placeholder pubkey |
| `src-tauri` | Register `tauri-plugin-updater` (inactive until env enables it) |
| `docs/RUNBOOK.md` | macOS notarization, Windows Authenticode, updater pubkey generation |

## Out of scope

- Actual Apple / Microsoft signing certificates (user-provided)
- Public update CDN deployment
- Windows MSI custom actions

## Acceptance criteria

- [ ] CSP restricts scripts to self; allows provider API hosts in `connect-src`
- [ ] Updater plugin registered; disabled by default without pubkey env
- [ ] RUNBOOK documents signing and updater setup
- [ ] `pnpm quality` green

## Dependencies

- Spec 000 scaffold
