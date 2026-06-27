# Spec 014 — Monitoring (Manual Refresh)

## Metadata

| Field | Value |
|---|---|
| **ID** | 014 |
| **Phase** | 5.C |
| **Status** | shipped |
| **Spec path** | `specs/features/014-monitoring-manual-refresh.spec.md` |

## Summary

Expose container resource stats and VPS usage charts using Hostinger API data fetched **only** when the user clicks Refresh — no background polling or webhooks.

## User journey

> As a **developer**, I want to **refresh container stats and VPS usage on demand** so that **I can inspect health without constant API traffic**.

1. Open **Projects** — project list loads once (existing behavior); click **Refresh** to reload projects.
2. Click **Load VPS metrics** (or **Refresh** on the metrics card) to fetch the last **1 hour** of CPU and RAM for the active VPS.
3. Open a **Docker Project** detail — containers load once on open; click **Refresh** to reload status, health, and per-container CPU/RAM stats.

## UI

| Surface | Change |
|---|---|
| Projects — VPS metrics card | CPU/RAM sparklines for last 1h; manual load/refresh only |
| Projects — project list | Keep existing Refresh button (no auto-poll) |
| Project detail — containers | Add CPU/RAM columns; Refresh button on card |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `get_vps_metrics` | `virtualMachineId`, `dateFrom`, `dateTo`, `provider?` | `VpsMetrics` | Hostinger only; 1h window from UI |
| `get_project_containers` | (existing) | `Container[]` with optional `stats` | Maps Hostinger stats |

## Hostinger API

| Method | Path | Purpose |
|---|---|---|
| GET | `.../docker/{project}/containers` | Container health + `stats` |
| GET | `.../virtual-machines/{vmId}/metrics` | Historical VPS CPU/RAM (query: `date_from`, `date_to`) |

## Tests

- [x] Rust: deserialize container `stats` and metrics collection
- [x] Harness: `containerStats` + `vpsMetrics` schemas
- [x] TS: metrics point normalization helper

## Out of scope

- Webhooks or Server-Sent Events from Hostinger
- Automatic `refetchInterval` / window-focus refresh for metrics
- Per-container historical charts
- DigitalOcean metrics

## Acceptance criteria

- [x] No new automatic polling for metrics (deploy wait loop unchanged)
- [x] VPS metrics card fetches only on user action; window = last 1 hour
- [x] Container table shows CPU % and memory % when stats present
- [x] `pnpm quality` green

## Dependencies

- Spec 004 — project detail
- Spec 011 — provider adapter
