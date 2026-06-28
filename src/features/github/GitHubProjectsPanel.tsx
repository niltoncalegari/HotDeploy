import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import { GitHubProjectCiCard } from "@/features/github/GitHubProjectCiCard";
import { getGitHubStatus } from "@/lib/github/client";
import {
  filterDeployProjectsForProfile,
  resolveGithubLinkFromDeployProject,
} from "@/lib/github/repo";
import { useActiveProfile, useWorkspace } from "@/lib/workspace/hooks";

export function GitHubProjectsPanel() {
  const activeProfile = useActiveProfile();
  const { data: workspace } = useWorkspace();

  const { data: githubStatus, isLoading: githubStatusLoading } = useQuery({
    queryKey: ["github-status"],
    queryFn: getGitHubStatus,
  });

  const localProjects = filterDeployProjectsForProfile(
    workspace?.deployProjects ?? [],
    activeProfile?.id,
  );

  const linkedProjects = localProjects.flatMap((project) => {
    const githubLink = resolveGithubLinkFromDeployProject(project);
    if (!githubLink) {
      return [];
    }
    return [{ project, githubLink }];
  });

  if (!activeProfile) {
    return (
      <EmptyState
        title="No VPS configured yet"
        description="Configure a connection profile in Settings before linking GitHub repositories."
        action={
          <EmptyStateButton asChild>
            <Link to="/settings">Open Settings</Link>
          </EmptyStateButton>
        }
      />
    );
  }

  if (githubStatusLoading) {
    return null;
  }

  if (!githubStatus?.connected) {
    return (
      <EmptyState
        title="GitHub not connected"
        description="Connect your GitHub account or PAT to load Actions workflows and CI runs."
        action={
          <EmptyStateButton asChild>
            <Link to="/settings?tab=github">Connect GitHub in Settings</Link>
          </EmptyStateButton>
        }
      />
    );
  }

  if (linkedProjects.length === 0) {
    return (
      <EmptyState
        title="No linked repositories"
        description="Register a deploy project with a GitHub repository to monitor CI pipelines here."
        action={
          <EmptyStateButton asChild>
            <Link to="/settings?tab=deploy">Link repository in Settings</Link>
          </EmptyStateButton>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {linkedProjects.map(({ project, githubLink }) => (
        <GitHubProjectCiCard
          key={project.id}
          project={project}
          githubLink={githubLink}
          pollingEnabled
        />
      ))}
    </div>
  );
}
