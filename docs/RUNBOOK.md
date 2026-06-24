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
Bundle icons: `src-tauri/icons/` (replace with flame-themed assets before public release)

Regenerate Tauri icons from SVG:

```bash
pnpm tauri icon src/assets/brand/flame.svg
```

## Release (future)

Before public distribution:

- [ ] Code signing (macOS notarization, Windows Authenticode)
- [ ] Tauri updater configuration
- [ ] Tighten CSP in `tauri.conf.json`

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
