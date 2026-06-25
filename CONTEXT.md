# HotDeploy

HotDeploy is a cross-platform desktop control panel for orchestrating Docker Compose deployments on VPS infrastructure. The product is **Hostinger-first**: Phase 1–4 target the official Hostinger VPS Docker Manager API. Additional VPS providers are planned after Hostinger support is stable.

## Language

**Workspace**:
The local HotDeploy installation on a developer machine, including stored credentials and UI preferences.
_Avoid_: account, tenant, organization

**Connection Profile**:
The pairing of a provider API credential with a default target VPS inside a Workspace.
_Avoid_: login session, auth bundle

**Provider**:
The cloud host that exposes VPS and Docker management APIs. v1 provider: Hostinger.
_Avoid_: platform backend, server vendor (when meaning API integration)

**VPS**:
A virtual machine reachable through a Provider API. HotDeploy never SSHes directly in v1.
_Avoid_: server, droplet (unless quoting provider docs)

**Docker Project**:
A named Docker Compose stack managed as a single unit on a VPS.
_Avoid_: service, container group, stack (in UI copy)

**Compose File**:
The `docker-compose.yaml` (or `.yml`) content used to create or update a Docker Project.
_Avoid_: manifest, deployment yaml

**Deploy Source**:
Where Compose File content originates: local file picker or remote GitHub repository URL.
_Avoid_: build artifact, image bundle

**Deployment**:
The act of creating or replacing a Docker Project on a VPS from a Deploy Source plus optional Environment Profile.
_Avoid_: release, publish (unless CI context)

**Environment Profile**:
Key/value environment variables sent with a Deployment (newline-separated `KEY=value`).
_Avoid_: dotenv file, secrets blob

**Container Health**:
Provider-reported runtime health for a container (`healthy`, `unhealthy`, `starting`, `none`).
_Avoid_: uptime, ping status

**Lifecycle Action**:
Start, stop, restart, or update an existing Docker Project without changing Deploy Source.
_Avoid_: toggle, ops command

**Deployment Panel**:
The primary surface listing Docker Projects for the connected VPS.
_Avoid_: dashboard (generic), home page

**Credential Vault**:
OS keychain storage for Provider API keys. React never reads raw secrets.
_Avoid_: localStorage token, settings password field persistence

## Personas

| Persona | Goal |
|---|---|
| **Developer** | Deploy and restart dockerized apps from the desktop without opening hPanel |
| **DevOps lead** | See project/container status across one or more VPS instances |

## Core user journeys

### Connect Hostinger VPS

1. Open **Settings**.
2. Paste Hostinger API key (stored in **Credential Vault**).
3. Select default **VPS** (virtual machine ID).
4. HotDeploy validates connectivity (Phase 1).

### List Docker Projects

1. Open **Deployment Panel**.
2. App loads Docker Projects for the default VPS.
3. Each row shows name, state, container count, and health summary.

### Deploy from local Compose File

1. Choose **Deploy project**.
2. Pick local `docker-compose.yaml`.
3. Optional: edit **Environment Profile**.
4. Confirm **Deployment**; monitor state until running or failed.

### Lifecycle actions

From a Docker Project detail view: run **Lifecycle Action** (start/stop/restart/update) or open container logs.

## Hostinger API boundaries

HotDeploy calls Hostinger REST endpoints only. The VPS runs Docker; HotDeploy does not install Docker or manage OS packages.

| Concern | Owner |
|---|---|
| API authentication | HotDeploy desktop (Bearer token from Credential Vault) |
| Compose orchestration | Hostinger VPS Docker Manager on the VPS |
| Container runtime | Docker Engine on the VPS |
| DNS / TLS / reverse proxy | User infrastructure outside HotDeploy v1 |

Representative endpoints (experimental API):

- `GET /api/vps/v1/virtual-machines/{vmId}/docker` — list Docker Projects
- `POST /api/vps/v1/virtual-machines/{vmId}/docker` — create/replace Deployment
- `POST .../docker/{projectName}/start|stop|restart|update` — Lifecycle Actions

Full reference: `.agents/skills/hostinger-api/SKILL.md`.

## Security rules

1. API keys never appear in React state persistence, logs, or git.
2. Only Rust Tauri commands access Credential Vault and outbound HTTPS.
3. Error messages returned to UI must not echo secrets or full API responses containing tokens.
4. `.env` files with real keys are never committed.

## Provider roadmap

| Phase | Provider support |
|---|---|
| 1–5 | Hostinger only (production path) |
| 6.A | Hostinger + DigitalOcean droplet listing via `VpsProvider` adapter |
| 6.B+ | Additional VPS providers behind the same adapter |

When adding a provider, update this file and add an ADR under `docs/adr/`.

## Out of scope for v1

- Multi-user accounts or cloud sync
- Hosted HotDeploy backend
- Direct SSH / docker CLI on the VPS
- Non-Docker workloads
- Production code signing / auto-update (documented in RUNBOOK; updater scaffolded, signing certs user-provided)

## Ubiquitous language checklist for agents

Before changing domain behavior, verify:

- UI strings use **Docker Project**, not "stack" or "service group".
- Settings refer to **Connection Profile**, not "login".
- Docs distinguish **Deployment** (create/replace) from **Lifecycle Action** (operate existing).
- Provider expansion mentions **Provider adapter**, not one-off Hostinger branches in React.
