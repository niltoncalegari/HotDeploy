import {
  createConnectionProfile,
  type ConnectionProfile,
  type WorkspaceConfig,
} from "@/lib/workspace/schemas";

export function syncConnectionProfileFromVm(
  workspace: WorkspaceConfig,
  virtualMachineId: number,
  label?: string,
): WorkspaceConfig {
  const profileLabel = label ?? `VPS ${virtualMachineId}`;

  if (workspace.connectionProfiles.length === 0) {
    const profile = createConnectionProfile(profileLabel, virtualMachineId);
    return {
      ...workspace,
      connectionProfiles: [profile],
      activeConnectionProfileId: profile.id,
    };
  }

  const activeId =
    workspace.activeConnectionProfileId ??
    workspace.connectionProfiles[0]?.id;

  const nextProfiles = workspace.connectionProfiles.map((profile) => {
    if (profile.id !== activeId) {
      return profile;
    }

    return {
      ...profile,
      virtualMachineId,
      label: label ?? profile.label,
    };
  });

  return {
    ...workspace,
    connectionProfiles: nextProfiles,
    activeConnectionProfileId: activeId,
  };
}

export function findProfileLabelForVm(
  virtualMachineId: number,
  virtualMachines: Array<{ id: number; hostname: string }>,
): string | undefined {
  const match = virtualMachines.find((vm) => vm.id === virtualMachineId);
  return match?.hostname;
}

export function resolveActiveProfile(
  workspace: WorkspaceConfig,
  fallbackVmId?: number | null,
): ConnectionProfile | null {
  if (workspace.connectionProfiles.length > 0) {
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

  if (fallbackVmId) {
    return {
      id: "__keychain-default__",
      label: "Default VPS",
      provider: "hostinger",
      virtualMachineId: fallbackVmId,
    };
  }

  return null;
}
