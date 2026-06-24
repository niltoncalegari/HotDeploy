# Design System (HotDeploy)

This document mirrors [DESIGN.md](../DESIGN.md) for agents browsing `docs/`. **DESIGN.md at repo root is canonical** — update both when tokens change.

## Implementation files

- Global CSS variables: `src/index.css`
- shadcn config: `components.json`
- UI primitives: `src/components/ui/`
- Brand SVG: `src/assets/brand/flame.svg`

## shadcn style

- Style: `new-york`
- Base color: `neutral`
- CSS variables: enabled
- Icon library: `lucide-react`

## Adding components

```bash
pnpm dlx shadcn@latest add <component>
```

Only add components when a spec requires them. Prefer reusing existing primitives.

## Flame brand in code

```tsx
<Flame className="size-6 text-flame-500" />
<div className="bg-flame-glow rounded-lg border" />
<Button className="hover:bg-flame-600" />
```

Use `text-flame-500`, `bg-flame-glow`, and semantic `primary` token — not raw hex in JSX.
