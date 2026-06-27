// As a user, I want release notes data so that the version dialog shows what shipped.
import { describe, expect, it } from "vitest";

import { APP_VERSION } from "@/lib/app-version";
import {
  RELEASE_NOTES,
  compareSemverDesc,
  getReleaseNotesNewestFirst,
} from "@/lib/changelog";

describe("RELEASE_NOTES", () => {
  it("includes the current package version with release notes", () => {
    const current = RELEASE_NOTES.find((entry) => entry.version === APP_VERSION);
    expect(current).toBeDefined();
    const noteCount =
      (current?.features?.length ?? 0) + (current?.fixes?.length ?? 0);
    expect(noteCount).toBeGreaterThan(0);
  });

  it("has unique version entries", () => {
    const versions = RELEASE_NOTES.map((entry) => entry.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("sorts newest version first regardless of source order", () => {
    const sorted = getReleaseNotesNewestFirst();
    expect(sorted[0]?.version).toBe(APP_VERSION);
    expect(sorted[0]?.version).toBe(
      [...RELEASE_NOTES]
        .map((entry) => entry.version)
        .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))[0],
    );
  });

  it("compares equal semver as tied", () => {
    expect(compareSemverDesc("0.8.5", "0.8.5")).toBe(0);
    expect(compareSemverDesc("0.8.5", "0.8.4")).toBeLessThan(0);
    expect(compareSemverDesc("0.8.4", "0.8.5")).toBeGreaterThan(0);
  });
});
