---
name: pr-automation
description: Open GitHub pull requests for HotDeploy feature slices. Use when the user or task asks to commit, push, or create a PR for this repo.
---

# PR Automation — HotDeploy

Full guide: [docs/PR-WORKFLOW.md](../../docs/PR-WORKFLOW.md)

## Pre-flight

- [ ] Spec exists: `specs/features/NNN-*.spec.md`
- [ ] `pnpm quality` green
- [ ] No secrets in `git diff`
- [ ] `CONTEXT.md` updated if domain terms changed

## Branch

```bash
git checkout main && git pull
git checkout -b feat/slice-1a-vps-connection
```

## Commits

Conventional Commits, English, imperative:

- `feat(settings): add Hostinger API key form`
- `test(api-harness): validate deploy response schema`

## PR title

Format: `type(scope): summary` — ≤72 chars, no trailing period.

Examples:

- `feat(onboarding): connect Hostinger API key`
- `chore: scaffold HotDeploy desktop foundation`

## PR body

Use template at `.github/pull_request_template.md`. Required:

- Summary bullets
- `Spec: specs/features/001-vps-connection.spec.md`
- `Closes #N` or `Refs #N`
- Test plan (manual + automated)
- Quality gate checkboxes

## Open PR

```bash
git push -u origin HEAD
gh pr create --base main \
  --title "feat(onboarding): connect Hostinger API key" \
  --body-file /tmp/hotdeploy-pr-body.md
```

Write body to temp file with heredoc for formatting.

## Merge policy

- **Squash merge** default for single-commit or small slices
- **Rebase merge** when preserving RED/GREEN/REFACTOR commit history
- Delete branch after merge

## Agent footer

When agent-authored, append to PR body:

```
Generated with [Cursor](https://cursor.com)
```
