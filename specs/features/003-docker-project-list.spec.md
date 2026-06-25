# Spec 003 — Docker Project List

## Metadata

| Field | Value |
|---|---|
| **ID** | 003 |
| **Phase** | 2.A |
| **Status** | approved |
| **Spec path** | `specs/features/003-docker-project-list.spec.md` |

## Summary

List remote Docker Projects from the connected VPS on the Deployment Panel with live state and container counts.

## User journey

> As a **developer**, I want to **see Docker Projects running on my VPS** so that **I know what is deployed without opening hPanel**.

1. Configure API credentials and a connection profile.
2. Open **Projects**.
3. App loads projects from Hostinger API for the active VPS profile.
4. Each card shows name, state, container count, and link to detail.

## UI

| Surface | Change |
|---|---|
| Projects | Remote project cards, loading/error states, refresh button |
| Projects | Badge "Configured locally" when workspace has matching deploy config |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `list_projects` | `virtualMachineId` | `DockerProject[]` | Implemented |

## Hostinger API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/vps/v1/virtual-machines/{vmId}/docker` | List Docker Projects |

## Acceptance criteria

- [ ] Projects page shows remote Docker Projects when credentials configured
- [ ] Loading and error states handled
- [ ] `pnpm quality` green

## Dependencies

- Spec 002 — VPS connection
