# Quality Gate

HotDeploy uses a **ratchet** quality gate via `pnpm quality` (runs `scripts/quality-gate.sh`).

## What runs

| Step | Command |
|---|---|
| Lint | `pnpm lint` |
| Types | `pnpm typecheck` |
| Tests + coverage | `pnpm test:coverage` |
| Rust (if cargo installed) | `cargo fmt --check`, `cargo clippy`, `cargo test` |
| Baseline compare | `scripts/compare-baseline.mjs` |

## Metrics (`baseline.json`)

| Metric | Rule |
|---|---|
| `lineCoverage` | Must not decrease vs baseline; auto-bumps when higher |
| `lintErrors` | Reserved for future ESLint error ratchet |
| `testsPassed` | Reserved for future aggregate check |

## Rules for agents

- Run `pnpm quality` before every PR — no exceptions
- **Never** edit `baseline.json` downward to pass the gate
- Legitimate coverage increase updates baseline automatically via compare script
- If CI fails but local passes, check Node/pnpm versions match CI (Node 20)

## CI

GitHub Actions workflow `.github/workflows/ci.yml` runs the same checks on every PR to `main`.

## Future enhancements

- Tauri build matrix on release tags
- `cargo audit` for Rust advisories
- Bundle size budget for desktop artifacts
