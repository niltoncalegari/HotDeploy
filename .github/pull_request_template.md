<!--
  Read docs/PR-WORKFLOW.md before filling. Conventional Commits in English.
  PR title should match the squash commit you want on main.
-->

## Summary

<!-- 1–3 bullets. What does this PR do, in plain English? -->

-
-

## Spec

<!-- Path to the feature spec that drove this change -->

`specs/features/NNN-short-name.spec.md`

## Closes / refs

<!-- Closes #N auto-closes the Issue on merge. Use Refs #N for partial steps. -->

Closes #

## Test plan

Manual:

- [ ] step 1
- [ ] step 2

Automated:

- tests in `<path>` covering ...
- coverage delta (if non-trivial): lines X% → Y%

## Quality gate

- [ ] `pnpm quality` green locally
- [ ] `baseline.json` not regressed
- [ ] No secrets in diff

## Out of scope

<!-- Deferred items; match spec "Out of scope" section -->

-

## Notes for reviewers

<!-- Tradeoffs, screenshots for UI changes -->

---

<!-- If agent-authored, uncomment: -->
<!-- Generated with [Cursor](https://cursor.com) -->
