import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Server, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveWorkspace } from "@/lib/workspace/client";
import {
  createConnectionProfile,
  type ConnectionProfile,
  type WorkspaceConfig,
} from "@/lib/workspace/schemas";

interface ConnectionProfilesCardProps {
  workspace: WorkspaceConfig;
}

export function ConnectionProfilesCard({
  workspace,
}: ConnectionProfilesCardProps) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [virtualMachineId, setVirtualMachineId] = useState("");

  const saveMutation = useMutation({
    mutationFn: saveWorkspace,
    onError: () => {
      toast.error("Failed to save connection profile.");
    },
  });

  const persist = (nextProfiles: ConnectionProfile[], activeId?: string) => {
    const nextConfig: WorkspaceConfig = {
      ...workspace,
      connectionProfiles: nextProfiles,
      activeConnectionProfileId:
        activeId ?? workspace.activeConnectionProfileId,
    };

    queryClient.setQueryData(["workspace"], nextConfig);
    saveMutation.mutate(nextConfig);
  };

  const handleAdd = () => {
    const vmId = Number.parseInt(virtualMachineId, 10);
    if (!label.trim() || Number.isNaN(vmId) || vmId <= 0) {
      toast.error("Enter a label and a valid virtual machine ID.");
      return;
    }

    const profile = createConnectionProfile(label.trim(), vmId);
    const nextProfiles = [...workspace.connectionProfiles, profile];

    persist(nextProfiles, workspace.activeConnectionProfileId ?? profile.id);
    setLabel("");
    setVirtualMachineId("");
    toast.success("Connection profile added.");
  };

  const handleRemove = (profileId: string) => {
    const nextProfiles = workspace.connectionProfiles.filter(
      (profile) => profile.id !== profileId,
    );
    const deployProjects = workspace.deployProjects.filter(
      (project) => project.connectionProfileId !== profileId,
    );
    const activeId =
      workspace.activeConnectionProfileId === profileId
        ? (nextProfiles[0]?.id ?? undefined)
        : workspace.activeConnectionProfileId;

    const nextConfig: WorkspaceConfig = {
      ...workspace,
      connectionProfiles: nextProfiles,
      activeConnectionProfileId: activeId,
      deployProjects,
    };

    queryClient.setQueryData(["workspace"], nextConfig);
    saveMutation.mutate(nextConfig);
    toast.success("Connection profile removed.");
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="size-4" />
          Connection profiles
        </CardTitle>
        <CardDescription>
          Pair a Hostinger VPS target with a label. API keys stay in the OS
          keychain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {workspace.connectionProfiles.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No VPS targets configured yet. Add one below.
          </p>
        ) : (
          <ul className="space-y-3">
            {workspace.connectionProfiles.map((profile) => (
              <li
                key={profile.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{profile.label}</p>
                  <p className="text-muted-foreground text-sm">
                    VM ID {profile.virtualMachineId} · {profile.provider}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(profile.id)}
                  aria-label={`Remove ${profile.label}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="profile-label">Label</Label>
            <Input
              id="profile-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Production VPS"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-vm-id">Virtual machine ID</Label>
            <Input
              id="profile-vm-id"
              inputMode="numeric"
              value={virtualMachineId}
              onChange={(event) => setVirtualMachineId(event.target.value)}
              placeholder="123456"
            />
          </div>
          <Button type="button" onClick={handleAdd} disabled={saveMutation.isPending}>
            <Plus className="size-4" />
            Add profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
