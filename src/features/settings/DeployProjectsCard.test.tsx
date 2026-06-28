// As a developer, I want accurate save feedback so that I know whether the deploy project persisted.
import { fireEvent, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { DeployProjectsCard } from "@/features/settings/DeployProjectsCard";
import { TooltipProvider } from "@/components/ui/tooltip";
import { listGitHubRepos } from "@/lib/github/client";
import { getCredentialsStatus, listProjects } from "@/lib/hostinger/client";
import { saveWorkspace } from "@/lib/workspace/client";
import {
  createConnectionProfile,
  defaultWorkspaceConfig,
  type WorkspaceConfig,
} from "@/lib/workspace/schemas";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/diagnostics/client", () => ({
  logDiagnosticError: vi.fn(),
}));

vi.mock("@/lib/github/client", () => ({
  listGitHubRepos: vi.fn(),
}));

vi.mock("@/lib/hostinger/client", () => ({
  getCredentialsStatus: vi.fn(),
  listProjects: vi.fn(),
  parseHostingerError: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

vi.mock("@/lib/workspace/client", () => ({
  saveWorkspace: vi.fn(),
}));

const mockedSaveWorkspace = vi.mocked(saveWorkspace);
const mockedGetCredentialsStatus = vi.mocked(getCredentialsStatus);
const mockedListProjects = vi.mocked(listProjects);
const mockedListGitHubRepos = vi.mocked(listGitHubRepos);

const profile = createConnectionProfile("Default VPS", 1658621, "hostinger");

const workspaceWithProfile: WorkspaceConfig = {
  ...defaultWorkspaceConfig,
  connectionProfiles: [profile],
  activeConnectionProfileId: profile.id,
};

function renderCard(workspace: WorkspaceConfig = workspaceWithProfile) {
  return renderWithProviders(
    <TooltipProvider>
      <DeployProjectsCard workspace={workspace} />
    </TooltipProvider>,
  );
}

describe("DeployProjectsCard", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCredentialsStatus.mockResolvedValue({
      configured: true,
      virtualMachineId: 1658621,
    });
    mockedListProjects.mockResolvedValue([]);
    mockedListGitHubRepos.mockResolvedValue([]);
  });

  it("shows success toast only after workspace save succeeds", async () => {
    mockedSaveWorkspace.mockResolvedValueOnce(undefined);

    renderCard();

    fireEvent.change(await screen.findByLabelText(/^display name/i), {
      target: { value: "MFlow Staging" },
    });
    fireEvent.change(await screen.findByPlaceholderText("mflow-staging"), {
      target: { value: "mflow-staging" },
    });
    fireEvent.change(screen.getByLabelText(/^compose file path/i), {
      target: { value: "/srv/mflow/docker-compose.yaml" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add deploy project/i }));

    await waitFor(() => {
      expect(mockedSaveWorkspace).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith("Deploy project saved.");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows error toast and rolls back when workspace save fails", async () => {
    mockedSaveWorkspace.mockRejectedValueOnce(new Error("write failed"));

    const { queryClient } = renderCard();
    queryClient.setQueryData(["workspace"], workspaceWithProfile);

    fireEvent.change(await screen.findByLabelText(/^display name/i), {
      target: { value: "MFlow Staging" },
    });
    fireEvent.change(await screen.findByPlaceholderText("mflow-staging"), {
      target: { value: "mflow-staging" },
    });
    fireEvent.change(screen.getByLabelText(/^compose file path/i), {
      target: { value: "/srv/mflow/docker-compose.yaml" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add deploy project/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to save deploy project.");
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(queryClient.getQueryData<WorkspaceConfig>(["workspace"])?.deployProjects).toEqual(
      [],
    );
    expect(screen.getByLabelText(/^display name/i)).toHaveValue("MFlow Staging");
  });
});
