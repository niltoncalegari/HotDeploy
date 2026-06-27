// As a developer, I want the onboarding wizard to advance when credentials are connected.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { saveWorkspace } from "@/lib/workspace/client";

vi.mock("@/lib/workspace/client", () => ({
  saveWorkspace: vi.fn(),
}));

vi.mock("@/lib/hostinger/client", () => ({
  getCredentialsStatus: vi.fn().mockResolvedValue({
    configured: true,
    virtualMachineId: 1,
  }),
  saveCredentials: vi.fn(),
}));

vi.mock("@/lib/github/client", () => ({
  getGitHubStatus: vi.fn().mockResolvedValue({ connected: false }),
  parseGitHubError: (error: unknown) => String(error),
  saveGitHubPat: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/lib/workspace/hooks", () => ({
  useWorkspace: () => ({
    data: {
      version: 1,
      preferences: { theme: "light" },
      connectionProfiles: [],
      deployProjects: [],
    },
  }),
}));

function renderWizard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OnboardingWizard", () => {
  it("advances from welcome to provider step", () => {
    renderWizard();

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(screen.getByLabelText(/hostinger api key/i)).toBeInTheDocument();
  });

  it("persists skip-setup preference when the checkbox is toggled", async () => {
    vi.mocked(saveWorkspace).mockResolvedValue(undefined);

    renderWizard();

    fireEvent.click(
      screen.getByRole("checkbox", { name: /don't show setup again/i }),
    );

    await waitFor(() => {
      expect(saveWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ onboardingCompleted: true }),
      );
    });
  });
});
