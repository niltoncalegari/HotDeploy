import { Flame, FolderKanban, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

import { VersionChangelogDialog } from "@/components/layout/VersionChangelogDialog";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Projects", icon: FolderKanban },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Flame className="size-6 text-flame-500" aria-hidden />
        <div>
          <p className="text-sm font-semibold tracking-tight">HotDeploy</p>
          <p className="text-muted-foreground text-xs">Docker control panel</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )
            }
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="text-muted-foreground border-t px-4 py-3 text-xs">
        <VersionChangelogDialog />
      </div>
    </aside>
  );
}
