---
name: tdd-workflow
description: RED → GREEN → REFACTOR test-driven workflow for HotDeploy slices. Use before implementing any feature, bug fix, or refactor in this repo.
---

# TDD Workflow — HotDeploy

## Loop

1. **RED** — write a failing test that expresses the spec acceptance criterion
2. **GREEN** — minimum code to pass; no extra features
3. **REFACTOR** — optional; keep tests green

## By layer

| Layer | Tool | Location |
|---|---|---|
| TS utils / hooks | Vitest | `src/**/*.test.ts` |
| API contracts | Vitest + `@hotdeploy/api-harness` | `packages/api-harness/` |
| React components | Testing Library + Vitest | colocated `*.test.tsx` |
| Rust | `cargo test` | `src-tauri/src/**` |

## RED rules

- Failure must be for the **right reason** (missing behavior), not a typo in the test
- For Hostinger, use `FakeHostingerClient` — never hit production API in unit tests
- Add user journey comment at top of significant tests:

```ts
// As a developer, I want to see credential status so that I know if setup is required.
```

## Commits (optional per stage)

```bash
git commit -m "test(settings): add credential status query — RED"
git commit -m "feat(settings): wire get_credentials_status — GREEN"
git commit -m "refactor(tauri): extract keychain helper"
```

## Before PR

```bash
pnpm quality
```

All tests green. Coverage must not regress below `baseline.json`.
