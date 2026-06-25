import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";

import { PageLayout } from "@/components/layout/PageLayout";
import { AppearanceCard } from "@/features/settings/AppearanceCard";
import { ConnectionProfilesCard } from "@/features/settings/ConnectionProfilesCard";
import { DeployProjectsCard } from "@/features/settings/DeployProjectsCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCredentialsStatus } from "@/lib/hostinger/client";
import { getWorkspace, getWorkspaceFilePath } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";

export function SettingsPage() {
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  const { data: workspace = defaultWorkspaceConfig } = useQuery({
    queryKey: ["workspace"],
    queryFn: getWorkspace,
  });

  const { data: workspaceFilePath } = useQuery({
    queryKey: ["workspace-file-path"],
    queryFn: getWorkspaceFilePath,
  });

  return (
    <PageLayout
      title="Settings"
      description="Manage appearance, VPS targets, deploy projects, and credentials."
    >
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <AppearanceCard />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" />
              API credentials
            </CardTitle>
            <CardDescription>
              Stored securely in your operating system keychain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {credentialsLoading ? (
              <p className="text-muted-foreground text-sm">Checking status…</p>
            ) : (
              <Badge variant={credentials?.configured ? "default" : "outline"}>
                {credentials?.configured ? "Configured" : "Not configured"}
              </Badge>
            )}
          </CardContent>
        </Card>
        <ConnectionProfilesCard workspace={workspace} />
        <DeployProjectsCard workspace={workspace} />
      </div>
      {workspaceFilePath ? (
        <p className="text-muted-foreground px-6 pb-6 text-xs">
          Workspace file: {workspaceFilePath}
        </p>
      ) : null}
    </PageLayout>
  );
}
