import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { getCredentialsStatus } from "@/lib/hostinger/client";
import { getWorkspace, saveWorkspace } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";
import { useEnsureConnectionProfileSynced } from "@/lib/workspace/useEnsureConnectionProfileSynced";

vi.mock("@/lib/hostinger/client", () => ({
  getCredentialsStatus: vi.fn(),
}));

vi.mock("@/lib/workspace/client", () => ({
  getWorkspace: vi.fn(),
  saveWorkspace: vi.fn(),
}));

const mockedGetCredentialsStatus = vi.mocked(getCredentialsStatus);
const mockedGetWorkspace = vi.mocked(getWorkspace);
const mockedSaveWorkspace = vi.mocked(saveWorkspace);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useEnsureConnectionProfileSynced", () => {
  it("persists a connection profile when credentials exist but workspace has none", async () => {
    mockedGetWorkspace.mockResolvedValue(defaultWorkspaceConfig);
    mockedGetCredentialsStatus.mockResolvedValue({
      configured: true,
      virtualMachineId: 1658621,
    });
    mockedSaveWorkspace.mockResolvedValue(undefined);

    renderHook(() => useEnsureConnectionProfileSynced(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedSaveWorkspace).toHaveBeenCalled();
    });

    const saved = mockedSaveWorkspace.mock.calls[0]?.[0];
    expect(saved?.connectionProfiles).toHaveLength(1);
    expect(saved?.connectionProfiles[0]?.virtualMachineId).toBe(1658621);
  });

  it("skips sync when connection profiles already exist", async () => {
    const workspaceWithProfile = {
      ...defaultWorkspaceConfig,
      connectionProfiles: [
        {
          id: "profile-1",
          label: "Default VPS",
          provider: "hostinger" as const,
          virtualMachineId: 1658621,
        },
      ],
    };

    mockedGetWorkspace.mockResolvedValue(workspaceWithProfile);
    mockedGetCredentialsStatus.mockResolvedValue({
      configured: true,
      virtualMachineId: 1658621,
    });
    mockedSaveWorkspace.mockClear();

    renderHook(() => useEnsureConnectionProfileSynced(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedGetCredentialsStatus).toHaveBeenCalled();
    });

    expect(mockedSaveWorkspace).not.toHaveBeenCalled();
  });
});
