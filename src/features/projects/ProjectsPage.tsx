import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FolderOpen, Rocket, Server } from "lucide-react";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
): Promise<boolean> {
  for (let attempt = 0; attempt < DEPLOY_POLL_MAX_ATTEMPTS; attempt += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, DEPLOY_POLL_INTERVAL_MS);
    });

    const projects = await listProjects(virtualMachineId);
    const match = projects.find((project) => project.name === dockerProjectName);

    if (match?.state.toLowerCase() === "running") {
      return true;
    }
  }

  return false;
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const activeProfile = useActiveProfile();
  const { data: workspace } = useWorkspace();
  const [deployPickerOpen, setDeployPickerOpen] = useState(false);
  const [deployProjectId, setDeployProjectId] = useState<string | null>(null);
  const [pickerProjectId, setPickerProjectId] = useState<string>("");

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
    queryKey: ["projects", activeProfile?.virtualMachineId],
    queryFn: () => listProjects(activeProfile!.virtualMachineId),
    enabled: Boolean(activeProfile && credentials?.configured),
    retry: false,
  });

  const hasActiveTarget = Boolean(activeProfile);
  const localProjects = workspace?.deployProjects ?? [];

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

  return (
    <PageLayout
      title="Projects"
      description="Docker Compose projects running on your connected VPS."
      actions={
        <Button disabled={localProjects.length === 0} onClick={openDeployFlow}>
          <Rocket className="size-4" />
          Deploy project
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        {!hasActiveTarget ? (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>No VPS configured yet</CardTitle>
              <CardDescription>
                Save your Hostinger API key in Settings. HotDeploy will create
                or sync a connection profile for the selected VPS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/settings">Open Settings</Link>
              </Button>
            </CardContent>
          </Card>
        ) : !credentials?.configured ? (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Connect Hostinger API</CardTitle>
              <CardDescription>
                Save your API key in Settings to load remote Docker projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/settings">Open Settings</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                {activeProfile?.label} · VM {activeProfile?.virtualMachineId}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading projects…</p>
            ) : isError ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-destructive text-sm">
                    {parseHostingerError(error)}
                  </p>
                </CardContent>
              </Card>
            ) : remoteProjects.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No Docker projects yet</CardTitle>
                  <CardDescription>
                    Deploy a project or register one in Settings.
                  </CardDescription>
                </CardHeader>
              </Card>
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
                        <Button asChild variant="outline" size="sm">
                          <Link
                            to={`/projects/${encodeURIComponent(project.name)}`}
                          >
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
                    Registered Compose sources ready to deploy.
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
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setDeployProjectId(project.id)}
                      >
                        Deploy
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>

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
            <select
              id="deploy-project-picker"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={pickerProjectId}
              onChange={(event) => setPickerProjectId(event.target.value)}
            >
              {localProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} → {project.dockerProjectName}
                </option>
              ))}
            </select>
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
          if (!open) {
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
          <DialogFooter>
            <Button
              variant="outline"
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
              Deploy now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
