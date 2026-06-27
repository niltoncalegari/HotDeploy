import {
  actionResultSchema,
  connectionTestResultSchema,
  containerSchema,
  deployProjectResponseSchema,
  dockerProjectListSchema,
  logEntryListSchema,
  projectContentSchema,
  virtualMachineListSchema,
  vpsMetricsSchema,
  type ActionResult,
  type ConnectionTestResult,
  type Container,
  type DeployProjectResponse,
  type DockerProject,
  type LogEntry,
  type ProjectContent,
  type VirtualMachine,
  type VpsMetrics,
} from "./schemas/hostinger";
import {
  sampleDeployResponse,
  sampleProjects,
  sampleVirtualMachines,
} from "./fixtures/projects";
import { sampleVpsMetrics } from "./fixtures/metrics";

export type HostingerCall =
  | { method: "listVirtualMachines" }
  | { method: "testConnection"; virtualMachineId: number }
  | { method: "listProjects"; virtualMachineId: number }
  | {
      method: "deployProject";
      virtualMachineId: number;
      projectName: string;
      content: string;
    }
  | {
      method: "getProject";
      virtualMachineId: number;
      projectName: string;
    }
  | {
      method: "getProjectContainers";
      virtualMachineId: number;
      projectName: string;
    }
  | {
      method: "getProjectLogs";
      virtualMachineId: number;
      projectName: string;
    }
  | {
      method: "lifecycle";
      virtualMachineId: number;
      projectName: string;
      action: "start" | "stop" | "restart" | "update";
    }
  | {
      method: "getVpsMetrics";
      virtualMachineId: number;
      dateFrom: string;
      dateTo: string;
    };

export class FakeHostingerClient {
  readonly callLog: HostingerCall[] = [];

  constructor(
    private readonly virtualMachines: VirtualMachine[] = sampleVirtualMachines,
    private readonly projects: DockerProject[] = sampleProjects,
    private readonly deployResponse: DeployProjectResponse = sampleDeployResponse,
    private readonly vpsMetrics: VpsMetrics = sampleVpsMetrics,
  ) {}

  async listVirtualMachines(): Promise<VirtualMachine[]> {
    this.callLog.push({ method: "listVirtualMachines" });
    return virtualMachineListSchema.parse(this.virtualMachines);
  }

  async testConnection(virtualMachineId: number): Promise<ConnectionTestResult> {
    this.callLog.push({ method: "testConnection", virtualMachineId });
    return connectionTestResultSchema.parse({
      connected: true,
      message: "Connected to Docker Manager",
      projectCount: this.projects.length,
    });
  }

  async listProjects(virtualMachineId: number): Promise<DockerProject[]> {
    this.callLog.push({ method: "listProjects", virtualMachineId });
    return dockerProjectListSchema.parse(this.projects);
  }

  async getProject(
    virtualMachineId: number,
    projectName: string,
  ): Promise<ProjectContent> {
    this.callLog.push({ method: "getProject", virtualMachineId, projectName });
    const project = this.projects.find((item) => item.name === projectName);
    return projectContentSchema.parse({
      content: `services:\n  ${projectName}:\n    image: ${project?.containers[0]?.image ?? "nginx"}`,
      environment: "NODE_ENV=production",
    });
  }

  async getProjectContainers(
    virtualMachineId: number,
    projectName: string,
  ): Promise<Container[]> {
    this.callLog.push({
      method: "getProjectContainers",
      virtualMachineId,
      projectName,
    });
    const project = this.projects.find((item) => item.name === projectName);
    return containerSchema.array().parse(project?.containers ?? []);
  }

  async deployProject(input: {
    virtualMachineId: number;
    projectName: string;
    content: string;
  }): Promise<DeployProjectResponse> {
    this.callLog.push({
      method: "deployProject",
      virtualMachineId: input.virtualMachineId,
      projectName: input.projectName,
      content: input.content,
    });
    return deployProjectResponseSchema.parse({
      ...this.deployResponse,
      name: input.projectName,
    });
  }

  async lifecycle(
    virtualMachineId: number,
    projectName: string,
    action: "start" | "stop" | "restart" | "update",
  ): Promise<ActionResult> {
    this.callLog.push({
      method: "lifecycle",
      virtualMachineId,
      projectName,
      action,
    });
    return actionResultSchema.parse({
      id: 1,
      name: action,
      state: "success",
    });
  }

  async getProjectLogs(
    virtualMachineId: number,
    projectName: string,
  ): Promise<LogEntry[]> {
    this.callLog.push({ method: "getProjectLogs", virtualMachineId, projectName });
    return logEntryListSchema.parse([
      {
        service: "web",
        timestamp: "2026-06-24T20:00:00.000Z",
        message: `[fake] logs for ${projectName}`,
      },
    ]);
  }

  async getVpsMetrics(
    virtualMachineId: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<VpsMetrics> {
    this.callLog.push({
      method: "getVpsMetrics",
      virtualMachineId,
      dateFrom,
      dateTo,
    });
    return vpsMetricsSchema.parse(this.vpsMetrics);
  }
}
