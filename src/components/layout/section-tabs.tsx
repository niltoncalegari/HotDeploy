import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, type To } from "react-router-dom";

import { cn } from "@/lib/utils";

/** Shared pill tab bar — used by page section nav and shadcn TabsList. */
export const sectionTabsListClassName =
  "bg-muted text-muted-foreground inline-flex h-auto w-fit flex-wrap items-center justify-start rounded-lg p-[3px]";

const sectionTabTriggerBaseClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

export function sectionTabTriggerClassName(isActive: boolean): string {
  return cn(
    sectionTabTriggerBaseClassName,
    isActive
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground",
  );
}

/** shadcn TabsTrigger uses data-[state=active] — keep in sync with sectionTabTriggerClassName. */
export const sectionTabTriggerDataClassName = cn(
  sectionTabTriggerBaseClassName,
  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
);

interface SectionTabsNavProps {
  "aria-label": string;
  children: ReactNode;
  className?: string;
}

export function SectionTabsNav({
  children,
  className,
  "aria-label": ariaLabel,
}: SectionTabsNavProps) {
  return (
    <nav className={cn(sectionTabsListClassName, className)} aria-label={ariaLabel}>
      {children}
    </nav>
  );
}

interface SectionTabLinkProps {
  to: To;
  icon?: LucideIcon;
  active: boolean;
  children: ReactNode;
}

export function SectionTabLink({
  to,
  icon: Icon,
  active,
  children,
}: SectionTabLinkProps) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={sectionTabTriggerClassName(active)}
    >
      {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}
