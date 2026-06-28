import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FolderOpen, GitBranch, Loader2, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { VpsMetricsCard } from "@/features/projects/VpsMetricsCard";
import {
  filterDeployProjectsForProfile,
  githubRepoLabel,
} from "@/lib/github/repo";
import {
  deployProject,
  getCredentialsStatus,
  listProjects,
  parseHostingerError,
} from "@/lib/hostinger/client";
import { useActiveProfile, useWorkspace } from "@/lib/workspace/hooks";

const DEPLOY_POLL_INTERVAL_MS = 3000;
const DEPLOY_POLL_MAX_ATTEMPTS = 20;

async function waitForProjectRunning(
  virtualMachineId: number,
  dockerProjectName: string,
  provider: "hostinger" | "digitalocean",
): Promise<boolean> {
  for (let attempt = 0; attempt < DEPLOY_POLL_MAX_ATTEMPTS; attempt += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, DEPLOY_POLL_INTERVAL_MS);
    });

    const projects = await listProjects(virtualMachineId, provider);
    const match = projects.find((project) => project.name === dockerProjectName);

    if (match?.state.toLowerCase() === "running") {
      return true;
    }
  }

  return false;
}

function ProjectListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

interface VpsProjectsPanelProps {
  onDeployProject: (projectId: string) => void;
}

