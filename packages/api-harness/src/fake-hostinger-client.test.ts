import { describe, expect, it } from "vitest";

import { FakeHostingerClient } from "./fake-hostinger-client";
import { sampleProjects } from "./fixtures/projects";

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
});
