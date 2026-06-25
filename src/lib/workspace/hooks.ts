import { useQuery } from "@tanstack/react-query";

import { getCredentialsStatus } from "@/lib/hostinger/client";
import { getWorkspace } from "@/lib/workspace/client";
import {
  defaultWorkspaceConfig,
  type ConnectionProfile,
} from "@/lib/workspace/schemas";
import { resolveActiveProfile as resolveProfile } from "@/lib/workspace/sync-profile";

export { resolveActiveProfile } from "@/lib/workspace/sync-profile";
export type { ConnectionProfile };

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: getWorkspace,
    initialData: defaultWorkspaceConfig,
  });
}

export function useActiveProfile(): ConnectionProfile | null {
  const { data: workspace = defaultWorkspaceConfig } = useWorkspace();
  const { data: credentials } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  return resolveProfile(workspace, credentials?.virtualMachineId ?? null);
}
