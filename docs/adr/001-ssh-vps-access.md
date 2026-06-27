# ADR 001 — SSH VPS Access (Phase 7)

## Status

Accepted

## Context

HotDeploy v1–6 orchestrates Docker Compose deployments exclusively through the Hostinger VPS Docker Manager REST API. Phase 7 adds GitHub CI/CD features that require installing and managing GitHub Actions self-hosted runners on the user's VPS. The Hostinger API does not expose arbitrary shell execution.

## Decision

Introduce an **optional SSH layer** in Rust (`src-tauri/src/ssh/`) that complements — but does not replace — the Hostinger API:

1. SSH private keys and usernames are stored in the **Credential Vault** (`credentials.json`, mode 0600), never in `workspace.json` or React persistence.
2. SSH is used only for **whitelisted operations** in Phase 7: connectivity test, runner install/configure, runner status probe.
3. Docker Project lifecycle (deploy, start, stop, logs) remains on the Hostinger API path.
4. VPS hostname from the Provider API is the default SSH target; users may override host in workspace SSH settings.

## Consequences

- `CONTEXT.md` updated: VPS reachable via Provider API **and** optional SSH in Phase 7+.
- New dependency: `ssh2` (vendored OpenSSL) for cross-platform SSH sessions.
- Security: runner install runs as a dedicated user when possible; blast-radius documented in spec 020.
- Future providers must expose a resolvable host for SSH or document manual host override.

## Alternatives considered

| Alternative | Rejected because |
|---|---|
| Runner as Docker Project via Hostinger API | Limited control over systemd service; registration token handling awkward |
| GitHub-hosted runners only | User explicitly chose self-hosted on VPS |
| Full SSH shell access in UI | Out of scope; whitelist only |
