import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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
import { LifecycleActions } from "@/features/projects/LifecycleActions";
import { LogsPanel } from "@/features/projects/LogsPanel";
import {
  getProject,
  getProjectContainers,
  listProjects,
} from "@/lib/hostinger/client";
import { useActiveProfile } from "@/lib/workspace/hooks";

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
  const queryClient = useQueryClient();
  const vmId = activeProfile?.virtualMachineId;

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", vmId],
    queryFn: () => listProjects(vmId!),
    enabled: Boolean(vmId),
  });

  const project = projects.find((item) => item.name === decodedName);

  const { data: containers = [], isLoading: containersLoading } = useQuery({
    queryKey: ["project-containers", vmId, decodedName],
    queryFn: () => getProjectContainers(vmId!, decodedName),
    enabled: Boolean(vmId && decodedName),
  });

  const { data: projectContent } = useQuery({
    queryKey: ["project-content", vmId, decodedName],
    queryFn: () => getProject(vmId!, decodedName),
    enabled: Boolean(vmId && decodedName),
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
          <Button asChild variant="outline">
            <Link to="/settings">Open Settings</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={decodedName}
      description={project?.filePath ?? "Docker project details"}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <LifecycleActions
            virtualMachineId={vmId}
            projectName={decodedName}
            onComplete={invalidateProjectQueries}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {project ? <Badge variant="secondary">{project.state}</Badge> : null}
          <span className="text-muted-foreground text-sm">
            {containers.length} container{containers.length === 1 ? "" : "s"}
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Containers</CardTitle>
            <CardDescription>Runtime status and port mappings.</CardDescription>
          </CardHeader>
          <CardContent>
            {containersLoading ? (
              <p className="text-muted-foreground text-sm">Loading containers…</p>
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

        <LogsPanel virtualMachineId={vmId} projectName={decodedName} />
      </div>
    </PageLayout>
  );
}
