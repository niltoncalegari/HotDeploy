import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
