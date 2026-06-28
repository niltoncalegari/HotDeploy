import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WorkflowJob } from "@/lib/github/client";
import {
  workflowStatusLabel,
  workflowStatusVariant,
} from "@/features/github/workflowStatus";

interface WorkflowRunPipelineProps {
  jobs: WorkflowJob[];
  isLoading?: boolean;
}

function StepIcon({
  status,
  conclusion,
}: {
  status: string;
  conclusion?: string;
}) {
  if (status === "in_progress" || status === "queued") {
    return <Loader2 className="text-muted-foreground size-4 animate-spin" />;
  }
  if (status === "completed" && conclusion === "success") {
    return <CheckCircle2 className="text-primary size-4" />;
  }
  if (status === "completed" && conclusion === "failure") {
    return <XCircle className="text-destructive size-4" />;
  }
  return <Circle className="text-muted-foreground size-4" />;
}

export function WorkflowRunPipeline({ jobs, isLoading }: WorkflowRunPipelineProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading pipeline…</p>;
  }

  if (jobs.length === 0) {
    return <p className="text-muted-foreground text-sm">No jobs for this run.</p>;
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="border-border rounded-md border p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{job.name}</span>
            <Badge variant={workflowStatusVariant(job.status, job.conclusion)}>
              {workflowStatusLabel(job.status, job.conclusion)}
            </Badge>
          </div>
          {job.steps.length > 0 ? (
            <ul className="space-y-2">
              {job.steps.map((step) => (
                <li
                  key={`${job.id}-${step.number}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <StepIcon status={step.status} conclusion={step.conclusion} />
                  <span>{step.name}</span>
                  <Badge
                    variant={workflowStatusVariant(step.status, step.conclusion)}
                    className="ml-auto"
                  >
                    {workflowStatusLabel(step.status, step.conclusion)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">No steps reported.</p>
          )}
        </div>
      ))}
    </div>
  );
}
