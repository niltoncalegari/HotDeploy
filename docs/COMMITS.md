# Commit and Version Guidelines

> **Agent rule:** mandatory for all agents — referenced from [CONTEXT.md](../CONTEXT.md) and [AGENTS.md](../AGENTS.md).

How to split work into commits, bump semver, and push to `main`.

## Principles

1. **One context per commit** — each commit should be reviewable on its own and revertible without unrelated fallout.
2. **Conventional Commits** in English — see [CONVENTIONS.md](CONVENTIONS.md).
3. **Version follows behavior** — bump `package.json` when user-visible behavior ships; run `pnpm version:sync` (or `pnpm version:bump`, which syncs automatically).
4. **Changelog stays current** — update `src/lib/changelog.ts` in the same commit as a version bump.

## Split commits by context

| Commit group | Examples | Version bump? |
|---|---|---|
| `docs(...)` | COMMITS.md, ADR, spec-only | No |
| `feat(github)` | GitHub App registration, device flow | `patch` |
| `feat(onboarding)` | Wizard step, skip checkbox | `patch` |
| `feat(ui)` | Sidebar, dialogs, empty states | `patch` |
| `fix(...)` | Bug fix within current phase | `patch` |
| `feat(tauri)` | New Tauri command backing a shipped slice | `patch` (with matching frontend commit or same commit if tightly coupled) |
| `chore(release)` | Version sync only when no feature code | `patch` / `phase` |
| `test(...)` | Tests only (RED checkpoint) | No |
| `refactor(...)` | No behavior change | No |

**Do not mix** unrelated areas in one commit (e.g. GitHub backend + onboarding UI).

### Good split (this repo)

```
docs(commits): add commit splitting and version bump guidelines
feat(github): add GitHub App self-registration and gh-cli fallback
feat(onboarding): add skip-setup checkbox on welcome step
feat(ui): add release notes dialog and clean up version label
```

### Bad split

```
feat: github app and onboarding and sidebar   # too broad
fix: misc                                     # not revertible
```

## Semver policy (pre-1.0)

Source of truth: root `package.json`. Synced to `src-tauri/Cargo.toml`, `tauri.conf.json`, and `packages/api-harness/package.json`.

| Bump | When | Command | Example |
|---|---|---|---|
| **Patch** | Slice, feature, or fix within the current roadmap phase | `pnpm version:bump patch` | `0.8.0` → `0.8.1` |
| **Minor** | Next roadmap phase (pre-1.0: minor = phase number) | `pnpm version:bump minor` or `pnpm version:bump phase N` | Phase 9 → `0.9.0` |
| **Major** | Reserved for `1.0.0` GA | Manual / release process | `0.x.x` → `1.0.0` |

### How to choose patch vs phase

| Change | Bump |
|---|---|
| New button, command, or wizard step in current phase | **patch** |
| Bug fix, UX polish, test coverage for shipped behavior | **patch** |
| Completing a new roadmap **phase** (see [PLAN.md](../PLAN.md)) | **phase N** → `0.N.0` |
| Breaking IPC or workspace schema (rare pre-1.0) | **patch** + migration note; consider phase bump if it marks a new phase |

There is no separate “medium” level — use **patch** for incremental slices and **phase** (minor) for a new roadmap phase.

## Commit workflow

```bash
# 1. Stage only files for this context
git add <paths>

# 2. Commit
git commit -m "feat(github): add GitHub App self-registration"

# 3. If user-visible: bump version and changelog
pnpm version:bump patch
# edit src/lib/changelog.ts — add features/fixes for the new version
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json \
  packages/api-harness/package.json src/lib/changelog.ts
git commit -m "chore(release): bump version to 0.8.1"

# 4. Before push
pnpm quality
```

You may combine the feature commit and version bump in **one commit** when the slice is small (preferred for this repo):

```bash
pnpm version:bump patch
git add ...
git commit -m "feat(onboarding): add skip-setup checkbox on welcome step"
```

## Push to main

- Ensure `pnpm quality` passes.
- `git push origin main` only after commits are split and versions/changelog are updated.
- Never force-push `main`.
- Do not commit `.env`, API keys, or `baseline.json` edits to pass the gate.

## Changelog (`src/lib/changelog.ts`)

Each version entry lists:

- `version` — semver string (must match `package.json` after bump)
- `features` — user-visible additions
- `fixes` — bug fixes (optional)

Update this file whenever the sidebar version label changes.

## Related docs

- [CONTEXT.md](../CONTEXT.md) — domain language and agent workflow rules (mandates this file)
- [CONVENTIONS.md](CONVENTIONS.md) — code style and commit types
- [PR-WORKFLOW.md](PR-WORKFLOW.md) — branch and PR checklist
- [PLAN.md](../PLAN.md) — phase → minor version mapping
