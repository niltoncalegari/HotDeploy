import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlugZap, Terminal } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getSshStatus,
  parseGitHubError,
  saveSshCredentials,
  testSshConnection,
} from "@/lib/github/client";
import type { WorkspaceConfig } from "@/lib/workspace/schemas";

interface SshCredentialsCardProps {
  workspace: WorkspaceConfig;
}

export function SshCredentialsCard({ workspace }: SshCredentialsCardProps) {
  const queryClient = useQueryClient();
  const [privateKey, setPrivateKey] = useState("");
  const [username, setUsername] = useState("root");
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const activeProfileId =
    workspace.activeConnectionProfileId ?? workspace.connectionProfiles[0]?.id;

  const { data: status, isLoading } = useQuery({
    queryKey: ["ssh-status"],
    queryFn: getSshStatus,
  });

  const saveMutation = useMutation({
    mutationFn: () => saveSshCredentials(privateKey.trim(), username.trim() || "root"),
    onSuccess: async () => {
      setPrivateKey("");
      await queryClient.invalidateQueries({ queryKey: ["ssh-status"] });
      toast.success("SSH credentials saved.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const testMutation = useMutation({
    mutationFn: () => {
      if (!activeProfileId) {
        throw new Error("Add a connection profile first.");
      }
      return testSshConnection(activeProfileId);
    },
    onSuccess: (result) => {
      setTestMessage(result.message);
      if (result.connected) {
        toast.success("SSH connection successful.");
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Terminal className="size-4" />
          SSH access
        </CardTitle>
        <CardDescription>
          Private key for whitelisted VPS operations (runner install). Uses the
          system <code className="text-xs">ssh</code> client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Checking status…</p>
        ) : (
          <Badge variant={status?.configured ? "default" : "outline"}>
            {status?.configured ? "Configured" : "Not configured"}
          </Badge>
        )}

        <div className="space-y-2">
          <Label htmlFor="ssh-username">SSH username</Label>
          <Input
            id="ssh-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="root"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssh-key">Private key (PEM)</Label>
          <Textarea
            id="ssh-key"
            value={privateKey}
            onChange={(event) => setPrivateKey(event.target.value)}
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
            rows={5}
          />
        </div>

        {testMessage ? (
          <p className="text-muted-foreground text-sm">{testMessage}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveMutation.isPending || !privateKey.trim()}
            onClick={() => saveMutation.mutate()}
          >
            Save SSH key
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              testMutation.isPending || !status?.configured || !activeProfileId
            }
            onClick={() => testMutation.mutate()}
          >
            <PlugZap className="size-4" />
            Test SSH
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
