// As a developer, I want confirmation before uninstalling a runner so that I avoid accidental CI disruption.
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunnerStatusCard } from "@/features/github/RunnerStatusCard";

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      state: "online",
      message: "ok",
      runnerName: "hotdeploy-acme-widget-1",
    },
    isLoading: false,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("RunnerStatusCard", () => {
  it("opens confirm dialog before uninstall", () => {
    render(
      <RunnerStatusCard
        profileId="p1"
        githubLink={{ owner: "acme", repo: "widget" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /uninstall/i }));
    expect(
      screen.getByRole("dialog", { name: /uninstall runner/i }),
    ).toBeInTheDocument();
  });
});
