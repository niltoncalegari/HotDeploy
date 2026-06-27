# Contributing to HotDeploy

> Canonical process for humans and AI agents. Read [AGENTS.md](AGENTS.md) first.

## Table of contents

1. [What is a slice](#1-what-is-a-slice)
2. [Spec-driven workflow](#2-spec-driven-workflow)
3. [Slice lifecycle](#3-slice-lifecycle)
4. [Naming conventions](#4-naming-conventions)
5. [TDD discipline](#5-tdd-discipline)
6. [Pull requests](#6-pull-requests)
7. [Quality gate](#7-quality-gate)
8. [Agent quick reference](#8-agent-quick-reference)

---

## 1. What is a slice

A **slice** is a thin vertical deliverable that ships in **one PR** and is demoable end-to-end in the desktop app.

| Slice | Not a slice |
|---|---|
| "User can save API key and see Connected badge" | "Implement credentials module" |
| "User sees Docker Project list from VPS" | "Add Hostinger client" |

**Rule:** if it cannot be demoed in 60 seconds, split it.

---

## 2. Spec-driven workflow

1. Create or update `specs/features/NNN-short-name.spec.md` from [specs/templates/feature.spec.md](specs/templates/feature.spec.md).
2. Open a GitHub Issue linking the spec (optional for Phase 0 chore; required from Phase 1).
3. Implement only what the spec acceptance criteria describe.
4. Update the spec in the same PR if behavior changes.

**No spec → no PR** (except one-line typos and CI hotfixes).

---

## 3. Slice lifecycle

```
idea → spec → issue → branch → RED test → GREEN code → refactor → version bump → quality → PR → merge
```

---

## 4. Naming conventions

### Branches

| Prefix | Example |
|---|---|
| `feat/slice-Nx-name` | `feat/slice-1a-vps-connection` |
| `fix/name` | `fix/keychain-linux-read` |
| `chore/name` | `chore/ci-rust-matrix` |
| `docs/name` | `docs/pr-workflow` |

Lowercase, hyphen-separated, ≤50 characters.

### Commits

Conventional Commits in English:

- `feat(settings): add API key form`
- `test(api-harness): contract for deploy response`
- `fix(tauri): map keychain errors to JSON`

### Spec files

`specs/features/NNN-kebab-name.spec.md` — three-digit sequence, kebab-case.

---

## 5. TDD discipline

Follow [.agents/skills/tdd-workflow/SKILL.md](.agents/skills/tdd-workflow/SKILL.md):

1. **RED** — failing test or typed stub that proves missing behavior
2. **GREEN** — minimum code to pass
3. **REFACTOR** — optional smell sweep with tests green

Each stage may be its own commit on the feature branch.

For UI slices, include at least one component or integration test; manual test plan required in PR.

---

## 6. Pull requests

Full agent automation guide: [docs/PR-WORKFLOW.md](docs/PR-WORKFLOW.md).

Summary:

- Title: Conventional Commits format, ≤72 chars
- Body: use [.github/pull_request_template.md](.github/pull_request_template.md)
- Link spec: `Spec: specs/features/001-vps-connection.spec.md`
- `Closes #N` when an issue exists
- Run `pnpm quality` before push
- Bump version: `pnpm version:bump patch` per slice PR; `pnpm version:bump phase N` when a new phase ships (see [docs/RUNBOOK.md](docs/RUNBOOK.md#versioning))

### PR size

| LOC | Guidance |
|---|---|
| ≤200 | Ideal |
| 200–500 | Acceptable with clear description |
| >500 | Justify or split |
| >1000 | Must split |

---

## 7. Quality gate

```bash
pnpm quality
```

Mandatory before every PR. See [docs/QUALITY.md](docs/QUALITY.md). Never edit `baseline.json` to cheat the ratchet.

---

## 8. Agent quick reference

1. Read `AGENTS.md`, `CONTEXT.md`, this file.
2. Read the feature spec.
3. Write failing test (RED).
4. Implement (GREEN).
5. Bump version (`pnpm version:bump patch` or `phase N`).
6. `pnpm quality`
7. Open PR per `docs/PR-WORKFLOW.md`
8. Update `PLAN.md` slice status if phase changed.

Skills: `.agents/skills/tdd-workflow`, `hostinger-api`, `pr-automation`.
