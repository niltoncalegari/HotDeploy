import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Server, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCredentialsStatus } from "@/lib/hostinger/client";
import { saveWorkspace } from "@/lib/workspace/client";
import {
  createConnectionProfile,
  providerIdSchema,
  type ConnectionProfile,
  type ProviderId,
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
  const [provider, setProvider] = useState<ProviderId>("hostinger");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: credentials } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

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

    const profile = createConnectionProfile(label.trim(), vmId, provider);
    const nextProfiles = [...workspace.connectionProfiles, profile];

    persist(nextProfiles, workspace.activeConnectionProfileId ?? profile.id);
    setLabel("");
    setVirtualMachineId("");
    toast.success("Connection profile added.");
  };

  const confirmRemove = () => {
    if (!pendingDeleteId) {
      return;
    }
    const profileId = pendingDeleteId;
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
    setPendingDeleteId(null);
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
          Pair a VPS target from a provider with a label. API keys stay in a
          local credentials file managed by the desktop app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {workspace.connectionProfiles.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {credentials?.configured
              ? `No saved VPS profile yet. HotDeploy will create one from VM ${credentials.virtualMachineId} automatically, or add one manually below.`
              : "No VPS targets configured yet. Save your provider API key above, or add a profile manually."}
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
                  onClick={() => setPendingDeleteId(profile.id)}
                  aria-label={`Remove ${profile.label}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_160px_160px_auto] md:items-end">
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
          <div className="space-y-2">
            <Label htmlFor="profile-provider">Provider</Label>
            <Select
              value={provider}
              onValueChange={(value) => {
                const parsed = providerIdSchema.safeParse(value);
                if (parsed.success) {
                  setProvider(parsed.data);
                }
              }}
            >
              <SelectTrigger id="profile-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hostinger">Hostinger</SelectItem>
                <SelectItem value="digitalocean">DigitalOcean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={handleAdd} disabled={saveMutation.isPending}>
            <Plus className="size-4" />
            Add profile
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove connection profile?</DialogTitle>
            <DialogDescription>
              Deploy projects linked to this profile will also be removed from
              the workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
