// As a developer, I want settings grouped in tabs so that I can find credentials faster.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => {
    cleanup();
  });

  it("renders section nav links for each settings area", async () => {
    renderWithProviders(<SettingsPage />);

    expect(await screen.findByRole("link", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /providers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /github & ci/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /deploy projects/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toBeInTheDocument();
  });

  it("opens the deploy section from the tab query parameter", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/settings?tab=deploy"]}>
          <Routes>
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("link", { name: /deploy projects/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
