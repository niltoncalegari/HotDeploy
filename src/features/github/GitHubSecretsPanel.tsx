import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteGitHubSecret,
  deleteGitHubVariable,
  listGitHubSecrets,
  listGitHubVariables,
  parseGitHubError,
  upsertGitHubSecret,
  upsertGitHubVariable,
} from "@/lib/github/client";
import type { GitHubLink } from "@/lib/workspace/schemas";

interface GitHubSecretsPanelProps {
  githubLink: GitHubLink;
}

export function GitHubSecretsPanel({ githubLink }: GitHubSecretsPanelProps) {
  const queryClient = useQueryClient();
  const { owner, repo } = githubLink;
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [variableName, setVariableName] = useState("");
  const [variableValue, setVariableValue] = useState("");

  const secretsQuery = useQuery({
    queryKey: ["github-secrets", owner, repo],
    queryFn: () => listGitHubSecrets(owner, repo),
  });

  const variablesQuery = useQuery({
    queryKey: ["github-variables", owner, repo],
    queryFn: () => listGitHubVariables(owner, repo),
  });

  const upsertSecretMutation = useMutation({
    mutationFn: () => upsertGitHubSecret(owner, repo, secretName.trim(), secretValue),
    onSuccess: async () => {
      setSecretName("");
      setSecretValue("");
      await queryClient.invalidateQueries({ queryKey: ["github-secrets", owner, repo] });
      toast.success("Secret saved.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const deleteSecretMutation = useMutation({
    mutationFn: (name: string) => deleteGitHubSecret(owner, repo, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["github-secrets", owner, repo] });
      toast.success("Secret deleted.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const upsertVariableMutation = useMutation({
    mutationFn: () =>
      upsertGitHubVariable(owner, repo, variableName.trim(), variableValue),
    onSuccess: async () => {
      setVariableName("");
      setVariableValue("");
      await queryClient.invalidateQueries({
        queryKey: ["github-variables", owner, repo],
      });
      toast.success("Variable saved.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const deleteVariableMutation = useMutation({
    mutationFn: (name: string) => deleteGitHubVariable(owner, repo, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["github-variables", owner, repo],
      });
      toast.success("Variable deleted.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">GitHub secrets & variables</CardTitle>
        <CardDescription>
          Manage Actions secrets (write-only) and variables for {owner}/{repo}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="secrets">
          <TabsList>
            <TabsTrigger value="secrets">Secrets</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="secrets" className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="secret-name">Name</Label>
                <Input
                  id="secret-name"
                  value={secretName}
                  onChange={(event) => setSecretName(event.target.value)}
                  placeholder="HOSTINGER_API_KEY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret-value">Value</Label>
                <Input
                  id="secret-value"
                  type="password"
                  value={secretValue}
                  onChange={(event) => setSecretValue(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              size="sm"
              disabled={
                upsertSecretMutation.isPending ||
                !secretName.trim() ||
                !secretValue
              }
              onClick={() => upsertSecretMutation.mutate()}
            >
              <Plus className="size-4" />
              Save secret
            </Button>

            {secretsQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading secrets…</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(secretsQuery.data ?? []).map((secret) => (
                  <li
                    key={secret.name}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div>
                      <p className="font-medium">{secret.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Updated {secret.updatedAt}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSecretMutation.mutate(secret.name)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="variables" className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="variable-name">Name</Label>
                <Input
                  id="variable-name"
                  value={variableName}
                  onChange={(event) => setVariableName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variable-value">Value</Label>
                <Input
                  id="variable-value"
                  value={variableValue}
                  onChange={(event) => setVariableValue(event.target.value)}
                />
              </div>
            </div>
            <Button
              size="sm"
              disabled={
                upsertVariableMutation.isPending ||
                !variableName.trim()
              }
              onClick={() => upsertVariableMutation.mutate()}
            >
              <Plus className="size-4" />
              Save variable
            </Button>

            {variablesQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading variables…</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(variablesQuery.data ?? []).map((variable) => (
                  <li
                    key={variable.name}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div>
                      <p className="font-medium">{variable.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {variable.value}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVariableMutation.mutate(variable.name)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
