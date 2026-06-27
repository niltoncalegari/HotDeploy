import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Server } from "lucide-react";
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
import {
  getRunnerStatus,
  installSelfHostedRunner,
  parseGitHubError,
  rotateRunnerRegistration,
  uninstallSelfHostedRunner,
} from "@/lib/github/client";
import type { GitHubLink } from "@/lib/workspace/schemas";

interface RunnerStatusCardProps {
  profileId: string;
  githubLink: GitHubLink;
}

function runnerBadgeVariant(
  state: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case "online":
      return "default";
    case "offline":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

export function RunnerStatusCard({
  profileId,
  githubLink,
}: RunnerStatusCardProps) {
  const queryClient = useQueryClient();
  const { owner, repo } = githubLink;
  const [uninstallOpen, setUninstallOpen] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["runner-status", profileId, owner, repo],
    queryFn: () => getRunnerStatus(profileId, owner, repo),
    refetchInterval: 30_000,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["runner-status", profileId, owner, repo],
    });
  };

  const installMutation = useMutation({
    mutationFn: () => installSelfHostedRunner(profileId, owner, repo),
    onSuccess: async (result) => {
      if (result.success) {
        toast.success(`Runner ${result.runnerName} installed.`);
      } else {
        toast.error(result.message);
      }
      await invalidate();
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const uninstallMutation = useMutation({
    mutationFn: () => uninstallSelfHostedRunner(profileId, owner, repo),
    onSuccess: async (result) => {
      setUninstallOpen(false);
      if (result.success) {
        toast.success(`Runner ${result.runnerName} removed.`);
      } else {
        toast.error(result.message);
      }
      await invalidate();
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const rotateMutation = useMutation({
    mutationFn: () => rotateRunnerRegistration(profileId, owner, repo),
    onSuccess: async (result) => {
      if (result.success) {
        toast.success(`Runner ${result.runnerName} re-registered.`);
      } else {
        toast.error(result.message);
      }
      await invalidate();
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const state = statusQuery.data?.state ?? "notInstalled";
  const busy =
    installMutation.isPending ||
    uninstallMutation.isPending ||
    rotateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4" />
            Self-hosted runner
          </CardTitle>
          <CardDescription>
            Installs a persistent GitHub Actions runner on your VPS via SSH.
            Runners share the VPS with your apps — use a dedicated user when
            possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={runnerBadgeVariant(state)}>{state}</Badge>
            {statusQuery.data?.runnerName ? (
              <span className="text-muted-foreground text-sm">
                {statusQuery.data.runnerName}
              </span>
            ) : null}
          </div>

          {statusQuery.data?.message ? (
            <p className="text-muted-foreground text-xs">
              {statusQuery.data.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => installMutation.mutate()}
            >
              {installMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Install runner on VPS
            </Button>
            {state !== "notInstalled" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => rotateMutation.mutate()}
                >
                  {rotateMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Re-register
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setUninstallOpen(true)}
                >
                  Uninstall
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={uninstallOpen} onOpenChange={setUninstallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uninstall runner?</DialogTitle>
            <DialogDescription>
              This stops the runner service and removes it from GitHub. CI jobs
              targeting this runner will fail until you install again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUninstallOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={uninstallMutation.isPending}
              onClick={() => uninstallMutation.mutate()}
            >
              {uninstallMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Uninstall runner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
