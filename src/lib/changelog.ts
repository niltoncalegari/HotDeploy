export interface ReleaseNotes {
  version: string;
  features: string[];
  fixes?: string[];
}

/** User-facing release notes — newest first. Keep in sync with package.json on each bump. */
export const RELEASE_NOTES: ReleaseNotes[] = [
  {
    version: "0.8.2",
    features: [
      "Onboarding welcome checkbox to skip setup and not show the wizard again",
    ],
  },
  {
    version: "0.8.1",
    features: [
      "Register GitHub App in-app from Settings (device flow setup)",
      "GitHub CLI fallback when the app is not configured",
      "pnpm register:github-app script and GITHUB_APP_CLIENT_ID via .env",
    ],
  },
  {
    version: "0.8.0",
    features: [
      "Phase 8 — GitHub App device flow, runner uninstall/re-register, auto-deploy polling",
      "Onboarding wizard and reorganized Settings tabs",
      "Environment Profile → GitHub secrets sync and GitHub Environments CRUD",
      "shadcn Select migration across settings and deploy forms",
      "Semver sync tooling (package.json → Tauri + api-harness)",
    ],
    fixes: [
      "Branch-based deploy blocked pending Hostinger API support (documented in ADR-003)",
    ],
  },
];
