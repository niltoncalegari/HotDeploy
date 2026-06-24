# Code Conventions

## Language

- **All project artifacts in English**: docs, code comments, UI strings, commits, PR titles and bodies.
- Conversation with the owner may be in Portuguese — never leak PT-BR into committed files.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`
- `import type` for type-only imports
- No `any` — use `unknown` and narrow
- Zod for external payloads and form validation
- Path alias: `@/` → `src/`

## React

- Functional components only
- Feature pages in `src/features/<name>/`
- Reusable layout in `src/components/layout/`
- shadcn primitives in `src/components/ui/` — do not fork without reason
- TanStack Query for async Tauri command data
- react-hook-form + zod for forms (Phase 1+)

## Rust

- One file per concern under `commands/` and `hostinger/`
- Tauri commands: `#[tauri::command]`, `async` when awaiting HTTP
- Errors: `HostingerError` internally, `String` (JSON payload) across IPC boundary
- No `unwrap()` in production paths — use `?` and map errors
- Format with `cargo fmt`, lint with `cargo clippy`

## Tailwind / shadcn

- Use tokens from [DESIGN.md](../DESIGN.md)
- No arbitrary values for colors
- Compose with `cn()` from `@/lib/utils`
- Dark mode via `.dark` on `html` or `body`

## Commits and PRs

- [Conventional Commits](https://www.conventionalcommits.org/): `feat(projects): ...`, `fix(credentials): ...`
- One PR = one cohesive slice
- PR size: ≤200 LOC ideal; >500 needs justification; >1000 split it
- See [docs/PR-WORKFLOW.md](PR-WORKFLOW.md) for agent automation

## Testing

- Vitest for TS; `packages/api-harness` for API contracts
- Rust unit tests colocated or in module `#[cfg(test)]`
- No real Hostinger API calls in unit tests — use `FakeHostingerClient`
- User journey comment at top of significant test files

## Security

- Never commit `.env` with real keys
- Keep `.env.example` with placeholders only
- Never log API keys or full Authorization headers
- Review `git diff` for accidental secret paste before PR

## Spec-driven development

- Spec file required before feature code: `specs/features/NNN-name.spec.md`
- Update spec in same PR if behavior changes
- Link spec path in PR description
