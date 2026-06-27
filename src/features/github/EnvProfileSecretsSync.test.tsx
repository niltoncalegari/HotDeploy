// As a developer, I want to preview env keys without exposing full secret values.
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EnvProfileSecretsSync } from "@/features/github/EnvProfileSecretsSync";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/github/client", () => ({
  syncEnvProfileToGitHubSecrets: vi.fn(),
  parseGitHubError: (error: unknown) => String(error),
}));

describe("EnvProfileSecretsSync", () => {
  it("lists keys with masked values", () => {
    renderWithProviders(
      <EnvProfileSecretsSync
        githubLink={{ owner: "acme", repo: "widget" }}
        environmentProfile={"API_KEY=supersecret\nDEBUG=true\n"}
      />,
    );

    expect(screen.getByText("API_KEY")).toBeInTheDocument();
    expect(screen.queryByText("supersecret")).not.toBeInTheDocument();
  });
});
