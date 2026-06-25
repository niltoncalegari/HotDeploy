import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, type ReactNode } from "react";

import { getWorkspace, saveWorkspace } from "@/lib/workspace/client";
import {
  defaultWorkspaceConfig,
  type ThemeMode,
  type WorkspaceConfig,
} from "@/lib/workspace/schemas";
import { applyThemeClass } from "@/lib/workspace/theme";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace"],
    queryFn: getWorkspace,
    placeholderData: defaultWorkspaceConfig,
  });

  const saveMutation = useMutation({
    mutationFn: saveWorkspace,
  });

  const theme = workspace?.preferences.theme ?? "light";

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const setTheme = (nextTheme: ThemeMode) => {
    const current = queryClient.getQueryData<WorkspaceConfig>(["workspace"]);
    const base = current ?? defaultWorkspaceConfig;

    const nextConfig: WorkspaceConfig = {
      ...base,
      preferences: {
        ...base.preferences,
        theme: nextTheme,
      },
    };

    queryClient.setQueryData(["workspace"], nextConfig);
    applyThemeClass(nextTheme);
    saveMutation.mutate(nextConfig);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
