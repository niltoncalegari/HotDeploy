import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageLayout({
  title,
  description,
  actions,
  children,
}: PageLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Header title={title} description={description} actions={actions} />
      <div className="page-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
