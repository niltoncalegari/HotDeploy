import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import {
  getGitHubAppConfig,
  getGitHubAuthMethod,
  getGitHubStatus,
  getSshStatus,
} from "@/lib/github/client";
import { getCredentialsStatus } from "@/lib/hostinger/client";
import { getWorkspace } from "@/lib/workspace/client";
import { useEnsureConnectionProfileSynced } from "@/lib/workspace/useEnsureConnectionProfileSynced";

/**
 * Reloads persisted workspace and credential state from disk on every app start
 * (including after a desktop update).
 */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  useEnsureConnectionProfileSynced();

  useEffect(() => {
    void Promise.all([
      queryClient.fetchQuery({ queryKey: ["workspace"], queryFn: getWorkspace }),
      queryClient.fetchQuery({
        queryKey: ["credentials-status"],
        queryFn: getCredentialsStatus,
      }),
      queryClient.fetchQuery({ queryKey: ["github-status"], queryFn: getGitHubStatus }),
      queryClient.fetchQuery({
        queryKey: ["github-auth-method"],
        queryFn: getGitHubAuthMethod,
      }),
      queryClient.fetchQuery({
        queryKey: ["github-app-config"],
        queryFn: getGitHubAppConfig,
      }),
      queryClient.fetchQuery({ queryKey: ["ssh-status"], queryFn: getSshStatus }),
    ]);
  }, [queryClient]);

  return children;
}
