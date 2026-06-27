import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Server } from "lucide-react";
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
  getRunnerStatus,
  installSelfHostedRunner,
  parseGitHubError,
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

  const statusQuery = useQuery({
    queryKey: ["runner-status", profileId, owner, repo],
    queryFn: () => getRunnerStatus(profileId, owner, repo),
    refetchInterval: 30_000,
  });

  const installMutation = useMutation({
    mutationFn: () => installSelfHostedRunner(profileId, owner, repo),
    onSuccess: async (result) => {
      if (result.success) {
        toast.success(`Runner ${result.runnerName} installed.`);
      } else {
        toast.error(result.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["runner-status", profileId, owner, repo],
      });
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const state = statusQuery.data?.state ?? "notInstalled";

  return (
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
          <p className="text-muted-foreground text-xs">{statusQuery.data.message}</p>
        ) : null}

        <Button
          size="sm"
          disabled={installMutation.isPending}
          onClick={() => installMutation.mutate()}
        >
          {installMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Install runner on VPS
        </Button>
      </CardContent>
    </Card>
  );
}
