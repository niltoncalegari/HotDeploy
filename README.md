# HotDeploy

Cross-platform desktop control panel for orchestrating Docker Compose deployments on VPS infrastructure.

**Hostinger-first** — v1 targets the [Hostinger VPS Docker Manager API](https://github.com/hostinger/api-python-sdk/blob/main/docs/VPSDockerManagerApi.md). Additional providers are planned after Hostinger support is stable.

![HotDeploy](public/flame.svg)

## Features (roadmap)

| Phase | Capability |
|---|---|
| 0 | App shell, design system, agent harness |
| 1 | Connect Hostinger API key + VPS |
| 2 | List Docker Projects and container health |
| 3 | Deploy from local compose or GitHub URL |
| 4 | Start / stop / restart / logs |
| 5+ | Multi-VPS, history, more providers |

See [PLAN.md](PLAN.md) for details.

## Stack

- **Tauri 2** — desktop shell (macOS, Linux, Windows)
- **React 19 + Vite + TypeScript**
- **shadcn/ui** + Tailwind CSS v4 — flame design system
- **Rust** — secrets, Hostinger HTTP client

## Quick start

```bash
cd ~/repo/HotDeploy
pnpm install
pnpm tauri:dev
```

Prerequisites: Node 20+, pnpm 9+, Rust stable, [Tauri platform deps](https://v2.tauri.app/start/prerequisites/).

Browser-only UI (Tauri commands unavailable):

```bash
pnpm dev
```

## Quality

```bash
pnpm quality   # lint + types + tests + baseline ratchet
```

## Documentation

| Doc | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Agent entry point |
| [CONTEXT.md](CONTEXT.md) | Domain language |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Slice / spec workflow |
| [docs/PR-WORKFLOW.md](docs/PR-WORKFLOW.md) | PR titles, descriptions, `gh` automation |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Dev setup and troubleshooting |

## Project layout

```
src/                  React UI
src-tauri/            Rust + Tauri commands
packages/api-harness/ Hostinger API fakes for tests
specs/                Spec-driven development
.cursor/rules/        Cursor agent rules
.agents/skills/       Agent skills (TDD, Hostinger API, PR)
```

## Security

API keys are stored in the **OS keychain** via Rust — never in the frontend bundle or git.

## License

MIT — see [LICENSE](LICENSE).
