import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getWorkspace,
  getWorkspaceFilePath,
  saveWorkspace,
} from "./client";
import { defaultWorkspaceConfig } from "./schemas";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockedInvoke = vi.mocked(invoke);

describe("workspace client", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("loads workspace from tauri", async () => {
    mockedInvoke.mockResolvedValueOnce(defaultWorkspaceConfig);

    const workspace = await getWorkspace();

    expect(workspace.version).toBe(1);
    expect(mockedInvoke).toHaveBeenCalledWith("get_workspace");
  });

  it("saves workspace via tauri", async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);

    await saveWorkspace(defaultWorkspaceConfig);

    expect(mockedInvoke).toHaveBeenCalledWith("save_workspace_command", {
      config: defaultWorkspaceConfig,
    });
  });

  it("reads workspace file path", async () => {
    mockedInvoke.mockResolvedValueOnce("/tmp/workspace.json");

    const path = await getWorkspaceFilePath();

    expect(path).toContain("workspace.json");
  });
});
