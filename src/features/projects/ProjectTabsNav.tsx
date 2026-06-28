import { GitBranch, LayoutDashboard } from "lucide-react";
import { useLocation } from "react-router-dom";

import {
  SectionTabLink,
  SectionTabsNav,
} from "@/components/layout/section-tabs";

interface ProjectTabsNavProps {
  projectName: string;
}

export function ProjectTabsNav({ projectName }: ProjectTabsNavProps) {
  const location = useLocation();
  const encoded = encodeURIComponent(projectName);
  const base = `/projects/${encoded}`;
  const onCiTab = location.pathname.endsWith("/ci");

  return (
    <SectionTabsNav aria-label="Project sections">
      <SectionTabLink to={base} icon={LayoutDashboard} active={!onCiTab}>
        Overview
      </SectionTabLink>
      <SectionTabLink to={`${base}/ci`} icon={GitBranch} active={onCiTab}>
        CI / Actions
      </SectionTabLink>
    </SectionTabsNav>
  );
}
