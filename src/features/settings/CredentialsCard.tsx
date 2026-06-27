import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, PlugZap, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
  clearCredentials,
  getCredentialsStatus,
  listVirtualMachines,
  parseHostingerError,
  previewListVirtualMachines,
  saveCredentials,
  testConnection,
  type VirtualMachine,
} from "@/lib/hostinger/client";
import { saveWorkspace } from "@/lib/workspace/client";
import { useWorkspace } from "@/lib/workspace/hooks";
import {
  findProfileLabelForVm,
  syncConnectionProfileFromVm,
} from "@/lib/workspace/sync-profile";

export function CredentialsCard() {
  const queryClient = useQueryClient();
  const { data: workspace } = useWorkspace();
  const [apiKey, setApiKey] = useState("");
  const [manualVmId, setManualVmId] = useState("");
  const [selectedVmId, setSelectedVmId] = useState<number | null>(null);
  const [previewVms, setPreviewVms] = useState<VirtualMachine[]>([]);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  const {
    data: savedVirtualMachines = [],
    isFetching: savedVmsLoading,
    refetch: refetchSavedVms,
  } = useQuery({
    queryKey: ["virtual-machines", "hostinger"],
    queryFn: () => listVirtualMachines("hostinger"),
    enabled: credentials?.configured ?? false,
    retry: false,
  });

  const virtualMachines = credentials?.configured
    ? savedVirtualMachines
    : previewVms;
  const vmsLoading = credentials?.configured ? savedVmsLoading : false;
  const canLoadVms =
    Boolean(apiKey.trim()) || Boolean(credentials?.configured);

  const resolvedVmId =
    selectedVmId ??
    (manualVmId ? Number(manualVmId) : null) ??
    credentials?.virtualMachineId ??
    null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedVmId || Number.isNaN(resolvedVmId)) {
        throw new Error("Enter or select a VPS ID before saving.");
      }
      if (!apiKey.trim() && !credentials?.configured) {
        throw new Error("API key is required.");
      }
      await saveCredentials(apiKey.trim(), resolvedVmId);
    },
    onSuccess: async () => {
      if (apiKey.trim()) {
        setApiKey("");
      }
      setPreviewVms([]);
      setConnectionMessage(null);

      if (workspace && resolvedVmId) {
        try {
          const label = findProfileLabelForVm(resolvedVmId, virtualMachines);
          const nextWorkspace = syncConnectionProfileFromVm(
            workspace,
            resolvedVmId,
            label,
          );
          await saveWorkspace(nextWorkspace);
          queryClient.setQueryData(["workspace"], nextWorkspace);
        } catch (error) {
          toast.warning(
            `Credentials saved, but connection profile sync failed: ${parseHostingerError(error)}`,
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["credentials-status"] });
      await refetchSavedVms();
      toast.success("Credentials saved.");
    },
    onError: (error) => {
      toast.error(parseHostingerError(error));
    },
  });

  const loadVmsMutation = useMutation({
    mutationFn: async () => {
      if (credentials?.configured) {
        return refetchSavedVms().then((result) => result.data ?? []);
      }
      if (!apiKey.trim()) {
        throw new Error("Paste your API key to load the VPS list.");
      }
      return previewListVirtualMachines(apiKey.trim(), "hostinger");
    },
    onSuccess: (vms) => {
      if (!credentials?.configured) {
        setPreviewVms(vms);
      }
      toast.success(`Loaded ${vms.length} VPS instance${vms.length === 1 ? "" : "s"}.`);
    },
    onError: (error) => {
      toast.error(parseHostingerError(error));
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearCredentials,
    onSuccess: async () => {
      setApiKey("");
      setSelectedVmId(null);
      setManualVmId("");
      setPreviewVms([]);
      setConnectionMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["credentials-status"] });
      await queryClient.removeQueries({ queryKey: ["virtual-machines"] });
      toast.success("Credentials cleared.");
    },
    onError: (error) => {
      toast.error(parseHostingerError(error));
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedVmId || Number.isNaN(resolvedVmId)) {
        throw new Error("Enter or select a VPS to test.");
      }
      return testConnection(resolvedVmId);
    },
    onSuccess: (result) => {
      setConnectionMessage(result.message);
      toast.success(`Connected (${result.projectCount} Docker projects).`);
    },
    onError: (error) => {
      setConnectionMessage(parseHostingerError(error));
      toast.error(parseHostingerError(error));
    },
  });

  const connected =
    credentials?.configured &&
    connectionMessage?.toLowerCase().includes("connected");

  const selectValue = selectedVmId ?? credentials?.virtualMachineId ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4" />
          API credentials
        </CardTitle>
        <CardDescription>
          Stored locally in the app config folder (not the macOS Keychain).
          Saving also syncs the active connection profile VM ID.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credentialsLoading ? (
          <p className="text-muted-foreground text-sm">Checking status…</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={credentials?.configured ? "default" : "outline"}>
              {credentials?.configured ? "Configured" : "Not configured"}
            </Badge>
            {connected ? (
              <Badge variant="secondary">Connected</Badge>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="api-key">Hostinger API key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={credentials?.configured ? "••••••••" : "Paste API key"}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vm-select">VPS from API</Label>
            <select
              id="vm-select"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={selectValue}
              onChange={(event) => {
                const value = event.target.value
                  ? Number(event.target.value)
                  : null;
                setSelectedVmId(value);
                if (value) {
                  setManualVmId(String(value));
                }
              }}
              disabled={!canLoadVms || virtualMachines.length === 0}
            >
              <option value="">
                {vmsLoading || loadVmsMutation.isPending
                  ? "Loading VPS list…"
                  : virtualMachines.length === 0
                    ? "Load VPS list first"
                    : "Select VPS"}
              </option>
              {virtualMachines.map((vm) => (
                <option key={vm.id} value={vm.id}>
                  {vm.hostname} ({vm.state})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-vm-id">Or VM ID</Label>
            <Input
              id="manual-vm-id"
              type="number"
              min={1}
              value={manualVmId}
              onChange={(event) => {
                setManualVmId(event.target.value);
                setSelectedVmId(null);
              }}
              placeholder={
                credentials?.virtualMachineId
                  ? String(credentials.virtualMachineId)
                  : "1658621"
              }
            />
          </div>
        </div>

        {connectionMessage ? (
          <p className="text-muted-foreground text-sm">{connectionMessage}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            Save credentials
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => loadVmsMutation.mutate()}
            disabled={!canLoadVms || loadVmsMutation.isPending || vmsLoading}
          >
            <RefreshCw className="size-4" />
            Load VPS list
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={
              testMutation.isPending || !resolvedVmId || !credentials?.configured
            }
          >
            <PlugZap className="size-4" />
            Test connection
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || !credentials?.configured}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
