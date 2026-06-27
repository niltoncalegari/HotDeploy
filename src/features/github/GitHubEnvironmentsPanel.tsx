import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createGitHubEnvironment,
  deleteGitHubEnvironment,
  listGitHubEnvironments,
  parseGitHubError,
} from "@/lib/github/client";
import type { GitHubLink } from "@/lib/workspace/schemas";

interface GitHubEnvironmentsPanelProps {
  githubLink: GitHubLink;
}

export function GitHubEnvironmentsPanel({
  githubLink,
}: GitHubEnvironmentsPanelProps) {
  const { owner, repo } = githubLink;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const envQuery = useQuery({
    queryKey: ["github-environments", owner, repo],
    queryFn: () => listGitHubEnvironments(owner, repo),
  });

  const createMutation = useMutation({
    mutationFn: () => createGitHubEnvironment(owner, repo, name.trim()),
    onSuccess: async () => {
      setName("");
      await queryClient.invalidateQueries({
        queryKey: ["github-environments", owner, repo],
      });
      toast.success("Environment created.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (envName: string) =>
      deleteGitHubEnvironment(owner, repo, envName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["github-environments", owner, repo],
      });
      toast.success("Environment deleted.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-4" />
          GitHub Environments
        </CardTitle>
        <CardDescription>
          Deployment gates for staging, production, and custom targets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {envQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading environments…</p>
        ) : envQuery.data?.length === 0 ? (
          <EmptyState
            title="No environments"
            description="Create staging or production to use environment secrets."
          />
        ) : (
          <ul className="space-y-2">
            {envQuery.data?.map((env) => (
              <li
                key={env.name}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-medium">{env.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(env.name)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="env-name">New environment</Label>
            <Input
              id="env-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="production"
            />
          </div>
          <Button
            size="sm"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="size-4" />
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
