import packageJson from "../../package.json";

/** App semver — source of truth: root package.json (synced to Tauri via scripts/sync-version.mjs). */
export const APP_VERSION = packageJson.version;
