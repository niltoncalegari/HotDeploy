import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  GitBranch,
  History,
  Palette,
  Server,
} from "lucide-react";

import { PageLayout } from "@/components/layout/PageLayout";
import {
  SectionTabLink,
  SectionTabsNav,
} from "@/components/layout/section-tabs";
import { Button } from "@/components/ui/button";
import { AppearanceCard } from "@/features/settings/AppearanceCard";
import { DiagnosticsCard } from "@/features/settings/DiagnosticsCard";
import { ConnectionProfilesCard } from "@/features/settings/ConnectionProfilesCard";
import { CredentialsCard } from "@/features/settings/CredentialsCard";
import { DigitalOceanCredentialsCard } from "@/features/settings/DigitalOceanCredentialsCard";
import { DeployProjectsCard } from "@/features/settings/DeployProjectsCard";
import { GitHubCredentialsCard } from "@/features/settings/GitHubCredentialsCard";
import { HistoryCard } from "@/features/settings/HistoryCard";
import { SshCredentialsCard } from "@/features/settings/SshCredentialsCard";
import { getWorkspace, getWorkspaceFilePath } from "@/lib/workspace/client";
import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";

const SETTINGS_TABS = [
  "general",
  "providers",
  "github",
  "deploy",
  "history",
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

function parseSettingsTab(value: string | null): SettingsTab {
  if (value && SETTINGS_TABS.includes(value as SettingsTab)) {
    return value as SettingsTab;
  }
  return "providers";
}

export function SettingsPage() {
  const [searchParams] = useSearchParams();
  const activeTab = parseSettingsTab(searchParams.get("tab"));

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
      <div className="flex flex-col gap-6 p-6">
        <SectionTabsNav aria-label="Settings sections">
          <SectionTabLink
            to="/settings?tab=general"
            icon={Palette}
            active={activeTab === "general"}
          >
            General
          </SectionTabLink>
          <SectionTabLink
            to="/settings?tab=providers"
            icon={Server}
            active={activeTab === "providers"}
          >
            Providers
          </SectionTabLink>
          <SectionTabLink
            to="/settings?tab=github"
            icon={GitBranch}
            active={activeTab === "github"}
          >
            GitHub & CI
          </SectionTabLink>
          <SectionTabLink
            to="/settings?tab=deploy"
            icon={FolderKanban}
            active={activeTab === "deploy"}
          >
            Deploy projects
          </SectionTabLink>
          <SectionTabLink
            to="/settings?tab=history"
            icon={History}
            active={activeTab === "history"}
          >
            History
          </SectionTabLink>
        </SectionTabsNav>

        {activeTab === "general" ? (
          <div className="grid max-w-3xl gap-4">
              <AppearanceCard />
              <DiagnosticsCard />
            {workspaceFilePath ? (
              <p className="text-muted-foreground text-xs">
                Workspace file: {workspaceFilePath}
              </p>
            ) : null}
          </div>
        ) : null}

        {activeTab === "providers" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <CredentialsCard />
            <DigitalOceanCredentialsCard />
            <ConnectionProfilesCard workspace={workspace} />
          </div>
        ) : null}

        {activeTab === "github" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <GitHubCredentialsCard />
            <SshCredentialsCard workspace={workspace} />
          </div>
        ) : null}

        {activeTab === "deploy" ? (
          <div className="max-w-3xl">
            <DeployProjectsCard
              key={searchParams.get("dockerProject") ?? "default"}
              workspace={workspace}
            />
          </div>
        ) : null}

        {activeTab === "history" ? (
          <div className="max-w-3xl">
            <HistoryCard />
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
