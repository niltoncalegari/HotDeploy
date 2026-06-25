# Spec 005 — Local Deploy

## Metadata

| Field | Value |
|---|---|
| **ID** | 005 |
| **Phase** | 3.A |
| **Status** | shipped |
| **Spec path** | `specs/features/005-local-deploy.spec.md` |

## Summary

Deploy a Docker Project from a local `docker-compose.yaml` file via file picker and workspace deploy config.

## User journey

> As a **developer**, I want to **deploy my local Compose file to the VPS** so that **I can ship changes from my machine**.

1. Register deploy project with local compose path (file picker).
2. Click **Deploy** on Projects page.
3. Confirm deployment dialog.
4. Project is created/replaced on VPS via API.

## Tauri commands

| Command | Input | Output |
|---|---|---|
| `deploy_project` | `deployProjectId` | `ActionResult` |

## Hostinger API

| Method | Path |
|---|---|
| POST | `.../docker` |

## Acceptance criteria

- [x] File picker selects compose file path
- [x] Deploy button triggers `deploy_project`
- [x] API key and compose secrets never logged
- [x] `pnpm quality` green

## Dependencies

- Spec 004
