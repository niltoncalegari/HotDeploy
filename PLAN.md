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

**Phases 0–5 — shipped.** Specs 000–010 complete. Phase 6 (multi-provider) is next.
