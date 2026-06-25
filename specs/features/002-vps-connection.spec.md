# Spec 002 — VPS Connection

## Metadata

| Field | Value |
|---|---|
| **ID** | 002 |
| **Phase** | 1.A |
| **Status** | shipped |
| **Spec path** | `specs/features/002-vps-connection.spec.md` |

## Summary

Connect HotDeploy to Hostinger by saving an API key in the **Credential Vault**, picking a VPS from the live API list, and validating connectivity to the Docker Manager.

## User journey

> As a **developer**, I want to **save my Hostinger API key and select my VPS** so that **HotDeploy can reach my Docker Projects**.

1. Open **Settings**.
2. Paste Hostinger API key and click **Save**.
3. App loads VPS list from Hostinger API.
4. Select default VPS from dropdown.
5. Click **Test connection** — badge shows Connected or error message.
6. Restart app — credentials and selected VPS persist in keychain.

## UI

| Surface | Change |
|---|---|
| Settings — API credentials | Replace read-only badge with `CredentialsCard`: password input, Save/Clear, VPS select, Test connection, status badge |
| Settings — Connection Profiles | Unchanged (manual profiles remain for workspace targets) |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `get_credentials_status` | — | `CredentialsStatus` | Existing |
| `save_credentials` | `apiKey`, `virtualMachineId` | — | Existing |
| `clear_credentials` | — | — | Existing |
| `list_vms` | — | `VirtualMachine[]` | Implement real API call |
| `test_connection` | `virtualMachineId` | `ConnectionTestResult` | New — probes Docker Manager |

## Hostinger API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/vps/v1/virtual-machines` | List VPS instances (paginated) |
| GET | `/api/vps/v1/virtual-machines/{vmId}/docker` | Connectivity test |

## Tests

- [x] Harness: `listVirtualMachines` fake client + schema validation
- [x] Harness: `testConnection` fake client
- [x] Rust: JSON deserialization for VM list
- [x] React: `CredentialsCard` renders save/test states

## Out of scope

- Auto-sync connection profiles from VPS list (Phase 5)
- Multiple API keys per profile
- OAuth

## Acceptance criteria

- [x] User can save and clear API key via Settings UI
- [x] VPS dropdown populated from `list_vms`
- [x] Test connection succeeds against Docker Manager on selected VPS
- [x] API key never written to `workspace.json` or logs
- [x] `pnpm quality` green

## Dependencies

- Spec 001 — workspace configuration
