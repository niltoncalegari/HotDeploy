import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearCredentials,
  clearDeploymentHistory,
  deployProject,
  getCredentialsStatus,
  getDeploymentHistory,
  getProject,
  getProjectContainers,
  getProjectLogs,
  listProjects,
  listVirtualMachines,
  parseHostingerError,
  previewListVirtualMachines,
  restartProject,
  saveCredentials,
  startProject,
  stopProject,
  testConnection,
  updateProject,
} from "./client";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockedInvoke = vi.mocked(invoke);

describe("hostinger client", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("invokes credential commands", async () => {
    mockedInvoke.mockResolvedValueOnce({ configured: true, virtualMachineId: 1 });
    await expect(getCredentialsStatus()).resolves.toEqual({
      configured: true,
      virtualMachineId: 1,
    });

    mockedInvoke.mockResolvedValueOnce(undefined);
    await saveCredentials("key", 1);
    expect(mockedInvoke).toHaveBeenCalledWith("save_credentials", {
      apiKey: "key",
      virtualMachineId: 1,
    });

    mockedInvoke.mockResolvedValueOnce(undefined);
    await clearCredentials();
    expect(mockedInvoke).toHaveBeenCalledWith("clear_credentials");
  });

  it("invokes list and connection commands", async () => {
    mockedInvoke.mockResolvedValueOnce([{ id: 1, hostname: "srv1", state: "running" }]);
    await listVirtualMachines();

    mockedInvoke.mockResolvedValueOnce([{ id: 2, hostname: "srv2", state: "running" }]);
    await previewListVirtualMachines("preview-key");
    expect(mockedInvoke).toHaveBeenCalledWith("preview_list_vms", {
      apiKey: "preview-key",
    });

    mockedInvoke.mockResolvedValueOnce({
      connected: true,
      message: "ok",
      projectCount: 2,
    });
    await testConnection(1658621);

    mockedInvoke.mockResolvedValueOnce([
      {
        name: "mflow-staging",
        state: "running",
        filePath: "/docker/mflow-staging/docker-compose.yaml",
        containers: [],
      },
    ]);
    const projects = await listProjects(1658621);
    expect(projects[0]?.name).toBe("mflow-staging");
  });

  it("invokes project detail commands", async () => {
    mockedInvoke.mockResolvedValueOnce({ content: "services: {}" });
    await getProject(1, "api");

    mockedInvoke.mockResolvedValueOnce([
      { name: "web", image: "nginx", health: "healthy", ports: ["80:80"] },
    ]);
    await getProjectContainers(1, "api");

    mockedInvoke.mockResolvedValueOnce([
      { service: "web", timestamp: "1", message: "ok" },
    ]);
    await getProjectLogs(1, "api");
  });

  it("invokes deploy and lifecycle commands", async () => {
    mockedInvoke.mockResolvedValue({ id: 1, name: "action", state: "sent" });

    await deployProject("project-id");
    await startProject(1, "api");
    await stopProject(1, "api");
    await restartProject(1, "api");
    await updateProject(1, "api");

    expect(mockedInvoke).toHaveBeenCalledWith("deploy_project", {
      deployProjectId: "project-id",
    });
    expect(mockedInvoke).toHaveBeenCalledWith("update_project", {
      virtualMachineId: 1,
      projectName: "api",
    });
  });

  it("invokes deployment history commands", async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    await getDeploymentHistory();

    mockedInvoke.mockResolvedValueOnce(undefined);
    await clearDeploymentHistory();
  });

  it("parses structured hostinger errors", () => {
    expect(parseHostingerError('{"code":"API_ERROR","message":"bad key"}')).toBe(
      "bad key",
    );
    expect(parseHostingerError("plain error")).toBe("plain error");
    expect(parseHostingerError({})).toBe("Unexpected error");
  });
});
