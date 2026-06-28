export type WorkflowBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

export function workflowStatusVariant(
  status: string,
  conclusion?: string,
): WorkflowBadgeVariant {
  if (status === "completed") {
    if (conclusion === "success") {
      return "default";
    }
    if (conclusion === "failure" || conclusion === "cancelled") {
      return "destructive";
    }
    return "secondary";
  }
  if (status === "in_progress" || status === "queued" || status === "waiting") {
    return "secondary";
  }
  return "outline";
}

export function workflowStatusLabel(status: string, conclusion?: string): string {
  if (status === "completed" && conclusion) {
    return conclusion;
  }
  return status.replace(/_/g, " ");
}

export function hasActiveWorkflowRuns(
  runs: { status: string }[],
): boolean {
  return runs.some(
    (run) =>
      run.status === "in_progress" ||
      run.status === "queued" ||
      run.status === "waiting",
  );
}
