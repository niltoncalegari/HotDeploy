import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VpsSwitcher } from "@/components/layout/VpsSwitcher";
import { getWorkspace, saveWorkspace } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/workspace/client", () => ({
  getWorkspace: vi.fn(),
  saveWorkspace: vi.fn(),
}));

const mockedGetWorkspace = vi.mocked(getWorkspace);

describe("VpsSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetWorkspace.mockResolvedValue({
      ...defaultWorkspaceConfig,
      connectionProfiles: [
        {
          id: "a",
          label: "Prod",
          provider: "hostinger",
          virtualMachineId: 1,
        },
        {
          id: "b",
          label: "Staging",
          provider: "hostinger",
          virtualMachineId: 2,
        },
      ],
      activeConnectionProfileId: "a",
    });
    vi.mocked(saveWorkspace).mockResolvedValue(undefined);
  });

  it("renders active VPS options", async () => {
    renderWithProviders(<VpsSwitcher />);

    expect(await screen.findByLabelText(/active vps/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /prod/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /staging/i })).toBeInTheDocument();
  });

  it("persists active profile changes", async () => {
    renderWithProviders(<VpsSwitcher />);

    fireEvent.change(await screen.findByLabelText(/active vps/i), {
      target: { value: "b" },
    });

    await waitFor(() => {
      expect(saveWorkspace).toHaveBeenCalled();
    });
  });
});
