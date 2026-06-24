# Spec-Driven Development (SDD)

HotDeploy uses **spec files** as the source of truth for feature behavior. Code implements specs; specs are not afterthoughts.

## Workflow

1. **Author spec** — copy [templates/feature.spec.md](templates/feature.spec.md) to `features/NNN-name.spec.md`.
2. **Review scope** — acceptance criteria must be testable; "Out of scope" must list deferrals.
3. **Link in Issue** — GitHub Issue references spec path (Phase 1+).
4. **Implement** — branch name matches slice; TDD per CONTRIBUTING.md.
5. **Verify** — every acceptance checkbox satisfied or spec updated with rationale.
6. **PR** — description includes `Spec: specs/features/NNN-name.spec.md`.

## Spec file rules

- English only
- Include user journey in "As a … I want … so that …" form
- List Tauri commands and Hostinger endpoints when applicable
- Acceptance criteria as checkboxes
- Update spec in the same PR when scope shifts — never silent drift

## Numbering

| Range | Purpose |
|---|---|
| `000-*` | Meta / scaffold |
| `001–099` | Phase 1–2 features |
| `100+` | Reserved for larger epics if needed |

## Templates

- [feature.spec.md](templates/feature.spec.md) — standard feature slice

## Agents

Before writing code, agents must read the spec listed in the Issue or task. If no spec exists, create one and get approval before RED phase.
