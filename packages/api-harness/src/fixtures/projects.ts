import type { DeployProjectResponse, DockerProject, VirtualMachine } from "./schemas/hostinger";

export const sampleVirtualMachines: VirtualMachine[] = [
  { id: 1001, hostname: "vps-hotdeploy-01", state: "running" },
  { id: 1002, hostname: "vps-hotdeploy-02", state: "stopped" },
];

export const sampleProjects: DockerProject[] = [
  {
    name: "api-gateway",
    state: "running",
    filePath: "/docker/api-gateway/docker-compose.yaml",
    containers: [
      {
        name: "api-gateway-app-1",
        image: "ghcr.io/example/api:latest",
        health: "healthy",
        ports: ["443:443"],
      },
    ],
  },
  {
    name: "worker",
    state: "stopped",
    filePath: "/docker/worker/docker-compose.yaml",
    containers: [
      {
        name: "worker-app-1",
        image: "ghcr.io/example/worker:latest",
        health: "none",
        ports: [],
      },
    ],
  },
];

export const sampleDeployResponse: DeployProjectResponse = {
  id: 42,
  name: "api-gateway",
  state: "deploying",
  createdAt: "2026-06-24T20:00:00.000Z",
  updatedAt: "2026-06-24T20:00:00.000Z",
};
