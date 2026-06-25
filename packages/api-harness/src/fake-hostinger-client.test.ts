import { describe, expect, it } from "vitest";

import { FakeHostingerClient } from "./fake-hostinger-client";
import { sampleProjects, sampleVirtualMachines } from "./fixtures/projects";

describe("FakeHostingerClient", () => {
  it("records calls and returns schema-valid project list", async () => {
    const client = new FakeHostingerClient();

    const projects = await client.listProjects(1001);

    expect(projects).toEqual(sampleProjects);
    expect(client.callLog).toEqual([
      { method: "listProjects", virtualMachineId: 1001 },
    ]);
  });

  it("returns deploy response with requested project name", async () => {
    const client = new FakeHostingerClient();

    const response = await client.deployProject({
      virtualMachineId: 1001,
      projectName: "billing",
      content: "services:\n  web:\n    image: nginx",
    });

    expect(response.name).toBe("billing");
    expect(client.callLog.at(-1)?.method).toBe("deployProject");
  });

  it("lists virtual machines from fixtures", async () => {
    const client = new FakeHostingerClient();

    const vms = await client.listVirtualMachines();

    expect(vms).toEqual(sampleVirtualMachines);
  });

  it("returns connection test result", async () => {
    const client = new FakeHostingerClient();

    const result = await client.testConnection(1001);

    expect(result.connected).toBe(true);
    expect(result.projectCount).toBe(sampleProjects.length);
  });

  it("returns lifecycle action result", async () => {
    const client = new FakeHostingerClient();

    const result = await client.lifecycle(1001, "api-gateway", "restart");

    expect(result.state).toBe("success");
    expect(client.callLog.at(-1)).toEqual({
      method: "lifecycle",
      virtualMachineId: 1001,
      projectName: "api-gateway",
      action: "restart",
    });
  });

  it("returns project content and containers", async () => {
    const client = new FakeHostingerClient();

    const content = await client.getProject(1001, "api-gateway");
    const containers = await client.getProjectContainers(1001, "api-gateway");
    const logs = await client.getProjectLogs(1001, "api-gateway");

    expect(content.content).toContain("api-gateway");
    expect(containers.length).toBeGreaterThan(0);
    expect(logs[0]?.service).toBe("web");
  });
});
