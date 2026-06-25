import { fireEvent, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CredentialsCard } from "@/features/settings/CredentialsCard";
import {
  getCredentialsStatus,
  listVirtualMachines,
  previewListVirtualMachines,
  saveCredentials,
} from "@/lib/hostinger/client";
import { getWorkspace, saveWorkspace } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/hostinger/client", () => ({
  getCredentialsStatus: vi.fn(),
  listVirtualMachines: vi.fn(),
  previewListVirtualMachines: vi.fn(),
  saveCredentials: vi.fn(),
  clearCredentials: vi.fn(),
  testConnection: vi.fn(),
  parseHostingerError: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

vi.mock("@/lib/workspace/client", () => ({
  getWorkspace: vi.fn(),
  saveWorkspace: vi.fn(),
}));

const mockedGetCredentialsStatus = vi.mocked(getCredentialsStatus);
const mockedPreviewListVirtualMachines = vi.mocked(previewListVirtualMachines);
const mockedGetWorkspace = vi.mocked(getWorkspace);

describe("CredentialsCard", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCredentialsStatus.mockResolvedValue({
      configured: false,
      virtualMachineId: null,
    });
    mockedGetWorkspace.mockResolvedValue(defaultWorkspaceConfig);
    vi.mocked(listVirtualMachines).mockResolvedValue([]);
  });

  it("shows not configured badge when credentials are missing", async () => {
    renderWithProviders(<CredentialsCard />);

    expect(await screen.findByText("Not configured")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save credentials/i })).toBeInTheDocument();
  });

  it("loads VPS list preview before credentials are saved", async () => {
    mockedPreviewListVirtualMachines.mockResolvedValueOnce([
      { id: 1658621, hostname: "srv1658621.hstgr.cloud", state: "running" },
    ]);

    renderWithProviders(<CredentialsCard />);

    fireEvent.change(screen.getByLabelText(/hostinger api key/i), {
      target: { value: "preview-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: /load vps list/i }));

    await waitFor(() => {
      expect(mockedPreviewListVirtualMachines).toHaveBeenCalledWith(
        "preview-key",
        "hostinger",
      );
    });

    expect(await screen.findByRole("option", { name: /srv1658621/i })).toBeInTheDocument();
  });

  it("saves credentials and syncs workspace profile", async () => {
    vi.mocked(saveCredentials).mockResolvedValueOnce(undefined);
    vi.mocked(saveWorkspace).mockResolvedValueOnce(undefined);
    mockedPreviewListVirtualMachines.mockResolvedValueOnce([
      { id: 1658621, hostname: "srv1658621.hstgr.cloud", state: "running" },
    ]);

    renderWithProviders(<CredentialsCard />);

    fireEvent.change(screen.getByLabelText(/hostinger api key/i), {
      target: { value: "secret-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: /load vps list/i }));
    await waitFor(() => {
      expect(mockedPreviewListVirtualMachines).toHaveBeenCalled();
    });
    fireEvent.change(screen.getByLabelText(/vps from api/i), {
      target: { value: "1658621" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save credentials/i }));

    await waitFor(() => {
      expect(saveCredentials).toHaveBeenCalledWith("secret-key", 1658621);
      expect(saveWorkspace).toHaveBeenCalled();
    });
  });
});
