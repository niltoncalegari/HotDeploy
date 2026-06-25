import { describe, expect, it } from "vitest";

import { defaultWorkspaceConfig } from "@/lib/workspace/schemas";
import {
  findProfileLabelForVm,
  resolveActiveProfile,
  syncConnectionProfileFromVm,
} from "@/lib/workspace/sync-profile";

describe("syncConnectionProfileFromVm", () => {
  it("creates a profile when none exist", () => {
    const next = syncConnectionProfileFromVm(defaultWorkspaceConfig, 1658621, "srv1");

    expect(next.connectionProfiles).toHaveLength(1);
    expect(next.connectionProfiles[0]?.virtualMachineId).toBe(1658621);
    expect(next.connectionProfiles[0]?.label).toBe("srv1");
    expect(next.activeConnectionProfileId).toBe(next.connectionProfiles[0]?.id);
  });

  it("updates the active profile VM ID", () => {
    const workspace = syncConnectionProfileFromVm(defaultWorkspaceConfig, 1, "first");
    const next = syncConnectionProfileFromVm(
      {
        ...workspace,
        connectionProfiles: [
          ...workspace.connectionProfiles,
          {
            id: "second",
            label: "Second",
            provider: "hostinger",
            virtualMachineId: 2,
          },
        ],
        activeConnectionProfileId: "second",
      },
      99,
      "updated",
    );

    expect(next.connectionProfiles.find((profile) => profile.id === "second")).toMatchObject({
      virtualMachineId: 99,
      label: "updated",
    });
  });
});

describe("resolveActiveProfile", () => {
  it("returns null when no profiles or fallback exist", () => {
    expect(resolveActiveProfile(defaultWorkspaceConfig)).toBeNull();
  });

  it("falls back to keychain VM when profiles are missing", () => {
    const profile = resolveActiveProfile(defaultWorkspaceConfig, 1658621);

    expect(profile).toMatchObject({
      label: "Default VPS",
      virtualMachineId: 1658621,
    });
  });
});

describe("findProfileLabelForVm", () => {
  it("returns hostname when VM is listed", () => {
    expect(
      findProfileLabelForVm(1658621, [
        { id: 1658621, hostname: "srv1658621.hstgr.cloud" },
      ]),
    ).toBe("srv1658621.hstgr.cloud");
  });
});
