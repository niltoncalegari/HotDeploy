# ADR 003 — Branch/Tag Deploy Pinning Blocked (Phase 8)

## Status

Accepted (blocked)

## Context

Users want to deploy a specific Git branch or tag to a Docker Project. HotDeploy Phase 3.B supports GitHub repository URLs but does not expose branch selection. Phase 8.D investigates whether the Hostinger VPS Docker Manager API supports branch/ref parameters.

## Decision

**Defer implementation** until Hostinger API documents branch/ref support for Docker Project creation.

1. Spec 029 delivers a **disabled UI placeholder** and documents the API gap.
2. No fake branch picker that silently deploys `main`.
3. Revisit when Hostinger SDK or API docs expose `ref`, `branch`, or `commit` on deploy endpoints.

## Consequences

- Deploy dialog shows "Branch pinning — coming when provider API supports it".
- No new Tauri commands for branch deploy in Phase 8.

## Research notes

Hostinger `POST /api/vps/v1/virtual-machines/{vmId}/docker` accepts repository URL; branch pinning is not documented in the public Python SDK as of Phase 8 planning.
