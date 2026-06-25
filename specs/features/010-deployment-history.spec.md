# Spec 010 — Deployment History

## Metadata

| Field | Value |
|---|---|
| **ID** | 010 |
| **Phase** | 5.B |
| **Status** | approved |
| **Spec path** | `specs/features/010-deployment-history.spec.md` |

## Summary

Persist local deployment and lifecycle history without secrets.

## Tauri commands

| Command | Output |
|---|---|
| `get_deployment_history` | `DeploymentRecord[]` |
| `clear_deployment_history_command` | — |

## Acceptance criteria

- [ ] History recorded on deploy and lifecycle actions
- [ ] HistoryCard in Settings
- [ ] No API keys or env vars in history
- [ ] `pnpm quality` green

## Dependencies

- Spec 005
