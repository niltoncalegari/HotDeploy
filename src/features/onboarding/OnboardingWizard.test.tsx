// As a developer, I want the onboarding wizard to advance when credentials are connected.
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

const completeMutate = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "credentials-status") {
      return { data: { configured: true, virtualMachineId: 1 } };
    }
    if (queryKey[0] === "github-status") {
      return { data: { connected: false } };
    }
    return { data: undefined };
  },
  useMutation: () => ({ mutate: completeMutate, isPending: false }),
}));

vi.mock("@/lib/workspace/hooks", () => ({
  useWorkspace: () => ({
    data: { version: 1, preferences: { theme: "light" }, connectionProfiles: [], deployProjects: [] },
  }),
}));

describe("OnboardingWizard", () => {
  it("advances from welcome to provider step", () => {
    render(
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(screen.getByLabelText(/hostinger api key/i)).toBeInTheDocument();
  });

  it("skips setup when the do-not-show-again checkbox is checked", () => {
    completeMutate.mockClear();

    render(
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /don't show setup again/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /open deployment panel/i }),
    );

    expect(completeMutate).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingCompleted: true }),
    );
  });
});
