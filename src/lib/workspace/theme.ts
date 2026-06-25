import type { ThemeMode } from "@/lib/workspace/schemas";

export const THEME_TRANSITION_MS = 300;

export function resolveThemeClass(theme: ThemeMode): "light" | "dark" {
  return theme;
}

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function applyThemeClass(theme: ThemeMode): void {
  const root = document.documentElement;
  const reduceMotion = prefersReducedMotion();

  if (!reduceMotion) {
    root.classList.add("theme-animate");
  }

  root.classList.toggle("dark", theme === "dark");

  if (!reduceMotion) {
    window.setTimeout(() => {
      root.classList.remove("theme-animate");
    }, THEME_TRANSITION_MS);
  }
}
