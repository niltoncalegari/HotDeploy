import { useQuery } from "@tanstack/react-query";

import { PageLayout } from "@/components/layout/PageLayout";
import { AppearanceCard } from "@/features/settings/AppearanceCard";
import { ConnectionProfilesCard } from "@/features/settings/ConnectionProfilesCard";
import { CredentialsCard } from "@/features/settings/CredentialsCard";
import { DigitalOceanCredentialsCard } from "@/features/settings/DigitalOceanCredentialsCard";
import { DeployProjectsCard } from "@/features/settings/DeployProjectsCard";
import { HistoryCard } from "@/features/settings/HistoryCard";
import { getWorkspace, getWorkspaceFilePath } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";

export function SettingsPage() {
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
        <CredentialsCard />
        <DigitalOceanCredentialsCard />
        <ConnectionProfilesCard workspace={workspace} />
        <DeployProjectsCard workspace={workspace} />
        <HistoryCard />
      </div>
      {workspaceFilePath ? (
        <p className="text-muted-foreground px-6 pb-6 text-xs">
          Workspace file: {workspaceFilePath}
        </p>
      ) : null}
    </PageLayout>
  );
}
