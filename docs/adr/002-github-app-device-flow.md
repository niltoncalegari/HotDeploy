# ADR 002 — GitHub App Device Flow (Phase 8)

## Status

Accepted

## Context

Phase 7 stores a GitHub Personal Access Token (PAT) in the Credential Vault. PATs are user-managed, expire, and require manual scope selection. Phase 8 adds GitHub App device flow as the preferred authentication method for desktop users.

## Decision

1. Register a **HotDeploy GitHub App** with device flow enabled.
2. Store `client_id` as a public constant in Rust (`github/app.rs`); no `client_secret` in the desktop bundle.
3. Device flow tokens are stored in the same vault slot as PAT (`githubPat`); add `githubAuthMethod: "pat" | "app"` to distinguish sources.
4. PAT manual entry remains as fallback until users migrate.

## Consequences

- New module `github/oauth.rs` with `start_device_flow` and `poll_device_token`.
- UI shows `user_code` and `verification_uri` during authorization.
- RUNBOOK documents GitHub App registration steps.

## Alternatives considered

| Alternative | Rejected because |
|---|---|
| OAuth web flow | Desktop app lacks reliable redirect URI in all platforms |
| PAT only | User chose device flow for better UX |
| Server-side token exchange | Requires hosted backend (out of scope) |
