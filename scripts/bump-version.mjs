#!/usr/bin/env node
/**
 * Bump HotDeploy version.
 *
 * Policy (pre-1.0):
 *   minor  → next roadmap phase (e.g. phase 8 → 0.8.0)
 *   patch  → slice / fix within current phase (0.8.0 → 0.8.1)
 *   phase N → set minor to N, reset patch to 0 (e.g. phase 9 → 0.9.0)
 *
 * Usage:
 *   node scripts/bump-version.mjs patch
 *   node scripts/bump-version.mjs minor
 *   node scripts/bump-version.mjs phase 9
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

const [mode, phaseArg] = process.argv.slice(2);

if (!mode) {
  console.error("Usage: bump-version.mjs <patch|minor|phase N>");
  process.exit(1);
}

const parts = pkg.version.split(".").map(Number);
if (parts.length !== 3 || parts.some(Number.isNaN)) {
  console.error(`Invalid version: ${pkg.version}`);
  process.exit(1);
}

let [major, minor, patch] = parts;

switch (mode) {
  case "patch":
    patch += 1;
    break;
  case "minor":
    minor += 1;
    patch = 0;
    break;
  case "phase": {
    const phase = Number(phaseArg);
    if (!Number.isInteger(phase) || phase < 0) {
      console.error("phase requires a non-negative integer (e.g. phase 8)");
      process.exit(1);
    }
    minor = phase;
    patch = 0;
    break;
  }
  default:
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
}

const next = `${major}.${minor}.${patch}`;
pkg.version = next;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const sync = spawnSync("node", ["scripts/sync-version.mjs"], {
  cwd: root,
  stdio: "inherit",
});

if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}

console.log(`Bumped version → ${next}`);
