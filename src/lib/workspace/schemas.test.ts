import { describe, expect, it } from "vitest";

import {
  connectionProfileSchema,
  createConnectionProfile,
  createDeployProjectConfig,
  defaultWorkspaceConfig,
  deployProjectConfigSchema,
  workspaceConfigSchema,
} from "@/lib/workspace/schemas";

// As a developer, I want workspace JSON validated so that corrupt config fails fast.
describe("workspaceConfigSchema", () => {
  it("accepts the default workspace shape", () => {
    expect(workspaceConfigSchema.parse(defaultWorkspaceConfig)).toEqual(
      defaultWorkspaceConfig,
    );
  });

  it("accepts connection profiles and deploy projects", () => {
    const profile = connectionProfileSchema.parse({
      id: "profile-1",
      label: "Production",
      provider: "hostinger",
      virtualMachineId: 99,
    });

    const project = deployProjectConfigSchema.parse({
      id: "project-1",
      name: "API",
      connectionProfileId: profile.id,
      dockerProjectName: "api",
      deploySource: {
        type: "local",
        composeFilePath: "/srv/api/docker-compose.yaml",
      },
      environmentProfile: "NODE_ENV=production",
    });

    expect(
      workspaceConfigSchema.parse({
        ...defaultWorkspaceConfig,
        connectionProfiles: [profile],
        activeConnectionProfileId: profile.id,
        deployProjects: [project],
      }),
    ).toMatchObject({
      connectionProfiles: [profile],
      deployProjects: [project],
    });
  });

  it("accepts digitalocean connection profiles", () => {
    const profile = connectionProfileSchema.parse({
      id: "profile-do",
      label: "DO staging",
      provider: "digitalocean",
      virtualMachineId: 42,
    });

    expect(profile.provider).toBe("digitalocean");
  });

  it("creates connection profiles and deploy projects with ids", () => {
    const profile = createConnectionProfile("Staging", 12);
    expect(profile.id).toBeTruthy();
    expect(profile.provider).toBe("hostinger");

    const project = createDeployProjectConfig({
      name: "Worker",
      connectionProfileId: profile.id,
      dockerProjectName: "worker",
      deploySource: {
        type: "local",
        composeFilePath: "/tmp/docker-compose.yaml",
      },
    });

    expect(project.id).toBeTruthy();
    expect(project.dockerProjectName).toBe("worker");
  });

  it("accepts phase 8 onboarding and auto-deploy fields", () => {
    const parsed = workspaceConfigSchema.parse({
      ...defaultWorkspaceConfig,
      onboardingCompleted: true,
      deployProjects: [
        {
          id: "p1",
          name: "App",
          connectionProfileId: "c1",
          dockerProjectName: "app",
          deploySource: { type: "github", repositoryUrl: "https://github.com/o/r" },
          autoDeployOnPush: true,
          autoDeployLastRunId: 42,
        },
      ],
    });

    expect(parsed.onboardingCompleted).toBe(true);
    expect(parsed.deployProjects[0]?.autoDeployOnPush).toBe(true);
  });
});
