import { GitBranch, Server } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  SectionTabLink,
  SectionTabsNav,
} from "@/components/layout/section-tabs";

function parseProjectsTab(value: string | null): "vps" | "github" {
  return value === "github" ? "github" : "vps";
}

export function ProjectsTabsNav() {
  const [searchParams] = useSearchParams();
  const activeTab = parseProjectsTab(searchParams.get("tab"));

  return (
    <SectionTabsNav aria-label="Projects sections">
      <SectionTabLink
        to={{ pathname: "/", search: "" }}
        icon={Server}
        active={activeTab === "vps"}
      >
        VPS & Containers
      </SectionTabLink>
      <SectionTabLink
        to={{ pathname: "/", search: "?tab=github" }}
        icon={GitBranch}
        active={activeTab === "github"}
      >
        GitHub CI
      </SectionTabLink>
    </SectionTabsNav>
  );
}
