// As a developer, I want to see job and step status so that I know where CI failed.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkflowRunPipeline } from "@/features/github/WorkflowRunPipeline";
import type { WorkflowJob } from "@/lib/github/client";

const jobs: WorkflowJob[] = [
  {
    id: 1,
    name: "deploy",
    status: "completed",
    conclusion: "failure",
    steps: [
      {
        name: "Checkout",
        status: "completed",
        conclusion: "success",
        number: 1,
      },
      {
        name: "Deploy",
        status: "completed",
        conclusion: "failure",
        number: 2,
      },
    ],
  },
];

describe("WorkflowRunPipeline", () => {
  it("renders jobs and step conclusions", () => {
    render(<WorkflowRunPipeline jobs={jobs} />);

    expect(screen.getByText("deploy")).toBeInTheDocument();
    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getAllByText("failure").length).toBeGreaterThan(0);
    expect(screen.getAllByText("success").length).toBeGreaterThan(0);
  });

  it("shows loading state", () => {
    render(<WorkflowRunPipeline jobs={[]} isLoading />);
    expect(screen.getByText(/loading pipeline/i)).toBeInTheDocument();
  });
});
