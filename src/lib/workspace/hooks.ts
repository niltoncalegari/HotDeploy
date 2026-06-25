import { useQuery } from "@tanstack/react-query";

import { getWorkspace } from "@/lib/workspace/client";
import {
  defaultWorkspaceConfig,
  type ConnectionProfile,
  type WorkspaceConfig,
} from "@/lib/workspace/schemas";

export function resolveActiveProfile(
  workspace: WorkspaceConfig,
): ConnectionProfile | null {
  if (workspace.connectionProfiles.length === 0) {
    return null;
  }

  if (workspace.activeConnectionProfileId) {
    const active = workspace.connectionProfiles.find(
      (profile) => profile.id === workspace.activeConnectionProfileId,
    );
    if (active) {
      return active;
    }
  }

  return workspace.connectionProfiles[0] ?? null;
}

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: getWorkspace,
    initialData: defaultWorkspaceConfig,
  });
}

export function useActiveProfile() {
  const { data: workspace = defaultWorkspaceConfig } = useWorkspace();
  return resolveActiveProfile(workspace);
}
