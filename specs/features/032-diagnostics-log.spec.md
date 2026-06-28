# Spec 032 — Diagnostics Log & Issue Bundle

## Metadata

| Field | Value |
|---|---|
| **ID** | 032 |
| **Phase** | 9.C |
| **Status** | shipped |
| **Spec path** | `specs/features/032-diagnostics-log.spec.md` |

## Summary

Persist an append-only **diagnostics log** in the app config folder, capture errors automatically (including workspace save failures), and expose a **Copy issue report** bundle with sanitized workspace structure for GitHub issues.

## User journey

> As a **developer**, I want to **export logs and workspace context when something fails** so that **I can open a GitHub issue with enough detail to debug quickly**.

1. An error occurs (e.g. save deploy project fails) — entry is appended to `hotdeploy.log`.
2. Open **Settings → General → Diagnostics**.
3. Review recent log lines or copy the full issue report (version, OS, credentials status, workspace summary, log tail).
4. Paste into a GitHub issue or share the log file path with support.

## UI

| Surface | Change |
|---|---|
| `DiagnosticsCard` | Settings → General — log path, recent tail, Copy issue report, Open log folder |
| Toasts / mutations | Auto-log failures via `logDiagnosticError` |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `append_diagnostic_log` | `level, source, message, context?` | `void` | Append-only, rotated at 512 KB |
| `get_diagnostic_log_path` | — | `string` | Absolute path |
| `read_diagnostic_log_tail` | `maxLines?` | `string` | Default 200 lines |
| `build_diagnostics_report` | — | `string` | Markdown bundle, no secrets |

## Tests

- [x] Unit: log rotation and append (Rust)
- [x] Unit: workspace summary redacts environment profile values
- [x] Unit: TS invoke wrappers

## Out of scope

- Remote log upload / crash analytics
- Log viewer with live tail in UI
- Sentry integration

## Acceptance criteria

- [x] Log file written under app config dir
- [x] Save workspace errors logged automatically
- [x] Settings card copies sanitized issue report
- [x] No API keys or PATs in report
- [x] `pnpm quality` green

## Dependencies

- Spec 001 (workspace)
