#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> ESLint"
pnpm lint

echo "==> TypeScript"
pnpm typecheck

echo "==> Vitest"
pnpm test:coverage

echo "==> Rust fmt/clippy/test (if cargo available)"
if command -v cargo >/dev/null 2>&1; then
  (cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo test)
else
  echo "WARN: cargo not found — skipping Rust checks (install Rust for full gate)"
fi

echo "==> Version sync"
node scripts/sync-version.mjs

echo "==> Quality ratchet"
node scripts/compare-baseline.mjs

echo "✅ Quality gate passed"
