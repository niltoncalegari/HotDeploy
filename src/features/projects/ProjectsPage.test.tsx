import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { getCredentialsStatus, listProjects } from "@/lib/hostinger/client";
import { getWorkspace } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";
import { renderWithProviders } from "@/test/render";

const mockUseActiveProfile = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@/lib/hostinger/client", () => ({
  getCredentialsStatus: vi.fn(),
  listProjects: vi.fn(),
  deployProject: vi.fn(),
  parseHostingerError: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

vi.mock("@/lib/workspace/client", () => ({
  getWorkspace: vi.fn(),
}));

vi.mock("@/lib/workspace/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/lib/workspace/hooks")>(
    "@/lib/workspace/hooks",
  );
  return {
    ...actual,
    useActiveProfile: () => mockUseActiveProfile(),
  };
});

const mockedGetCredentialsStatus = vi.mocked(getCredentialsStatus);
const mockedListProjects = vi.mocked(listProjects);
const mockedGetWorkspace = vi.mocked(getWorkspace);

const activeProfile = {
  id: "profile-1",
  label: "Production",
  provider: "hostinger" as const,
  virtualMachineId: 1658621,
};

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActiveProfile.mockReturnValue(activeProfile);
    mockedGetCredentialsStatus.mockResolvedValue({
      configured: true,
      virtualMachineId: 1658621,
    });
    mockedGetWorkspace.mockResolvedValue({
      ...defaultWorkspaceConfig,
      connectionProfiles: [activeProfile],
      activeConnectionProfileId: "profile-1",
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
        },
        {
          id: "deploy-2",
          name: "mflow infra",
          connectionProfileId: "profile-1",
          dockerProjectName: "mflow-infra",
          deploySource: {
            type: "github",
            repositoryUrl: "https://github.com/example/mflow",
          },
        },
      ],
    });
    mockedListProjects.mockResolvedValue([
      {
        name: "mflow-staging",
        state: "running",
        filePath: "/docker/mflow-staging/docker-compose.yaml",
        containers: [{ name: "web", image: "nginx", health: "healthy", ports: [] }],
      },
    ]);
  });

  it("renders remote docker projects", async () => {
    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText("mflow-staging")).toBeInTheDocument();
    expect(screen.getByText(/production · vm 1658621/i)).toBeInTheDocument();
  });

  it("prompts for VPS setup when no active profile exists", async () => {
    mockUseActiveProfile.mockReturnValue(null);

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText(/no vps configured yet/i)).toBeInTheDocument();
  });
});
