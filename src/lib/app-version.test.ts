import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";
import { APP_VERSION } from "@/lib/app-version";

describe("APP_VERSION", () => {
  it("matches semver from package.json", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(APP_VERSION).toBe(packageJson.version);
  });
});
