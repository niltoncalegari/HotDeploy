import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { useWorkspace } from "@/lib/workspace/hooks";

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data: workspace, isLoading } = useWorkspace();

  if (isLoading) {
    return null;
  }

  if (!workspace.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingWizard />} />
      <Route
        element={
          <OnboardingGate>
            <AppShell />
          </OnboardingGate>
        }
      >
        <Route index element={<ProjectsPage />} />
        <Route path="projects/:projectName" element={<ProjectDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
