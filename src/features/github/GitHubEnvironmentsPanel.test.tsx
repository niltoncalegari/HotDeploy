// As a developer, I want an empty state when no GitHub environments exist.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GitHubEnvironmentsPanel } from "@/features/github/GitHubEnvironmentsPanel";

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: () => ({ data: [], isLoading: false }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("GitHubEnvironmentsPanel", () => {
  it("renders empty state", () => {
    render(
      <GitHubEnvironmentsPanel
        githubLink={{ owner: "acme", repo: "widget" }}
      />,
    );
    expect(screen.getByText(/no environments/i)).toBeInTheDocument();
  });
});
