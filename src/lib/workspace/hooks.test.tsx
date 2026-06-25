import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { getWorkspace } from "@/lib/workspace/client";
import { useActiveProfile, useWorkspace, resolveActiveProfile } from "@/lib/workspace/hooks";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";

vi.mock("@/lib/workspace/client", () => ({
  getWorkspace: vi.fn(),
}));

const mockedGetWorkspace = vi.mocked(getWorkspace);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("resolveActiveProfile", () => {
  it("returns null when no profiles exist", () => {
    expect(resolveActiveProfile(defaultWorkspaceConfig)).toBeNull();
  });
});

describe("workspace hooks", () => {
  it("useWorkspace loads workspace config", async () => {
    mockedGetWorkspace.mockResolvedValueOnce(defaultWorkspaceConfig);

    const { result } = renderHook(() => useWorkspace(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.version).toBe(1);
    });
  });

  it("useActiveProfile returns active connection profile", async () => {
    mockedGetWorkspace.mockResolvedValueOnce({
      ...defaultWorkspaceConfig,
      connectionProfiles: [
        {
          id: "a",
          label: "Prod",
          provider: "hostinger",
          virtualMachineId: 1,
        },
      ],
      activeConnectionProfileId: "a",
    });

    const { result } = renderHook(() => useActiveProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current?.label).toBe("Prod");
    });
  });
});
