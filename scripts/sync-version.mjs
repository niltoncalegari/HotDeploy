#!/usr/bin/env node
/**
 * Sync app version from package.json to Tauri and workspace packages.
 * Source of truth: package.json (root). Idempotent — safe in CI every run.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid semver in package.json: ${version}`);
  process.exit(1);
}

function syncFile(path, replacers) {
  const fullPath = join(root, path);
  let content = readFileSync(fullPath, "utf8");
  let changed = false;

  for (const [pattern, replacement] of replacers) {
    const next = content.replace(pattern, replacement);
    if (next === content) {
      const probe = content.match(pattern);
      if (!probe) {
        console.error(`No match in ${path} for ${pattern}`);
        process.exit(1);
      }
      continue;
    }
    content = next;
    changed = true;
  }

  if (changed) {
    writeFileSync(fullPath, content);
  }

  return changed;
}

const targets = [
  syncFile("src-tauri/Cargo.toml", [
    [/^version = ".*"$/m, `version = "${version}"`],
  ]),
  syncFile("src-tauri/tauri.conf.json", [
    [/"version": "[^"]+"/, `"version": "${version}"`],
  ]),
  syncFile("packages/api-harness/package.json", [
    [/"version": "[^"]+"/, `"version": "${version}"`],
  ]),
];

if (targets.some(Boolean)) {
  console.log(`Synced version ${version} → Cargo.toml, tauri.conf.json, api-harness`);
} else {
  console.log(`Version ${version} already synced`);
}
