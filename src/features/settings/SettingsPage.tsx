import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  GitBranch,
  History,
  Palette,
  Server,
} from "lucide-react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppearanceCard } from "@/features/settings/AppearanceCard";
import { ConnectionProfilesCard } from "@/features/settings/ConnectionProfilesCard";
import { CredentialsCard } from "@/features/settings/CredentialsCard";
import { DigitalOceanCredentialsCard } from "@/features/settings/DigitalOceanCredentialsCard";
import { DeployProjectsCard } from "@/features/settings/DeployProjectsCard";
import { GitHubCredentialsCard } from "@/features/settings/GitHubCredentialsCard";
import { HistoryCard } from "@/features/settings/HistoryCard";
import { SshCredentialsCard } from "@/features/settings/SshCredentialsCard";
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
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/onboarding">Re-run setup wizard</Link>
        </Button>
      }
    >
      <div className="p-6">
        <Tabs defaultValue="providers" className="gap-6">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="general" className="gap-1.5">
              <Palette className="size-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-1.5">
              <Server className="size-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="github" className="gap-1.5">
              <GitBranch className="size-4" />
              GitHub & CI
            </TabsTrigger>
            <TabsTrigger value="deploy" className="gap-1.5">
              <FolderKanban className="size-4" />
              Deploy projects
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="size-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0">
            <div className="grid max-w-xl gap-4">
              <AppearanceCard />
              {workspaceFilePath ? (
                <p className="text-muted-foreground text-xs">
                  Workspace file: {workspaceFilePath}
                </p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <CredentialsCard />
              <DigitalOceanCredentialsCard />
              <ConnectionProfilesCard workspace={workspace} />
            </div>
          </TabsContent>

          <TabsContent value="github" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <GitHubCredentialsCard />
              <SshCredentialsCard workspace={workspace} />
            </div>
          </TabsContent>

          <TabsContent value="deploy" className="mt-0">
            <div className="max-w-3xl">
              <DeployProjectsCard workspace={workspace} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="max-w-3xl">
              <HistoryCard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
