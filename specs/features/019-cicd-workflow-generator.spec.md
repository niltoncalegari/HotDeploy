# Spec 019 — CI/CD Workflow Generator

## Metadata

| Field | Value |
|---|---|
| **ID** | 019 |
| **Phase** | 7.E |
| **Status** | shipped |
| **Spec path** | `specs/features/019-cicd-workflow-generator.spec.md` |

## Summary

Generate a GitHub Actions workflow YAML for deploy-on-VPS (self-hosted or Hostinger API) and commit via Contents API or download locally.

## User journey

> As a **developer**, I want to **generate CI/CD with one wizard** so that **pushes deploy my Docker Project automatically**.

1. From linked project → Generate CI/CD.
2. Pick trigger, runner type, optional test step.
3. Preview YAML → Commit to `.github/workflows/hotdeploy.yml` or download.

## Tauri commands

| Command | Input | Output |
|---|---|---|
| `generate_workflow_yaml` | `WorkflowOptions` | `string` |
| `commit_workflow_file` | `owner, repo, content, message` | `{ sha: string }` |

## Tests

- [x] Snapshot: generated YAML for self-hosted + API deploy modes
- [x] Unit: Contents API payload shape

## Out of scope

- Custom workflow editor
- Multiple workflow files per repo

## Acceptance criteria

- [x] Wizard UI with preview
- [x] Commit or download paths
- [x] Suggests required secrets names
- [x] `pnpm quality` green

## Dependencies

- Spec 016, 018 (secrets suggestion)
