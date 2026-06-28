// As a developer, I want CI guidance when no repo is linked so that I know what to configure.
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectCiPage } from "@/features/github/ProjectCiPage";
import { renderWithProviders } from "@/test/render";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ projectName: "my-app" }),
  };
});

vi.mock("@/lib/workspace/hooks", () => ({
  useActiveProfile: () => ({
    id: "profile-1",
    virtualMachineId: 1,
    provider: "hostinger",
  }),
  useWorkspace: () => ({
    data: {
      deployProjects: [],
      connectionProfiles: [],
    },
  }),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: () => ({ data: [{ name: "my-app" }], isLoading: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

describe("ProjectCiPage", () => {
  it("shows empty state when repository is not linked", () => {
    renderWithProviders(<ProjectCiPage />);
    expect(screen.getByText(/no repository linked/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ci \/ actions/i })).toBeInTheDocument();
  });
});
