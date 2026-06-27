export interface ReleaseNotes {
  version: string;
  features?: string[];
  fixes?: string[];
}

export function compareSemverDesc(left: string, right: string): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const diff = (rightParts[index] ?? 0) - (leftParts[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

/** User-facing release notes. Prefer newest-first in source; always sorted at read time. */
export const RELEASE_NOTES: ReleaseNotes[] = [
  {
    version: "0.8.5",
    fixes: [
      "Onboarding skip-setup checkbox persists to workspace immediately on toggle",
      "OnboardingGate reads updated workspace cache after skip-setup save",
    ],
  },
  {
    version: "0.8.4",
    features: [
      "Release notes sorted newest-first with current version highlighted",
      "Current version badge and primary styling in the release notes dialog",
    ],
  },
  {
    version: "0.8.3",
    features: [
      "Release notes dialog opened from the sidebar version label",
      "Version label shows semver only (removed Hostinger-first prefix)",
    ],
  },
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

export function getReleaseNotesNewestFirst(): ReleaseNotes[] {
  return [...RELEASE_NOTES].sort((left, right) =>
    compareSemverDesc(left.version, right.version),
  );
}
