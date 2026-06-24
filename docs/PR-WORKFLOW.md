# Pull Request Workflow

> Primary reference for humans and AI agents opening PRs on HotDeploy.

## Overview

Every feature ships as a **vertical slice** in one PR, driven by a spec file and (from Phase 1) a GitHub Issue.

```
spec → issue → branch → TDD → pnpm quality → push → gh pr create → review → merge
```

## Pre-PR checklist

- [ ] Spec file exists at `specs/features/NNN-name.spec.md`
- [ ] Acceptance criteria in spec are met or spec updated with rationale
- [ ] `pnpm quality` passes locally
- [ ] `git diff` contains no API keys, `.env`, or credentials
- [ ] `CONTEXT.md` updated if ubiquitous language changed
- [ ] `PLAN.md` updated if phase/slice status changed

## Branch naming

```bash
git checkout main && git pull
git checkout -b feat/slice-1a-vps-connection
```

| Prefix | Use |
|---|---|
| `feat/slice-Nx-name` | User-visible slice |
| `fix/name` | Bug fix |
| `chore/name` | Tooling, CI, deps |
| `docs/name` | Documentation only |

Rules: lowercase, hyphens, ≤50 characters, no spaces.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/) in English.

```
<type>(<scope>): <imperative summary>
```

| Type | When |
|---|---|
| `feat` | New user-visible behavior |
| `fix` | Bug fix |
| `test` | Tests only (RED checkpoint) |
| `refactor` | No behavior change |
| `chore` | Tooling, deps |
| `docs` | Documentation |

**Scopes:** `projects`, `settings`, `tauri`, `hostinger`, `api-harness`, `ci`, `deps`

Examples:

- `feat(settings): add API key persistence via keychain`
- `test(api-harness): add list projects contract test`
- `chore(ci): add Rust clippy job`

## PR title conventions

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat(scope): imperative summary` | `feat(projects): list Docker projects from VPS` |
| Fix | `fix(scope): what broke` | `fix(credentials): handle missing keychain entry` |
| Chore | `chore(scope): what changed` | `chore: scaffold HotDeploy desktop foundation` |
| Docs | `docs: what changed` | `docs: add PR workflow guide` |

**Rules:**

- English only
- ≤72 characters
- Lowercase scope
- Imperative mood ("add", not "added")
- No trailing period
- Match the squash merge commit you want on `main`

## PR description structure

Use [.github/pull_request_template.md](../.github/pull_request_template.md).

### Required sections

1. **Summary** — 1–3 bullets, plain English, what changed and why
2. **Spec** — `Spec: specs/features/001-vps-connection.spec.md`
3. **Closes / refs** — `Closes #12` auto-closes issue on merge; use `Refs #12` for partial work
4. **Test plan** — manual steps for desktop + list of automated tests
5. **Quality gate** — confirm `pnpm quality` green

### Optional sections

- **Screenshots/GIFs** — required for UI-visible changes
- **Patterns applied** — e.g. Adapter, Facade (when relevant)
- **Out of scope** — deferred items with follow-up spec paths
- **Notes for reviewers** — non-obvious tradeoffs

### Agent-authored PRs

Append footer:

```markdown
---
Generated with [Cursor](https://cursor.com)
```

## Opening a PR with GitHub CLI

### 1. Write the body to a file

```bash
cat > /tmp/hotdeploy-pr-body.md <<'EOF'
## Summary

- Add API key form in Settings with keychain persistence
- Show connected/disconnected badge from `get_credentials_status`

## Spec

`specs/features/001-vps-connection.spec.md`

## Closes / refs

Closes #12

## Test plan

Manual:

- [ ] Run `pnpm tauri:dev`, open Settings, save API key, restart app, badge shows Configured

Automated:

- `src/features/settings/SettingsPage.test.tsx` — credential badge states
- `packages/api-harness` — unchanged

## Quality gate

- [x] `pnpm quality` green locally
- [x] `baseline.json` not regressed

---
Generated with [Cursor](https://cursor.com)
EOF
```

### 2. Push and create PR

```bash
git push -u origin HEAD
gh pr create \
  --base main \
  --title "feat(settings): add Hostinger API key form" \
  --body-file /tmp/hotdeploy-pr-body.md
```

### 3. Verify

```bash
gh pr view --web
gh pr checks
```

## PR size guidelines

| Lines changed | Action |
|---|---|
| ≤200 | Ideal — fast review |
| 200–500 | OK — ensure clear test plan |
| 500–1000 | Add justification in PR body |
| >1000 | Split into multiple slices |

Rust + TS LOC both count. Generated lockfiles excluded from mental budget but avoid drive-by refactors.

## Review and merge

1. Wait for CI green (`.github/workflows/ci.yml`)
2. Self-review or peer review the diff
3. **Squash merge** — default for single-commit slices
4. **Rebase merge** — when preserving TDD checkpoint commits
5. Confirm linked Issue closed
6. Delete remote branch

## Issue templates

When starting a slice (Phase 1+):

```bash
gh issue create --template feature.yml
```

Link the spec path in the issue body. Label: `slice:vertical`, `phase:N`.

## Common mistakes

| Mistake | Fix |
|---|---|
| PR without spec | Create spec first, even if brief |
| API key in diff | Rotate key; use keychain only |
| Title past tense | Use imperative: "add", not "added" |
| Skipping quality | Run `pnpm quality` locally |
| Hostinger calls in React | Move to `src-tauri/` |
| Editing baseline to pass | Fix tests/coverage legitimately |

## Related docs

- [CONTRIBUTING.md](../CONTRIBUTING.md) — slice lifecycle
- [.agents/skills/pr-automation/SKILL.md](../.agents/skills/pr-automation/SKILL.md) — agent checklist
- [docs/QUALITY.md](QUALITY.md) — gate metrics
