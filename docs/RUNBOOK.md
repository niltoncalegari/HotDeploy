# Runbook

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| Rust | stable (via [rustup](https://rustup.rs/)) |
| Platform deps | [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) |

### macOS

```bash
xcode-select --install
```

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### Windows

Install Visual Studio Build Tools with C++ workload and WebView2.

## First-time setup

```bash
cd ~/repo/HotDeploy
pnpm install
```

Optional: copy `.env.example` to `.env` for local dev flags (no secrets required for scaffold).

## Development

| Command | Description |
|---|---|
| `pnpm dev` | Vite only (browser; Tauri commands will fail) |
| `pnpm tauri:dev` | Full desktop app with hot reload |
| `pnpm tauri:build` | Production desktop bundle |
| `pnpm test` | Vitest |
| `pnpm quality` | Full quality gate |

## Project structure quick reference

- Frontend: `src/`
- Rust / Tauri: `src-tauri/`
- API test harness: `packages/api-harness/`
- Agent entry: `AGENTS.md`

## Hostinger credentials (Phase 1+)

1. Create API key in Hostinger hPanel
2. In HotDeploy Settings, paste key — stored in OS keychain
3. Select VPS virtual machine ID

Never commit API keys. Never store keys in `tauri-plugin-store`.

## Icons

Brand flame SVG: `src/assets/brand/flame.svg`  
App icon source: `src/assets/brand/app-icon.svg` (rounded squircle on black, orange outline flame)  
Bundle icons: `src-tauri/icons/` (regenerate from `app-icon.svg` when the mark changes)

Regenerate Tauri icons from SVG:

```bash
pnpm tauri icon src/assets/brand/app-icon.svg
```

After changing icons, restart `pnpm tauri:dev` so Cargo re-embeds `icon.icns` / `icon.ico` for the Dock and taskbar.

## Release (future)

Before public distribution:

- [ ] Code signing (macOS notarization, Windows Authenticode)
- [x] Tauri updater plugin scaffold (`active: false` until pubkey is set)
- [x] Production CSP in `tauri.conf.json`

### Code signing

| Platform | Requirement | Env / config |
|---|---|---|
| macOS | Apple Developer ID + notarization | `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` |
| Windows | Authenticode certificate | `TAURI_SIGNING_PRIVATE_KEY` or `certificateThumbprint` in `tauri.conf.json` |

Run production builds only on trusted CI runners with secrets injected from a vault — never commit certificates.

```bash
# macOS example (after certificates are installed in keychain)
pnpm tauri:build
```

### Auto-updater

1. Generate signing keys: `pnpm tauri signer generate -w ~/.tauri/hotdeploy.key`
2. Set `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`
3. Set `plugins.updater.active` to `true` when the release CDN is ready
4. Publish update artifacts to the endpoint template in `tauri.conf.json`

Updater stays **disabled** in local dev until a pubkey and release endpoint are configured.

### Content Security Policy

Production CSP allows:

- `connect-src` to Hostinger and DigitalOcean APIs
- `ipc:` for Tauri IPC
- `http://localhost:*` / `ws://localhost:*` for Vite dev (remove for strict production builds if needed)

Tighten further before store distribution if the app does not load remote assets.

## Versioning

HotDeploy uses **semver** before 1.0. The **minor** version tracks the shipped roadmap **Phase**; **patch** increments per slice or fix within that phase.

| Phase shipped | App version |
|---|---|
| 0 — Foundation | `0.0.x` |
| 1 — Connection | `0.1.x` |
| … | … |
| 8 — GitHub Advanced | `0.8.x` |

**Canonical file:** `package.json` → `"version"`.

```bash
# Bump patch after a slice PR (same phase)
pnpm version:bump patch

# Bump when a new phase ships
pnpm version:bump phase 9

# Sync to Rust / Tauri / api-harness (also runs after bump)
pnpm version:sync
```

Synced targets: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `packages/api-harness/package.json`.

React UI imports `APP_VERSION` from `src/lib/app-version.ts` (do not hard-code version strings in components).

## Troubleshooting

| Problem | Fix |
|---|---|
| Port 1420 in use | Stop other Vite/Tauri dev servers |
| `cargo` not found | Install Rust via rustup |
| Keychain errors on Linux | Install `libsecret` / gnome-keyring |
| Tauri command fails in browser-only `pnpm dev` | Use `pnpm tauri:dev` |

## Related

- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/PR-WORKFLOW.md](PR-WORKFLOW.md)
