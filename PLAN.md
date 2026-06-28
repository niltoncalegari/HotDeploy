# HotDeploy Roadmap

## Vision

Ship a dependable desktop control panel for Docker Compose deployments, starting with Hostinger VPS. Expand to additional providers once the Hostinger path is stable and tested.

## Phases

| Phase | ID | Goal | Key deliverables |
|---|---|---|---|
| 0 — Foundation | `0` | Project scaffold | Tauri app shell, shadcn, harness, specs, CI |
| 1 — Connection | `1.A` | Connect Hostinger | API key form, VPS picker, connectivity test |
| 2 — Dashboard | `2.A` | List projects | Deployment Panel with Docker Project rows |
| 2 — Dashboard | `2.B` | Project detail | Container list, health badges |
| 3 — Deploy | `3.A` | Local deploy | Compose file picker, Environment Profile |
| 3 — Deploy | `3.B` | GitHub deploy | Deploy Source URL input |
| 4 — Operations | `4.A` | Lifecycle | start/stop/restart/update commands |
| 4 — Operations | `4.B` | Logs | Container log viewer |
| 5 — Polish | `5.A` | Multi-VPS | Switch default VPS, remember last used |
| 5 — Polish | `5.B` | History | Local deployment history (non-secret) |
| 6 — Providers | `6.A` | Adapter layer | `VpsProvider` trait + second provider |
| 7 — GitHub CI/CD | `7.A` | GitHub PAT | Connect GitHub, test connection |
| 7 — GitHub CI/CD | `7.B` | Repo linking | Link repos to Docker Projects |
| 7 — GitHub CI/CD | `7.C` | SSH access | SSH credentials + connectivity test |
| 7 — GitHub CI/CD | `7.D` | Secrets/variables | Manage GitHub Actions secrets |
| 7 — GitHub CI/CD | `7.E` | Workflow generator | Auto-create CI/CD YAML |
| 7 — GitHub CI/CD | `7.F` | Self-hosted runner | One-click runner on VPS |
| 7 — GitHub CI/CD | `7.G` | UX polish | Skeletons, empty states, confirmations |
| 8 — GitHub Advanced | `8.A` | GitHub App | Device flow authentication |
| 8 — GitHub Advanced | `8.B` | Runner ops | Uninstall + re-register runner |
| 8 — GitHub Advanced | `8.C` | Push deploy | Workflow polling auto-deploy |
| 8 — GitHub Advanced | `8.D` | Branch spike | Blocked — Hostinger API gap |
| 8 — GitHub Advanced | `8.E` | Onboarding | First-run guided wizard |
| 8 — GitHub Advanced | `8.F` | Select migration | shadcn Select replaces native `<select>` |
| 8 — GitHub Advanced | `8.G` | Secrets sync | Environment Profile → GitHub secrets |
| 8 — GitHub Advanced | `8.H` | Environments | GitHub Environments CRUD |
| 9 — CI Visibility | `9.A` | Actions panel | Workflows, runs, dispatch from app |

## Provider strategy

| Milestone | Providers |
|---|---|
| v0.1–v0.4 | Hostinger only |
| v0.5+ | Generic VPS adapter design; evaluate DigitalOcean, Hetzner, raw SSH+docker (out of scope for v1) |

**Rule for agents:** do not add non-Hostinger provider UI until Phase 6 spec is approved. Use adapter stubs in Rust only if a spec explicitly requires it.

## Slice naming

Slices use `{phase}.{letter}` in specs and branches: `1.A`, `2.B`, etc.

Branch pattern: `feat/slice-1a-hostinger-connection`

## Tracking

- Specs: `specs/features/NNN-*.spec.md`
- GitHub Issues: label `slice:vertical`, `phase:N`
- Close issue with PR link on merge

## Current status

**Phases 0–8 — shipped.** Specs 000–011, 015–029 complete. **Phase 9.A — shipped** (spec 030 CI/Actions panel). **App version:** `0.9.0` (minor = phase).

## Phase 9 punch list

| ID | Idea | Status |
|---|---|---|
| 9.A | CI / Actions panel | shipped — spec 030 |
| 9.B | Webhook HTTP server | Real-time push-to-deploy |
| 9.C | Org-wide GitHub App installations | Installation tokens for orgs |
| 9.D | Bidirectional secrets sync | GitHub → Environment Profile |
| 9.E | Branch deploy (real) | When Hostinger API supports ref |
| 9.F | Multi-runner auto-scaling | JIT/ephemeral runners |
| 9.G | Deploy project wizard in onboarding | Extend spec 024 |

## Versioning (pre-1.0)

| Part | Meaning | Example |
|---|---|---|
| **Major** | `0` until 1.0 GA | `0`.8.0 |
| **Minor** | Shipped roadmap **Phase** | Phase 9 → `0.9.x` |
| **Patch** | Slice PR or fix within phase | `0.9.0` → `0.9.1` |

**Source of truth:** root [`package.json`](package.json) `version` field.

```bash
# After merging a slice in the same phase
pnpm version:bump patch

# When starting a new phase (e.g. Phase 9)
pnpm version:bump phase 9

# Propagate to Cargo.toml + tauri.conf.json + api-harness
pnpm version:sync
```

UI reads version via [`src/lib/app-version.ts`](src/lib/app-version.ts). Detail: [docs/RUNBOOK.md](docs/RUNBOOK.md#versioning).