export function VpsProjectsPanel({ onDeployProject }: VpsProjectsPanelProps) {
  const activeProfile = useActiveProfile();
  const { data: workspace } = useWorkspace();
  const provider = activeProfile?.provider ?? "hostinger";

  const { data: credentials } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  const {
    data: remoteProjects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", activeProfile?.virtualMachineId, provider],
    queryFn: () => listProjects(activeProfile!.virtualMachineId, provider),
    enabled: Boolean(activeProfile && credentials?.configured),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const hasActiveTarget = Boolean(activeProfile);
  const localProjects = filterDeployProjectsForProfile(
    workspace?.deployProjects ?? [],
    activeProfile?.id,
  );

  const providerLabel =
    activeProfile?.provider === "digitalocean" ? "DigitalOcean" : "Hostinger";

  if (!hasActiveTarget) {
    return (
      <EmptyState
        title="No VPS configured yet"
        description={`Save your ${providerLabel} API key in Settings. HotDeploy will create or sync a connection profile for the selected VPS.`}
        action={
          <EmptyStateButton asChild>
            <Link to="/settings">Open Settings</Link>
          </EmptyStateButton>
        }
      />
    );
  }

  if (!credentials?.configured) {
    return (
      <EmptyState
        title="Connect your provider API"
        description="Save your API key in Settings to load remote Docker projects."
        action={
          <EmptyStateButton asChild>
            <Link to="/settings">Open Settings</Link>
          </EmptyStateButton>
        }
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {activeProfile?.label} · VM {activeProfile?.virtualMachineId}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <VpsMetricsCard
        virtualMachineId={activeProfile!.virtualMachineId}
        provider={provider}
      />

      {isLoading ? (
        <ProjectListSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{parseHostingerError(error)}</p>
          </CardContent>
        </Card>
      ) : remoteProjects.length === 0 ? (
        <EmptyState
          title="No Docker projects yet"
          description="Deploy a project or register one in Settings."
          action={
            <EmptyStateButton asChild>
              <Link to="/settings?tab=deploy">Register deploy project</Link>
            </EmptyStateButton>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {remoteProjects.map((project) => {
            const localMatch = localProjects.find(
              (item) => item.dockerProjectName === project.name,
            );

            return (
              <Card key={project.name}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        <Link
                          className="hover:underline"
                          to={`/projects/${encodeURIComponent(project.name)}`}
                        >
                          {project.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>{project.filePath}</CardDescription>
                    </div>
                    <Badge variant="secondary">{project.state}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {project.containers.length} container
                    {project.containers.length === 1 ? "" : "s"}
                  </p>
                  {localMatch ? (
                    <Badge variant="outline">Configured locally</Badge>
                  ) : null}
                  {localMatch?.githubLink ? (
                    <Badge variant="outline" className="gap-1">
                      <GitBranch className="size-3" />
                      {githubRepoLabel(localMatch.githubLink)}
                    </Badge>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/projects/${encodeURIComponent(project.name)}`}>
                      <FolderOpen className="size-4" />
                      View details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {localProjects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Local deploy configs</CardTitle>
            <CardDescription>
              Registered Compose sources for this VPS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {localProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Server className="size-4" />
                    {project.dockerProjectName}
                  </p>
                  {project.githubLink ? (
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      <GitBranch className="size-3" />
                      {githubRepoLabel(project.githubLink)}
                    </p>
                  ) : null}
                </div>
                <Button size="sm" onClick={() => onDeployProject(project.id)}>
                  Deploy
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export function useDeployProjectFlow() {
  const queryClient = useQueryClient();
  const activeProfile = useActiveProfile();
  const { data: workspace } = useWorkspace();
  const [deployPickerOpen, setDeployPickerOpen] = useState(false);
  const [deployProjectId, setDeployProjectId] = useState<string | null>(null);
  const [pickerProjectId, setPickerProjectId] = useState<string>("");

  const localProjects = filterDeployProjectsForProfile(
    workspace?.deployProjects ?? [],
    activeProfile?.id,
  );

  const deployMutation = useMutation({
    mutationFn: deployProject,
    onSuccess: async (_result, projectId) => {
      const deployed = localProjects.find((project) => project.id === projectId);
      setDeployProjectId(null);

      if (deployed && activeProfile) {
        toast.success("Deployment started. Waiting for running state…");
        const running = await waitForProjectRunning(
          activeProfile.virtualMachineId,
          deployed.dockerProjectName,
          activeProfile.provider,
        );
        if (running) {
          toast.success(`${deployed.dockerProjectName} is running.`);
        } else {
          toast.message("Deployment submitted. Refresh to check status.");
        }
      } else {
        toast.success("Deployment started.");
      }

      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["deployment-history"] });
    },
    onError: (deployError) => {
      toast.error(parseHostingerError(deployError));
    },
  });

  const selectedDeployProject = localProjects.find(
    (project) => project.id === deployProjectId,
  );

  const openDeployFlow = () => {
    if (localProjects.length === 1) {
      setDeployProjectId(localProjects[0]!.id);
      return;
    }

    setPickerProjectId(localProjects[0]?.id ?? "");
    setDeployPickerOpen(true);
  };

  const confirmPickerSelection = () => {
    if (!pickerProjectId) {
      return;
    }
    setDeployPickerOpen(false);
    setDeployProjectId(pickerProjectId);
  };

  const deployDialogs = (
    <>
      <Dialog open={deployPickerOpen} onOpenChange={setDeployPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select deploy project</DialogTitle>
            <DialogDescription>
              Choose which registered Compose source to deploy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deploy-project-picker">Deploy project</Label>
            <Select value={pickerProjectId} onValueChange={setPickerProjectId}>
              <SelectTrigger id="deploy-project-picker" className="w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {localProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} → {project.dockerProjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeployPickerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPickerSelection}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deployProjectId !== null}
        onOpenChange={(open) => {
          if (!open && !deployMutation.isPending) {
            setDeployProjectId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deployment</DialogTitle>
            <DialogDescription>
              Deploy {selectedDeployProject?.dockerProjectName} to VM{" "}
              {activeProfile?.virtualMachineId}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="branch-pinning">Branch pinning</Label>
            <Input
              id="branch-pinning"
              disabled
              placeholder="Coming when provider API supports branch/ref deploy"
            />
            <p className="text-muted-foreground text-xs">
              Blocked on Hostinger Docker Manager API — see spec 029.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deployMutation.isPending}
              onClick={() => setDeployProjectId(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={deployMutation.isPending || !deployProjectId}
              onClick={() => {
                if (deployProjectId) {
                  deployMutation.mutate(deployProjectId);
                }
              }}
            >
              {deployMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deploying…
                </>
              ) : (
                "Deploy now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return {
    localProjects,
    openDeployFlow,
    deployDialogs,
    startDeploy: (projectId: string) => setDeployProjectId(projectId),
  };
}
