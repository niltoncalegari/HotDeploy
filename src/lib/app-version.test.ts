import { describe, expect, it } from "vitest";

import { APP_VERSION } from "@/lib/app-version";

describe("APP_VERSION", () => {
  it("matches semver from package.json", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(APP_VERSION).toBe("0.8.0");
  });
});
