import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Server } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <Select value={activeId} onValueChange={handleChange}>
        <SelectTrigger id="vps-switcher" size="sm" className="min-w-[12rem]">
          <SelectValue placeholder="Select VPS" />
        </SelectTrigger>
        <SelectContent>
          {workspace.connectionProfiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.label} (VM {profile.virtualMachineId})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
