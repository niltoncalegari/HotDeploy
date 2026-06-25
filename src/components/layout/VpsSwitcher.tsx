import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Server } from "lucide-react";

import { saveWorkspace } from "@/lib/workspace/client";
import { useWorkspace } from "@/lib/workspace/hooks";
import type { WorkspaceConfig } from "@/lib/workspace/schemas";

export function VpsSwitcher() {
  const queryClient = useQueryClient();
  const { data: workspace } = useWorkspace();

  const saveMutation = useMutation({
    mutationFn: saveWorkspace,
  });

  if (!workspace || workspace.connectionProfiles.length === 0) {
    return null;
  }

  const activeId =
    workspace.activeConnectionProfileId ?? workspace.connectionProfiles[0]?.id;

  const handleChange = (profileId: string) => {
    const nextConfig: WorkspaceConfig = {
      ...workspace,
      activeConnectionProfileId: profileId,
    };
    queryClient.setQueryData(["workspace"], nextConfig);
    saveMutation.mutate(nextConfig);
  };

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b bg-background">
      <Server className="text-muted-foreground size-4" />
      <label htmlFor="vps-switcher" className="text-muted-foreground text-sm">
        Active VPS
      </label>
      <select
        id="vps-switcher"
        className="border-input bg-background h-8 rounded-md border px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        value={activeId}
        onChange={(event) => handleChange(event.target.value)}
      >
        {workspace.connectionProfiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.label} (VM {profile.virtualMachineId})
          </option>
        ))}
      </select>
    </div>
  );
}
