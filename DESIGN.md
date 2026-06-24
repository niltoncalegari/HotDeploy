# HotDeploy Design System

> Canonical design tokens for UI. Do not invent colors or spacing outside this file.

## Brand

- **Name:** HotDeploy
- **Symbol:** flame — energetic, deploy-in-motion
- **Primary mark:** `src/assets/brand/flame.svg`, lucide `Flame` icon in UI chrome

## Color tokens

| Token | CSS variable | Hex | Usage |
|---|---|---|---|
| Flame 500 | `--flame-500` | `#F97316` | Primary buttons, active nav, brand accents |
| Flame 600 | `--flame-600` | `#EA580C` | Primary hover |
| Flame glow | `--flame-glow` | `rgba(249,115,22,0.25)` | Focus rings, icon backgrounds |

shadcn semantic tokens (`--primary`, `--background`, etc.) map to flame for primary actions. Destructive actions use shadcn `--destructive` (stop/remove containers).

## Typography

- **UI font:** Inter, system-ui, sans-serif
- **Page title:** `text-xl font-semibold tracking-tight`
- **Section title:** `text-base font-semibold`
- **Body:** `text-sm`
- **Caption:** `text-xs text-muted-foreground`

## Spacing and layout

- **App shell:** sidebar `w-56`, main content scrollable
- **Window default:** 1200×800, min 960×640
- **Page padding:** `p-6` for content areas
- **Card radius:** shadcn `--radius` (0.625rem)

## Components

Use shadcn/ui primitives from `src/components/ui/`. Compose features in `src/features/` and layout in `src/components/layout/`.

| Pattern | Component |
|---|---|
| Primary action | `Button` default variant |
| Destructive action | `Button` destructive variant |
| Status chip | `Badge` |
| Empty state | `Card` centered with flame icon |
| Settings form | `Card` + `Label` + `Input` |

## Dark mode

Supported via `.dark` class on root. Tokens defined in `src/index.css`. Prefer semantic tokens over raw flame hex in components.

## Icons

- **Brand / empty states:** `Flame` (lucide), orange token
- **Navigation:** `FolderKanban` (Projects), `Settings` (Settings)
- **Actions:** `Rocket` (deploy), `KeyRound` (credentials), `Server` (VPS)

## Motion

- Keep subtle: `transition-colors` on interactive elements
- Use `sonner` toasts for async feedback (Phase 1+)

## Do not

- Use arbitrary Tailwind colors (`bg-[#...]`)
- Add gradients except the brand SVG asset
- Mix Portuguese in UI strings

Extended reference: [docs/DESIGN.md](docs/DESIGN.md)
