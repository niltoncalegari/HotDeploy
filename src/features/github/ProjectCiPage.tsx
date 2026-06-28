import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DispatchWorkflowDialog } from "@/features/github/DispatchWorkflowDialog";
import { WorkflowRunPipeline } from "@/features/github/WorkflowRunPipeline";
import {
  hasActiveWorkflowRuns,
  workflowStatusLabel,
  workflowStatusVariant,
} from "@/features/github/workflowStatus";
import { ProjectTabsNav } from "@/features/projects/ProjectTabsNav";
import {
  getGitHubWorkflowRunJobs,
  listGitHubWorkflowRuns,
  listGitHubWorkflows,
  parseGitHubError,
  type GitHubWorkflow,
  type WorkflowRunDetail,
} from "@/lib/github/client";
import { githubRepoLabel } from "@/lib/github/repo";
import { listProjects } from "@/lib/hostinger/client";
import { useActiveProfile, useWorkspace } from "@/lib/workspace/hooks";

function formatRunTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

function RunRow({
  run,
  owner,
  repo,
  expanded,
  onToggle,
}: {
  run: WorkflowRunDetail;
  owner: string;
  repo: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const jobsQuery = useQuery({
    queryKey: ["github-run-jobs", owner, repo, run.id],
    queryFn: () => getGitHubWorkflowRunJobs(owner, repo, run.id),
    enabled: expanded,
  });

  return (
    <div className="border-border rounded-md border">
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          className="hover:bg-muted/50 flex min-w-0 flex-1 items-start gap-2 rounded-md text-left"
          onClick={onToggle}
        >
          {expanded ? (
            <ChevronDown className="mt-0.5 size-4 shrink-0" />
          ) : (
            <ChevronRight className="mt-0.5 size-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{run.name}</span>
              <Badge variant={workflowStatusVariant(run.status, run.conclusion)}>
                {workflowStatusLabel(run.status, run.conclusion)}
              </Badge>
              <Badge variant="outline">{run.event}</Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              #{run.id} · {run.headBranch} · {formatRunTime(run.updatedAt)}
            </p>
          </div>
        </button>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <a href={run.htmlUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
      {expanded ? (
        <div className="border-border border-t px-3 pb-3">
          <WorkflowRunPipeline
            jobs={jobsQuery.data ?? []}
            isLoading={jobsQuery.isLoading}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ProjectCiPage() {
  const { projectName = "" } = useParams();
  const decodedName = decodeURIComponent(projectName);
  const activeProfile = useActiveProfile();
  const { data: workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const vmId = activeProfile?.virtualMachineId;
  const provider = activeProfile?.provider ?? "hostinger";
  const [branchFilter, setBranchFilter] = useState("");
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
  const [dispatchWorkflow, setDispatchWorkflow] = useState<GitHubWorkflow | null>(
    null,
  );

  const localConfig = workspace?.deployProjects.find(
    (project) =>
      project.dockerProjectName === decodedName &&
      project.connectionProfileId === activeProfile?.id,
  );
  const githubLink = localConfig?.githubLink;

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", vmId, provider],
    queryFn: () => listProjects(vmId!, provider),
    enabled: Boolean(vmId),
  });

  const project = projects.find((item) => item.name === decodedName);
  const owner = githubLink?.owner ?? "";
  const repo = githubLink?.repo ?? "";
  const defaultBranch = githubLink?.defaultBranch ?? "main";

  const workflowsQuery = useQuery({
    queryKey: ["github-workflows", owner, repo],
    queryFn: () => listGitHubWorkflows(owner, repo),
    enabled: Boolean(githubLink),
  });

  const runsQuery = useQuery({
    queryKey: ["github-workflow-runs", owner, repo, branchFilter],
    queryFn: () =>
      listGitHubWorkflowRuns(owner, repo, {
        branch: branchFilter.trim() || undefined,
        perPage: 30,
      }),
    enabled: Boolean(githubLink),
    refetchInterval: (query) => {
      const runs = query.state.data ?? [];
      return hasActiveWorkflowRuns(runs) ? 15_000 : 30_000;
    },
  });

  const activeRuns = useMemo(
    () => hasActiveWorkflowRuns(runsQuery.data ?? []),
    [runsQuery.data],
  );

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["github-workflows", owner, repo] });
    await queryClient.invalidateQueries({
      queryKey: ["github-workflow-runs", owner, repo, branchFilter],
    });
    if (expandedRunId !== null) {
      await queryClient.invalidateQueries({
        queryKey: ["github-run-jobs", owner, repo, expandedRunId],
      });
    }
  };

  if (!vmId) {
    return (
      <PageLayout title="CI / Actions" description="No active VPS profile.">
        <div className="p-6">
          <EmptyStateButton asChild>
            <Link to="/settings">Open Settings</Link>
          </EmptyStateButton>
        </div>
      </PageLayout>
    );
  }

  if (!projectsLoading && !project) {
    return (
      <PageLayout title="Project not found" description={decodedName}>
        <div className="p-6">
          <EmptyState
            title="Docker project not found"
            description={`No project named "${decodedName}" on the active VPS.`}
            action={
              <EmptyStateButton asChild>
                <Link to="/">Back to Projects</Link>
              </EmptyStateButton>
            }
          />
        </div>
      </PageLayout>
    );
  }

  if (!githubLink) {
    return (
      <PageLayout
        title={decodedName}
        description="GitHub Actions CI"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={`/projects/${encodeURIComponent(decodedName)}`}>
              <ArrowLeft className="size-4" />
              Overview
            </Link>
          </Button>
        }
      >
        <div className="flex flex-col gap-4 p-6">
          <ProjectTabsNav projectName={decodedName} />
          <EmptyState
            title="No repository linked"
            description="Link a GitHub repository to this deploy project to view CI runs."
            action={
              <EmptyStateButton asChild>
                <Link to={`/projects/${encodeURIComponent(decodedName)}`}>
                  Go to Overview
                </Link>
              </EmptyStateButton>
            }
          />
        </div>
      </PageLayout>
    );
  }

  const workflowsError = workflowsQuery.error
    ? parseGitHubError(workflowsQuery.error)
    : null;
  const runsError = runsQuery.error ? parseGitHubError(runsQuery.error) : null;

  return (
    <PageLayout
      title={decodedName}
      description={`CI / Actions · ${githubRepoLabel(githubLink)}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={workflowsQuery.isFetching || runsQuery.isFetching}
            onClick={() => {
              void refreshAll();
            }}
          >
            {workflowsQuery.isFetching || runsQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        <ProjectTabsNav projectName={decodedName} />

        {activeRuns ? (
          <p className="text-muted-foreground text-xs">
            Polling every 15s while runs are in progress.
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Polling every 30s while this tab is open.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflows</CardTitle>
            <CardDescription>
              All GitHub Actions workflows in this repository.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflowsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : workflowsError ? (
              <p className="text-destructive text-sm">{workflowsError}</p>
            ) : (workflowsQuery.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No workflows found.</p>
            ) : (
              <ul className="space-y-2">
                {(workflowsQuery.data ?? []).map((workflow) => (
                  <li
                    key={workflow.id}
                    className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{workflow.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {workflow.path}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{workflow.state}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDispatchWorkflow(workflow)}
                      >
                        <Play className="size-4" />
                        Run
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <a href={workflow.htmlUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Recent runs</CardTitle>
              <CardDescription>
                Workflow runs across all branches (filter optional).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs space-y-2">
              <Label htmlFor="branch-filter">Branch filter</Label>
              <Input
                id="branch-filter"
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
                placeholder={`All branches (e.g. ${defaultBranch})`}
              />
            </div>
            {runsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : runsError ? (
              <p className="text-destructive text-sm">{runsError}</p>
            ) : (runsQuery.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No workflow runs yet.</p>
            ) : (
              <div className="space-y-2">
                {(runsQuery.data ?? []).map((run) => (
                  <RunRow
                    key={run.id}
                    run={run}
                    owner={owner}
                    repo={repo}
                    expanded={expandedRunId === run.id}
                    onToggle={() =>
                      setExpandedRunId((current) =>
                        current === run.id ? null : run.id,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {dispatchWorkflow ? (
        <DispatchWorkflowDialog
          open={Boolean(dispatchWorkflow)}
          onOpenChange={(open) => {
            if (!open) {
              setDispatchWorkflow(null);
            }
          }}
          owner={owner}
          repo={repo}
          workflow={dispatchWorkflow}
          defaultBranch={defaultBranch}
          onDispatched={() => {
            void refreshAll();
          }}
        />
      ) : null}
    </PageLayout>
  );
}
