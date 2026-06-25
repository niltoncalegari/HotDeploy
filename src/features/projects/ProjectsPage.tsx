import { useQuery } from "@tanstack/react-query";
import { Flame, Rocket, Server } from "lucide-react";
import { Link } from "react-router-dom";

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
import { getWorkspace } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";

export function ProjectsPage() {
  const { data: workspace = defaultWorkspaceConfig } = useQuery({
    queryKey: ["workspace"],
    queryFn: getWorkspace,
  });

  const hasProfiles = workspace.connectionProfiles.length > 0;
  const hasProjects = workspace.deployProjects.length > 0;

  return (
    <PageLayout
      title="Projects"
      description="Docker Compose projects running on your connected VPS."
      actions={
        <Button disabled>
          <Rocket className="size-4" />
          Deploy project
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        {!hasProfiles ? (
          <div className="flex min-h-[min(24rem,calc(100vh-12rem))] items-center justify-center">
            <Card className="max-w-lg w-full">
              <CardHeader className="items-center text-center">
                <div className="bg-flame-glow mb-2 flex size-14 items-center justify-center rounded-full">
                  <Flame className="text-flame-500 size-7" aria-hidden />
                </div>
                <CardTitle>No VPS configured yet</CardTitle>
                <CardDescription>
                  Add a connection profile in Settings to register VPS targets
                  and deploy projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/settings">Open Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                {workspace.deployProjects.length} deploy project
                {workspace.deployProjects.length === 1 ? "" : "s"} configured
                locally.
              </p>
              <Badge variant="secondary">Remote status — Phase 2</Badge>
            </div>

            {!hasProjects ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No deploy projects yet</CardTitle>
                  <CardDescription>
                    Register Compose files in Settings to prepare deployments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link to="/settings">Configure deploy projects</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {workspace.deployProjects.map((project) => {
                  const profile = workspace.connectionProfiles.find(
                    (item) => item.id === project.connectionProfileId,
                  );

                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <CardDescription>
                          Docker project: {project.dockerProjectName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Server className="size-4" />
                          {profile?.label ?? "Unknown profile"} · VM{" "}
                          {profile?.virtualMachineId ?? "—"}
                        </p>
                        <p className="text-muted-foreground break-all">
                          {project.deploySource.type === "local"
                            ? project.deploySource.composeFilePath
                            : project.deploySource.repositoryUrl}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
