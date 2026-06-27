---
name: hostinger-api
description: Hostinger VPS Docker Manager API reference for HotDeploy. Use when implementing Tauri commands, api-harness schemas, or specs that touch Hostinger integration.
---

# Hostinger API — HotDeploy Reference

**Base URL:** `https://developers.hostinger.com`  
**Auth:** `Authorization: Bearer <api_key>`  
**Stability:** experimental (per Hostinger docs)

## Virtual Machine endpoints

| Operation | Method | Path |
|---|---|---|
| List VMs | GET | `/api/vps/v1/virtual-machines` |
| Get VM | GET | `/api/vps/v1/virtual-machines/{vmId}` |
| VPS metrics | GET | `/api/vps/v1/virtual-machines/{vmId}/metrics` |

## Docker Manager endpoints

| Operation | Method | Path |
|---|---|---|
| List projects | GET | `/api/vps/v1/virtual-machines/{vmId}/docker` |
| Create/replace project | POST | `/api/vps/v1/virtual-machines/{vmId}/docker` |
| Get project | GET | `/api/vps/v1/virtual-machines/{vmId}/docker/{projectName}` |
| Get containers | GET | `/api/vps/v1/virtual-machines/{vmId}/docker/{projectName}/containers` |
| Get logs | GET | `/api/vps/v1/virtual-machines/{vmId}/docker/{projectName}/logs` |
| Start | POST | `.../docker/{projectName}/start` |
| Stop | POST | `.../docker/{projectName}/stop` |
| Restart | POST | `.../docker/{projectName}/restart` |
| Update | POST | `.../docker/{projectName}/update` |
| Delete | DELETE | `.../docker/{projectName}/down` |

## Create project body

```json
{
  "project_name": "my-app",
  "content": "<docker-compose.yaml contents>",
  "environment": "NODE_ENV=production\nPORT=3000"
}
```

`content` may be raw YAML or a GitHub URL (`https://github.com/user/repo`) resolved by Hostinger to `docker-compose.yaml` on default branch.

## Implementation rules

1. All calls from `src-tauri/src/hostinger/client.rs` — not React
2. Map API errors to `HostingerError::Api { status, message }`
3. Mirror response shapes in `packages/api-harness/src/schemas/hostinger.ts`
4. Update `FakeHostingerClient` when adding endpoints

## References

- [VPSDockerManagerApi.md](https://github.com/hostinger/api-python-sdk/blob/main/docs/VPSDockerManagerApi.md)
- [VPSVirtualMachineApi.md](https://github.com/hostinger/api-python-sdk/blob/main/docs/VPSVirtualMachineApi.md)
- [deploy-on-vps Action](https://github.com/hostinger/deploy-on-vps)

## Provider expansion

v1 is Hostinger only. For Phase 6, add `VpsProvider` trait — do not fork React per provider.
