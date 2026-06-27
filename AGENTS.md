# AGENTS.md — HotDeploy

> Living document of project rules and context. Every agent session starts by reading this file.

## 1. Project intent

HotDeploy is a **cross-platform desktop app** (macOS, Linux, Windows) to orchestrate Docker Compose deployments on VPS hosts. v1 is **Hostinger-first** via the VPS Docker Manager API. Future phases add other providers through a Rust adapter layer — do not hard-code Hostinger assumptions in React.

**Symbol:** flame (`Flame` icon from lucide-react, brand SVG in `src/assets/brand/`).

## 2. Who uses it

- **Developer** — deploy and restart dockerized projects from the desktop
- **DevOps lead** — monitor Docker Project status across VPS instances

## 3. High-level architecture

```
src/ (React + shadcn/ui) ──invoke──► src-tauri/ (Rust)
                                         ├─ OS keychain (API keys)
                                         ├─ reqwest → Hostinger API
                                         └─ tauri-plugin-store (non-secret prefs)

packages/api-harness ──► Zod contracts + FakeHostingerClient for tests
specs/features/      ──► spec-driven development source of truth
```

Full detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 4. Stack — locked decisions

| Layer | Choice |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | React 19 + Vite + TypeScript |
| UI | shadcn/ui (new-york) + Tailwind CSS v4 |
| Forms | react-hook-form + zod |
| Data fetching | TanStack Query |
| Routing | react-router-dom |
| HTTP to Hostinger | Rust `reqwest` (never from React) |
| Secrets | `keyring` crate (OS keychain) |
| Package manager | pnpm workspaces |
| Tests | Vitest + Testing Library |
| Provider v1 | Hostinger VPS Docker Manager API |

## 5. Product principles

1. **Hostinger-first, provider-ready** — isolate provider logic in Rust; UI speaks domain language from `CONTEXT.md`.
2. **Secrets stay in Rust** — React invokes Tauri commands; no API keys in the frontend bundle.
3. **Spec before code** — every feature has a `specs/features/NNN-*.spec.md` before implementation.
4. **Thin vertical slices** — one PR = one demoable behavior.
5. **English artifacts** — all committed docs, code comments, UI strings, commits, and PR text in English.

## 6. Code conventions

- **TypeScript:** `strict`, `noUncheckedIndexedAccess`, no `any`, zod at boundaries.
- **React:** functional components; shadcn primitives in `src/components/ui/`; features in `src/features/`.
- **Rust:** `thiserror` for errors; Tauri commands return `Result<T, String>` with structured JSON errors.
- **Tailwind:** use design tokens from [DESIGN.md](DESIGN.md); no arbitrary color values.
- **Commits:** Conventional Commits; 1 PR = 1 cohesive change.

Full conventions: [docs/CONVENTIONS.md](docs/CONVENTIONS.md)

## 7. Folder structure

```
HotDeploy/
├── src/                 # React frontend
├── src-tauri/           # Rust backend + Tauri commands
├── packages/api-harness/  # Hostinger API fakes + Zod schemas
├── specs/               # Feature specs (SDD)
├── docs/                # Architecture, PR workflow, quality
├── scripts/             # quality-gate.sh
├── .cursor/rules/       # Cursor agent rules
├── .agents/skills/      # Agent skills
├── CONTEXT.md           # Ubiquitous language
├── AGENTS.md            # this file
├── CONTRIBUTING.md      # Slice lifecycle
└── PLAN.md              # Roadmap
```

## 8. How to run

| Goal | Command |
|---|---|
| Web UI only (browser) | `pnpm dev` |
| Desktop dev | `pnpm tauri:dev` |
| Production build | `pnpm tauri:build` |
| Lint + types + tests | `pnpm quality` |

Prerequisites: Node 20+, pnpm 9+, Rust stable, platform Tauri deps. See [docs/RUNBOOK.md](docs/RUNBOOK.md).

## 9. Roadmap

| Phase | Status | Goal |
|---|---|---|
| 0 — Foundation | in progress | Scaffold, harness, design system |
| 1 — Connection | planned | API key + VPS picker + connectivity test |
| 2 — Dashboard | planned | List Docker Projects + container status |
| 3 — Deploy | planned | Local compose upload + Environment Profile |
| 4 — Operations | planned | Lifecycle actions + logs |
| 5 — Polish | planned | Notifications, history, multi-VPS |
| 6 — Providers | planned | Non-Hostinger VPS adapters |

Detail: [PLAN.md](PLAN.md)

## 10. Rules for agents

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) before any feature slice.
2. Read [CONTEXT.md](CONTEXT.md) before changing domain behavior — includes mandatory [docs/COMMITS.md](docs/COMMITS.md) commit and version rules.
3. Read the relevant `specs/features/*.spec.md` before coding.
4. **Open or update the spec first** — no spec, no PR.
5. Do not create new `.md` files unless listed in §7 or explicitly requested.
6. Do not invent design tokens — update [DESIGN.md](DESIGN.md) first.
7. Provider API calls belong in `src-tauri/`, not `src/`.
8. Use `@hotdeploy/api-harness` for tests; never call real Hostinger API in unit tests.
9. Run `pnpm quality` before every PR.
10. Never edit `baseline.json` to pass the gate.
11. For PRs, follow [docs/PR-WORKFLOW.md](docs/PR-WORKFLOW.md).
12. For commits and version bumps, follow [docs/COMMITS.md](docs/COMMITS.md) (referenced from [CONTEXT.md](CONTEXT.md)).

## 11. Quality gate

Run `pnpm quality` before every PR — mandatory. See [docs/QUALITY.md](docs/QUALITY.md).

## 12. External references

- [Tauri 2 docs](https://v2.tauri.app/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Hostinger API — Docker Manager](https://github.com/hostinger/api-python-sdk/blob/main/docs/VPSDockerManagerApi.md)
- [Hostinger deploy-on-vps Action](https://github.com/hostinger/deploy-on-vps)
