import { Link, useSearchParams } from "react-router-dom";
import { History, Rocket } from "lucide-react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { GitHubProjectsPanel } from "@/features/github/GitHubProjectsPanel";
import { ProjectsTabsNav } from "@/features/projects/ProjectsTabsNav";
import {
  useDeployProjectFlow,
  VpsProjectsPanel,
} from "@/features/projects/VpsProjectsPanel";

function parseProjectsTab(value: string | null): "vps" | "github" {
  return value === "github" ? "github" : "vps";
}

export function ProjectsPage() {
  const [searchParams] = useSearchParams();
  const activeTab = parseProjectsTab(searchParams.get("tab"));
  const { localProjects, openDeployFlow, deployDialogs, startDeploy } =
    useDeployProjectFlow();

  return (
    <PageLayout
      title="Projects"
      description={
        activeTab === "github"
          ? "GitHub Actions workflows and CI pipelines for linked repositories."
          : "Docker Compose projects running on your connected VPS."
      }
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/settings?tab=history">
              <History className="size-4" />
              History
            </Link>
          </Button>
          {activeTab === "vps" ? (
            <Button disabled={localProjects.length === 0} onClick={openDeployFlow}>
              <Rocket className="size-4" />
              Deploy project
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        <ProjectsTabsNav />
        {activeTab === "github" ? (
          <GitHubProjectsPanel />
        ) : (
          <VpsProjectsPanel onDeployProject={startDeploy} />
        )}
      </div>
      {deployDialogs}
    </PageLayout>
  );
}
