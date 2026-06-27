import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import {
  parseGitHubError,
  syncEnvProfileToGitHubSecrets,
} from "@/lib/github/client";
import type { GitHubLink } from "@/lib/workspace/schemas";

function maskValue(value: string): string {
  if (value.length <= 4) {
    return "••••";
  }
  return `${value.slice(0, 2)}${"•".repeat(Math.min(value.length - 2, 8))}`;
}

interface EnvProfileSecretsSyncProps {
  githubLink: GitHubLink;
  environmentProfile?: string;
}

export function EnvProfileSecretsSync({
  githubLink,
  environmentProfile,
}: EnvProfileSecretsSyncProps) {
  const { owner, repo } = githubLink;
  const entries = useMemo(() => {
    if (!environmentProfile?.trim()) {
      return [];
    }
    return environmentProfile
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) {
          return null;
        }
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim();
        return key ? { key, value } : null;
      })
      .filter((entry): entry is { key: string; value: string } => entry !== null);
  }, [environmentProfile]);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const syncMutation = useMutation({
    mutationFn: () =>
      syncEnvProfileToGitHubSecrets(
        owner,
        repo,
        environmentProfile ?? "",
        [...selected],
      ),
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported.length} secret(s) to GitHub.`);
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import to GitHub Secrets</CardTitle>
        <CardDescription>
          One-way import from Environment Profile. Values are write-only on
          GitHub after save.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                id={`env-key-${entry.key}`}
                checked={selected.has(entry.key)}
                onChange={(event) => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (event.target.checked) {
                      next.add(entry.key);
                    } else {
                      next.delete(entry.key);
                    }
                    return next;
                  });
                }}
              />
              <Label htmlFor={`env-key-${entry.key}`} className="font-mono">
                {entry.key}
              </Label>
              <span className="text-muted-foreground">{maskValue(entry.value)}</span>
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          disabled={selected.size === 0 || syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          Import selected to GitHub
        </Button>
      </CardContent>
    </Card>
  );
}
