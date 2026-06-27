import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, GitBranch, Loader2, RefreshCw, Rocket, Wand2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";
import { GitHubSecretsPanel } from "@/features/github/GitHubSecretsPanel";
import { RunnerStatusCard } from "@/features/github/RunnerStatusCard";
import { WorkflowGeneratorDialog } from "@/features/github/WorkflowGeneratorDialog";
import { LifecycleActions } from "@/features/projects/LifecycleActions";
import { LogsPanel } from "@/features/projects/LogsPanel";
import { githubRepoLabel, githubRepoUrl } from "@/lib/github/repo";
import {
  deployProject,
  getProject,
  getProjectContainers,
  listProjects,
  parseHostingerError,
} from "@/lib/hostinger/client";
import { formatPercent } from "@/lib/hostinger/metrics";
import { useActiveProfile, useWorkspace } from "@/lib/workspace/hooks";

function healthVariant(health: string): "default" | "secondary" | "destructive" | "outline" {
  switch (health) {
    case "healthy":
      return "default";
    case "unhealthy":
      return "destructive";
    case "starting":
      return "secondary";
    default:
      return "outline";
  }
}

export function ProjectDetailPage() {
  const { projectName = "" } = useParams();
  const decodedName = decodeURIComponent(projectName);
  const activeProfile = useActiveProfile();
  const { data: workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const vmId = activeProfile?.virtualMachineId;
  const provider = activeProfile?.provider ?? "hostinger";
  const [workflowOpen, setWorkflowOpen] = useState(false);

  const localConfig = workspace?.deployProjects.find(
    (project) =>
      project.dockerProjectName === decodedName &&
      project.connectionProfileId === activeProfile?.id,
  );

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", vmId, provider],
    queryFn: () => listProjects(vmId!, provider),
    enabled: Boolean(vmId),
  });

  const project = projects.find((item) => item.name === decodedName);

  const {
    data: containers = [],
    isLoading: containersLoading,
    isFetching: containersFetching,
    refetch: refetchContainers,
  } = useQuery({
    queryKey: ["project-containers", vmId, decodedName, provider],
    queryFn: () => getProjectContainers(vmId!, decodedName, provider),
    enabled: Boolean(vmId && decodedName),
    refetchOnWindowFocus: false,
  });

  const { data: projectContent } = useQuery({
    queryKey: ["project-content", vmId, decodedName, provider],
    queryFn: () => getProject(vmId!, decodedName, provider),
    enabled: Boolean(vmId && decodedName),
  });

  const deployMutation = useMutation({
    mutationFn: () => {
      if (!localConfig) {
        throw new Error("No local deploy config for this project.");
      }
      return deployProject(localConfig.id);
    },
    onSuccess: async () => {
      toast.success("Deployment started.");
      await queryClient.invalidateQueries({ queryKey: ["projects", vmId] });
      await queryClient.invalidateQueries({ queryKey: ["deployment-history"] });
    },
    onError: (error) => toast.error(parseHostingerError(error)),
  });

  const invalidateProjectQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["projects", vmId] });
    await queryClient.invalidateQueries({
      queryKey: ["project-containers", vmId, decodedName],
    });
    await queryClient.invalidateQueries({
      queryKey: ["project-logs", vmId, decodedName],
    });
  };

  if (!vmId) {
    return (
      <PageLayout title="Project" description="No active VPS profile.">
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

  const githubLink = localConfig?.githubLink;

  return (
    <PageLayout
      title={decodedName}
      description={project?.filePath ?? "Docker project details"}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          {localConfig ? (
            <Button
              size="sm"
              disabled={deployMutation.isPending}
              onClick={() => deployMutation.mutate()}
            >
              {deployMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              Redeploy
            </Button>
          ) : null}
          {githubLink ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWorkflowOpen(true)}
            >
              <Wand2 className="size-4" />
              Generate CI/CD
            </Button>
          ) : null}
          <LifecycleActions
            virtualMachineId={vmId}
            projectName={decodedName}
            provider={provider}
            onComplete={invalidateProjectQueries}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {project ? <Badge variant="secondary">{project.state}</Badge> : null}
          {githubLink ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={githubRepoUrl(githubLink)}
                target="_blank"
                rel="noreferrer"
              >
                <GitBranch className="size-4" />
                {githubRepoLabel(githubLink)}
                <ExternalLink className="size-3" />
              </a>
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm">
            {containers.length} container{containers.length === 1 ? "" : "s"}
          </span>
        </div>

        {githubLink && activeProfile ? (
          <>
            <RunnerStatusCard
              profileId={activeProfile.id}
              githubLink={githubLink}
            />
            <GitHubSecretsPanel githubLink={githubLink} />
            <WorkflowGeneratorDialog
              open={workflowOpen}
              onOpenChange={setWorkflowOpen}
              githubLink={githubLink}
              dockerProjectName={decodedName}
              vmId={vmId}
            />
          </>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Containers</CardTitle>
              <CardDescription>
                Runtime status, health, and resource usage from the containers
                endpoint.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={containersFetching}
              onClick={() => {
                void refetchContainers();
              }}
            >
              <RefreshCw
                className={`size-4 ${containersFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {containersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : containers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No containers found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Image</th>
                      <th className="py-2 pr-4 font-medium">Health</th>
                      <th className="py-2 pr-4 font-medium">CPU</th>
                      <th className="py-2 pr-4 font-medium">Memory</th>
                      <th className="py-2 font-medium">Ports</th>
                    </tr>
                  </thead>
                  <tbody>
                    {containers.map((container) => (
                      <tr key={container.name} className="border-b last:border-0">
                        <td className="py-2 pr-4">{container.name}</td>
                        <td className="text-muted-foreground py-2 pr-4">
                          {container.image}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={healthVariant(container.health)}>
                            {container.health}
                          </Badge>
                        </td>
                        <td className="text-muted-foreground py-2 pr-4">
                          {formatPercent(container.stats?.cpuPercentage)}
                        </td>
                        <td className="text-muted-foreground py-2 pr-4">
                          {formatPercent(container.stats?.memoryPercentage)}
                        </td>
                        <td className="text-muted-foreground py-2">
                          {container.ports.join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {projectContent ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compose file</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
                {projectContent.content}
              </pre>
            </CardContent>
          </Card>
        ) : null}

        <LogsPanel
          virtualMachineId={vmId}
          projectName={decodedName}
          provider={provider}
        />
      </div>
    </PageLayout>
  );
}
