import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, PlugZap } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearGitHubPat,
  getGitHubStatus,
  parseGitHubError,
  saveGitHubPat,
  testGitHubConnection,
} from "@/lib/github/client";

export function GitHubCredentialsCard() {
  const queryClient = useQueryClient();
  const [pat, setPat] = useState("");
  const [testLogin, setTestLogin] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["github-status"],
    queryFn: getGitHubStatus,
  });

  const saveMutation = useMutation({
    mutationFn: () => saveGitHubPat(pat.trim()),
    onSuccess: async () => {
      setPat("");
      await queryClient.invalidateQueries({ queryKey: ["github-status"] });
      toast.success("GitHub PAT saved.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const clearMutation = useMutation({
    mutationFn: clearGitHubPat,
    onSuccess: async () => {
      setTestLogin(null);
      await queryClient.invalidateQueries({ queryKey: ["github-status"] });
      toast.success("GitHub PAT cleared.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const testMutation = useMutation({
    mutationFn: testGitHubConnection,
    onSuccess: (result) => {
      setTestLogin(result.login);
      toast.success(`Connected as ${result.login}`);
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="size-4" />
          GitHub
        </CardTitle>
        <CardDescription>
          Personal Access Token for repos, secrets, workflows, and runners.
          Required scopes: repo, workflow, admin:repo_hook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Checking status…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Badge variant={status?.connected ? "default" : "outline"}>
              {status?.connected ? "Configured" : "Not configured"}
            </Badge>
            {status?.login ? (
              <Badge variant="secondary">@{status.login}</Badge>
            ) : null}
            {testLogin ? (
              <Badge variant="secondary">Tested: @{testLogin}</Badge>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="github-pat">GitHub PAT</Label>
          <Input
            id="github-pat"
            type="password"
            value={pat}
            onChange={(event) => setPat(event.target.value)}
            placeholder={status?.connected ? "••••••••" : "ghp_…"}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveMutation.isPending || (!pat.trim() && !status?.connected)}
            onClick={() => saveMutation.mutate()}
          >
            Save PAT
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending || !status?.connected}
            onClick={() => testMutation.mutate()}
          >
            <PlugZap className="size-4" />
            Test connection
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={clearMutation.isPending || !status?.connected}
            onClick={() => clearMutation.mutate()}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
