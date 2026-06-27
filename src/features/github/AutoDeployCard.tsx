import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { checkAutoDeployRun } from "@/lib/github/client";
import { deployProject, parseHostingerError } from "@/lib/hostinger/client";
import { saveWorkspace } from "@/lib/workspace/client";
import type {
  DeployProjectConfig,
  GitHubLink,
  WorkspaceConfig,
} from "@/lib/workspace/schemas";

interface AutoDeployCardProps {
  config: DeployProjectConfig;
  githubLink: GitHubLink;
  workspace: WorkspaceConfig;
}

export function AutoDeployCard({
  config,
  githubLink,
  workspace,
}: AutoDeployCardProps) {
  const queryClient = useQueryClient();
  const branch = githubLink.defaultBranch ?? "main";
  const enabled = config.autoDeployOnPush ?? false;

  const checkQuery = useQuery({
    queryKey: [
      "auto-deploy-check",
      githubLink.owner,
      githubLink.repo,
      branch,
      config.autoDeployLastRunId,
    ],
    queryFn: () =>
      checkAutoDeployRun(
        githubLink.owner,
        githubLink.repo,
        branch,
        config.autoDeployLastRunId,
      ),
    enabled,
    refetchInterval: enabled ? 5 * 60_000 : false,
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const check = await checkAutoDeployRun(
        githubLink.owner,
        githubLink.repo,
        branch,
        config.autoDeployLastRunId,
      );
      if (!check.shouldDeploy || !check.runId) {
        toast.message(check.message);
        return;
      }
      await deployProject(config.id);
      const nextWorkspace: WorkspaceConfig = {
        ...workspace,
        deployProjects: workspace.deployProjects.map((project) =>
          project.id === config.id
            ? { ...project, autoDeployLastRunId: check.runId }
            : project,
        ),
      };
      await saveWorkspace(nextWorkspace);
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success(`Deployed after workflow run ${check.runId}.`);
    },
    onError: (error) => toast.error(parseHostingerError(error)),
  });

  const persistToggle = async (checked: boolean) => {
    const nextWorkspace: WorkspaceConfig = {
      ...workspace,
      deployProjects: workspace.deployProjects.map((project) =>
        project.id === config.id
          ? { ...project, autoDeployOnPush: checked }
          : project,
      ),
    };
    await saveWorkspace(nextWorkspace);
    await queryClient.invalidateQueries({ queryKey: ["workspace"] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Auto-deploy on push</CardTitle>
        <CardDescription>
          Polls GitHub Actions for successful runs on{" "}
          <code className="text-xs">{branch}</code> and deploys to this VPS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="auto-deploy-toggle"
            checked={enabled}
            onCheckedChange={(checked) => {
              void persistToggle(checked);
            }}
          />
          <Label htmlFor="auto-deploy-toggle">Enable polling (every 5 min)</Label>
        </div>
        {enabled ? (
          <>
            <p className="text-muted-foreground text-xs">
              {checkQuery.data?.message ?? "Checking workflow runs…"}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={checkQuery.isFetching || deployMutation.isPending}
              onClick={() => deployMutation.mutate()}
            >
              {deployMutation.isPending || checkQuery.isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Sync deploy
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
