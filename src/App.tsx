import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ProjectsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
