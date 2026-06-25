import { describe, expect, it, vi } from "vitest";

import { applyThemeClass, resolveThemeClass } from "@/lib/workspace/theme";

// As a developer, I want dark mode applied via the root class so that tokens switch.
describe("theme utilities", () => {
  it("maps theme mode to class names", () => {
    expect(resolveThemeClass("light")).toBe("light");
    expect(resolveThemeClass("dark")).toBe("dark");
  });

  it("toggles the dark class on the document root", () => {
    document.documentElement.classList.remove("dark", "theme-animate");

    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    applyThemeClass("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies a temporary theme-animate class during transitions", () => {
    vi.useFakeTimers();
    document.documentElement.classList.remove("theme-animate");

    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("theme-animate")).toBe(
      true,
    );

    vi.advanceTimersByTime(300);
    expect(document.documentElement.classList.contains("theme-animate")).toBe(
      false,
    );

    vi.useRealTimers();
  });
});
