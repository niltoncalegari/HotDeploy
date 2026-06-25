import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HistoryCard } from "@/features/settings/HistoryCard";
import { getDeploymentHistory } from "@/lib/hostinger/client";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/hostinger/client", () => ({
  getDeploymentHistory: vi.fn(),
  clearDeploymentHistory: vi.fn(),
  parseHostingerError: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

const mockedGetDeploymentHistory = vi.mocked(getDeploymentHistory);

describe("HistoryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no history exists", async () => {
    mockedGetDeploymentHistory.mockResolvedValueOnce([]);

    renderWithProviders(<HistoryCard />);

    expect(await screen.findByText(/no actions recorded yet/i)).toBeInTheDocument();
  });

  it("renders deployment history rows", async () => {
    mockedGetDeploymentHistory.mockResolvedValueOnce([
      {
        id: "1",
        timestamp: "1710000000000",
        dockerProjectName: "mflow-staging",
        virtualMachineId: 1658621,
        action: "deploy",
        outcome: "success",
      },
    ]);

    renderWithProviders(<HistoryCard />);

    expect(await screen.findByText("mflow-staging")).toBeInTheDocument();
    expect(screen.getByText(/deploy · vm 1658621/i)).toBeInTheDocument();
    expect(screen.getByText("success")).toBeInTheDocument();
  });
});
