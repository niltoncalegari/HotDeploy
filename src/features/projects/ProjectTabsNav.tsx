import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

interface ProjectTabsNavProps {
  projectName: string;
}

export function ProjectTabsNav({ projectName }: ProjectTabsNavProps) {
  const encoded = encodeURIComponent(projectName);
  const base = `/projects/${encoded}`;
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <nav
      className="bg-muted inline-flex w-fit items-center gap-1 rounded-lg p-1"
      aria-label="Project sections"
    >
      <NavLink to={base} end className={tabClass}>
        Overview
      </NavLink>
      <NavLink to={`${base}/ci`} className={tabClass}>
        CI / Actions
      </NavLink>
    </nav>
  );
}
