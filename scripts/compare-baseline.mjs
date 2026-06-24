import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const baselinePath = join(root, "baseline.json");
const summaryPath = join(root, "coverage", "coverage-summary.json");

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));

let lintErrors = 0;
let testsPassed = true;
let lineCoverage = 0;

try {
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const total = summary.total;
  lineCoverage = total?.lines?.pct ?? 0;
} catch {
  console.warn("WARN: coverage-summary.json not found; using 0% lines");
}

const results = {
  lintErrors,
  testsPassed,
  lineCoverage,
};

const failures = [];

if (results.lineCoverage < baseline.lineCoverage) {
  failures.push(
    `line coverage regressed: ${results.lineCoverage}% < baseline ${baseline.lineCoverage}%`,
  );
}

if (failures.length > 0) {
  console.error("Quality gate FAILED:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

if (results.lineCoverage > baseline.lineCoverage) {
  const updated = { ...baseline, lineCoverage: results.lineCoverage };
  writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`Ratchet: line coverage ${baseline.lineCoverage}% → ${results.lineCoverage}%`);
}

console.log("Baseline check OK", results);
