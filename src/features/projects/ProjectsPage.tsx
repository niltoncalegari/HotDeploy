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
import {
  deployProject,
  getCredentialsStatus,
  listProjects,
  parseHostingerError,
} from "@/lib/hostinger/client";
import { useActiveProfile, useWorkspace } from "@/lib/workspace/hooks";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const activeProfile = useActiveProfile();
  const { data: workspace } = useWorkspace();
  const [deployProjectId, setDeployProjectId] = useState<string | null>(null);

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

  const deployMutation = useMutation({
    mutationFn: deployProject,
    onSuccess: async () => {
      toast.success("Deployment started.");
      setDeployProjectId(null);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["deployment-history"] });
    },
    onError: (deployError) => {
      toast.error(parseHostingerError(deployError));
    },
  });

  const hasProfiles = (workspace?.connectionProfiles.length ?? 0) > 0;
  const localProjects = workspace?.deployProjects ?? [];
  const selectedDeployProject = localProjects.find(
    (project) => project.id === deployProjectId,
  );

  return (
    <PageLayout
      title="Projects"
      description="Docker Compose projects running on your connected VPS."
      actions={
        <Button
          disabled={localProjects.length === 0}
          onClick={() => {
            if (localProjects[0]) {
              setDeployProjectId(localProjects[0].id);
            }
          }}
        >
          <Rocket className="size-4" />
          Deploy project
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        {!hasProfiles ? (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>No VPS configured yet</CardTitle>
              <CardDescription>
                Add a connection profile in Settings to register VPS targets.
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
