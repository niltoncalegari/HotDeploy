// As a developer, I want empty states to show the flame icon so that the UI matches DESIGN.md.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No projects"
        description="Deploy your first Docker Project."
      />,
    );

    expect(screen.getByText("No projects")).toBeInTheDocument();
    expect(
      screen.getByText("Deploy your first Docker Project."),
    ).toBeInTheDocument();
  });
});
