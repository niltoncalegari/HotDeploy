// As a developer, I want GitHub CI guidance on the Projects page when repos are not linked.
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GitHubProjectsPanel } from "@/features/github/GitHubProjectsPanel";
import { getGitHubStatus } from "@/lib/github/client";
import { renderWithProviders } from "@/test/render";

const mockUseActiveProfile = vi.fn();
const mockUseWorkspace = vi.fn();

vi.mock("@/lib/github/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/github/client")>();
  return {
    ...actual,
    getGitHubStatus: vi.fn(),
    listGitHubWorkflowRuns: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/lib/workspace/hooks", () => ({
  useActiveProfile: () => mockUseActiveProfile(),
  useWorkspace: () => mockUseWorkspace(),
}));

const mockedGetGitHubStatus = vi.mocked(getGitHubStatus);

const activeProfile = {
  id: "profile-1",
  label: "Production",
  provider: "hostinger" as const,
  virtualMachineId: 1658621,
};

describe("GitHubProjectsPanel", () => {
  it("prompts to connect GitHub when not authenticated", async () => {
    mockUseActiveProfile.mockReturnValue(activeProfile);
    mockUseWorkspace.mockReturnValue({
      data: { deployProjects: [], connectionProfiles: [activeProfile] },
    });
    mockedGetGitHubStatus.mockResolvedValue({ connected: false });

    renderWithProviders(<GitHubProjectsPanel />);

    expect(await screen.findByText(/github not connected/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /connect github in settings/i }),
    ).toHaveAttribute("href", "/settings?tab=github");
  });

  it("prompts to link repositories when GitHub is connected but none are linked", async () => {
    mockUseActiveProfile.mockReturnValue(activeProfile);
    mockUseWorkspace.mockReturnValue({
      data: {
        deployProjects: [
          {
            id: "deploy-1",
            name: "Local only",
            connectionProfileId: "profile-1",
            dockerProjectName: "mflow-staging",
            deploySource: {
              type: "local",
              composeFilePath: "/tmp/docker-compose.yml",
            },
          },
        ],
        connectionProfiles: [activeProfile],
      },
    });
    mockedGetGitHubStatus.mockResolvedValue({ connected: true, login: "dev" });

    renderWithProviders(<GitHubProjectsPanel />);

    expect(await screen.findByText(/no linked repositories/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /link repository in settings/i }),
    ).toHaveAttribute("href", "/settings?tab=deploy");
  });

  it("renders linked repository cards with pipeline link", async () => {
    mockUseActiveProfile.mockReturnValue(activeProfile);
    mockUseWorkspace.mockReturnValue({
      data: {
        deployProjects: [
          {
            id: "deploy-1",
            name: "mflow staging",
            connectionProfileId: "profile-1",
            dockerProjectName: "mflow-staging",
            deploySource: {
              type: "github",
              repositoryUrl: "https://github.com/example/mflow",
            },
            githubLink: {
              owner: "example",
              repo: "mflow",
              defaultBranch: "main",
            },
          },
        ],
        connectionProfiles: [activeProfile],
      },
    });
    mockedGetGitHubStatus.mockResolvedValue({ connected: true, login: "dev" });

    renderWithProviders(<GitHubProjectsPanel />);

    expect(await screen.findByText("mflow staging")).toBeInTheDocument();
    expect(screen.getByText("example/mflow")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view pipelines/i })).toHaveAttribute(
      "href",
      "/projects/mflow-staging/ci",
    );
  });
});
