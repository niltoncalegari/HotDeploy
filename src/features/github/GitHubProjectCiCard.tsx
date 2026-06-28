import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GitBranch, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  workflowStatusLabel,
  workflowStatusVariant,
} from "@/features/github/workflowStatus";
import {
  listGitHubWorkflowRuns,
  parseGitHubError,
} from "@/lib/github/client";
import { githubRepoLabel, githubRepoUrl, type GitHubLink } from "@/lib/github/repo";
import type { DeployProjectConfig } from "@/lib/workspace/schemas";

interface GitHubProjectCiCardProps {
  project: DeployProjectConfig;
  githubLink: GitHubLink;
  pollingEnabled: boolean;
}

function formatRunTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export function GitHubProjectCiCard({
  project,
  githubLink,
  pollingEnabled,
}: GitHubProjectCiCardProps) {
  const owner = githubLink.owner;
  const repo = githubLink.repo;

  const runsQuery = useQuery({
    queryKey: ["github-workflow-runs", owner, repo, "summary"],
    queryFn: () => listGitHubWorkflowRuns(owner, repo, { perPage: 5 }),
    enabled: pollingEnabled,
    refetchInterval: pollingEnabled ? 30_000 : false,
  });

  const runsError = runsQuery.error ? parseGitHubError(runsQuery.error) : null;
  const recentRuns = runsQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">{project.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <GitBranch className="size-3 shrink-0" />
              <a
                href={githubRepoUrl(githubLink)}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {githubRepoLabel(githubLink)}
              </a>
            </CardDescription>
          </div>
          <Badge variant="outline">{project.dockerProjectName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">Recent workflow runs</p>
        {runsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : runsError ? (
          <p className="text-destructive text-sm">{runsError}</p>
        ) : recentRuns.length === 0 ? (
          <p className="text-muted-foreground text-sm">No workflow runs yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentRuns.map((run) => (
              <li
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-medium">{run.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {run.headBranch} · {formatRunTime(run.updatedAt)}
                  </p>
                </div>
                <Badge variant={workflowStatusVariant(run.status, run.conclusion)}>
                  {workflowStatusLabel(run.status, run.conclusion)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm">
            <Link
              to={`/projects/${encodeURIComponent(project.dockerProjectName)}/ci`}
            >
              <Workflow className="size-4" />
              View pipelines
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={githubRepoUrl(githubLink)} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open on GitHub
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
