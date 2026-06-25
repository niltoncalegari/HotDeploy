# Spec 001 — Workspace Configuration

## Metadata

| Field | Value |
|---|---|
| **ID** | 001 |
| **Phase** | 0.B |
| **Status** | shipped |
| **Spec path** | `specs/features/001-workspace-config.spec.md` |

## Summary

Persist non-secret **Workspace** preferences in a local `workspace.json` file managed by Rust. Users can toggle dark mode, define **Connection Profiles** (VPS targets), and register **Deploy Projects** (local Compose path or GitHub URL) before Phase 1 live Hostinger calls ship.

## User journey

> As a **developer**, I want to **save UI and deployment preferences locally** so that **HotDeploy remembers my VPS targets and projects across restarts**.

1. Open **Settings**.
2. Toggle **Dark mode**; the app applies `.dark` tokens immediately and persists to `workspace.json`.
3. Add a **Connection Profile** with a label and Hostinger virtual machine ID.
4. Add a **Deploy Project** linked to a profile, with Compose file path (or GitHub URL) and optional **Environment Profile**.
5. Open **Projects** and see configured deploy projects listed (remote status still Phase 2).

## UI

| Surface | Change |
|---|---|
| Settings — Appearance | Card with dark mode `Switch` |
| Settings — Connection Profiles | List + add/remove VPS targets (`Card`, `Input`, `Button`) |
| Settings — Deploy Projects | List + add/remove project configs (`Card`, `Input`, `Textarea`) |
| Settings — footer | Caption showing `workspace.json` path |
| Projects | List saved deploy projects when profiles exist |
| App root | `ThemeProvider` applies theme on load |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `get_workspace` | — | `WorkspaceConfig` | Read or default |
| `save_workspace` | `WorkspaceConfig` | — | Pretty-print JSON |
| `get_workspace_file_path` | — | `string` | Absolute path for UI caption |

## Hostinger API

No new API calls. VM IDs are stored locally; credentials remain in **Credential Vault** (keychain).

## Tests

- [x] Rust: default config + serde round-trip
- [x] TS: Zod schema validation
- [x] TS: `resolveThemeClass` utility
- [x] Manual: toggle dark mode, restart app, theme persists

## Out of scope

- Live VPS picker from Hostinger API (Phase 1)
- Running deployments from saved project config (Phase 3)
- Multiple API keys per profile (single keychain entry in v1)
- Editing `workspace.json` from outside the app (file is human-readable but UI is canonical)

## Acceptance criteria

- [x] `workspace.json` created under OS app config directory on first save
- [x] Dark mode toggle persists and restores on launch
- [x] User can add/remove Connection Profiles and Deploy Projects
- [x] Projects page lists saved deploy projects
- [x] API keys never written to `workspace.json`
- [x] `pnpm quality` green

## Dependencies

- Spec 000 — scaffold (`tauri-plugin-store` present; workspace uses dedicated JSON file via Rust `std::fs`)
