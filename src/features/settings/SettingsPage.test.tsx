// As a developer, I want settings grouped in tabs so that I can find credentials faster.
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsPage } from "@/features/settings/SettingsPage";
import { renderWithProviders } from "@/test/render";

vi.mock("@/features/settings/AppearanceCard", () => ({
  AppearanceCard: () => <div>Appearance</div>,
}));
vi.mock("@/features/settings/CredentialsCard", () => ({
  CredentialsCard: () => <div>Hostinger credentials</div>,
}));
vi.mock("@/features/settings/DigitalOceanCredentialsCard", () => ({
  DigitalOceanCredentialsCard: () => <div>DigitalOcean</div>,
}));
vi.mock("@/features/settings/ConnectionProfilesCard", () => ({
  ConnectionProfilesCard: () => <div>Connection profiles</div>,
}));
vi.mock("@/features/settings/GitHubCredentialsCard", () => ({
  GitHubCredentialsCard: () => <div>GitHub</div>,
}));
vi.mock("@/features/settings/SshCredentialsCard", () => ({
  SshCredentialsCard: () => <div>SSH</div>,
}));
vi.mock("@/features/settings/DeployProjectsCard", () => ({
  DeployProjectsCard: () => <div>Deploy projects</div>,
}));
vi.mock("@/features/settings/HistoryCard", () => ({
  HistoryCard: () => <div>History</div>,
}));

vi.mock("@/lib/workspace/client", () => ({
  getWorkspace: vi.fn().mockResolvedValue({
    version: 1,
    preferences: { theme: "light" },
    connectionProfiles: [],
    deployProjects: [],
  }),
  getWorkspaceFilePath: vi.fn().mockResolvedValue("/tmp/workspace.json"),
}));

describe("SettingsPage", () => {
  it("renders tab triggers for each settings section", async () => {
    renderWithProviders(<SettingsPage />);

    expect(await screen.findByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /providers/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /github & ci/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /deploy projects/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
  });
});
