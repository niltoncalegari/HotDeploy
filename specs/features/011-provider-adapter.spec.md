# Spec 011 — Provider Adapter (Phase 6.A)

## Metadata

| Field | Value |
|---|---|
| **ID** | 011 |
| **Phase** | 6.A |
| **Status** | approved |
| **Spec path** | `specs/features/011-provider-adapter.spec.md` |

## Summary

Introduce a Rust `VpsProvider` trait, route Tauri commands through a provider registry, and add DigitalOcean as a second provider with VPS listing. Docker Compose operations remain Hostinger-only until a provider exposes an equivalent API.

## User journey

> As a **DevOps lead**, I want to **register VPS targets from multiple cloud providers** so that **HotDeploy can grow beyond Hostinger without rewriting the UI**.

1. Open **Settings** → **Connection profiles**.
2. Choose provider **Hostinger** or **DigitalOcean**.
3. For Hostinger, existing API key + Docker flows work unchanged.
4. For DigitalOcean, save a DO API token and list droplets as VPS rows (Docker Project ops show a clear unsupported message).

## UI

| Surface | Change |
|---|---|
| Connection profiles | Provider select (`hostinger` \| `digitalocean`) when adding a profile |
| Credentials | Hostinger card unchanged; DigitalOcean token field (keychain) |
| Projects | Uses active profile provider when calling list commands |

## Tauri commands

| Command | Input | Output | Notes |
|---|---|---|---|
| `save_provider_credentials` | `provider`, `apiKey` | — | Keychain per provider |
| `get_provider_credentials_status` | `provider` | `CredentialsStatus` | No secret echo |
| `list_vms` | `provider` | `VirtualMachine[]` | Routes via registry |
| Existing docker commands | profile provider | — | Error if unsupported |

## Patterns

- **Adapter** — `VpsProvider` trait in `src-tauri/src/provider/`
- **Registry** — resolve provider id → implementation

## Tests

- [ ] Rust: `HostingerProvider` delegates to existing client
- [ ] Rust: `DigitalOceanProvider` maps droplets to `VirtualMachine`
- [ ] Rust: unsupported docker op returns structured error
- [ ] TS: provider id schema accepts `digitalocean`

## Out of scope

- Full DigitalOcean Docker Compose API (no equivalent to Hostinger Docker Manager in v6.A)
- Hetzner, raw SSH, multi-key UI polish
- Provider-specific React API clients

## Acceptance criteria

- [ ] `VpsProvider` trait with list/test/docker methods
- [ ] Hostinger remains fully functional through adapter
- [ ] DigitalOcean lists droplets via API token in keychain
- [ ] Connection profile stores provider id
- [ ] `pnpm quality` green

## Dependencies

- Specs 002–010 shipped
