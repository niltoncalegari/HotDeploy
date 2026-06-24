import {
  deployProjectResponseSchema,
  dockerProjectListSchema,
  virtualMachineListSchema,
  type DeployProjectResponse,
  type DockerProject,
  type VirtualMachine,
} from "./schemas/hostinger";
import {
  sampleDeployResponse,
  sampleProjects,
  sampleVirtualMachines,
} from "./fixtures/projects";

export type HostingerCall =
  | { method: "listVirtualMachines" }
  | { method: "listProjects"; virtualMachineId: number }
  | {
      method: "deployProject";
      virtualMachineId: number;
      projectName: string;
      content: string;
    }
  | {
      method: "getProjectLogs";
      virtualMachineId: number;
      projectName: string;
    };

export class FakeHostingerClient {
  readonly callLog: HostingerCall[] = [];

  constructor(
    private readonly virtualMachines: VirtualMachine[] = sampleVirtualMachines,
    private readonly projects: DockerProject[] = sampleProjects,
    private readonly deployResponse: DeployProjectResponse = sampleDeployResponse,
  ) {}

  async listVirtualMachines(): Promise<VirtualMachine[]> {
    this.callLog.push({ method: "listVirtualMachines" });
    return virtualMachineListSchema.parse(this.virtualMachines);
  }

  async listProjects(virtualMachineId: number): Promise<DockerProject[]> {
    this.callLog.push({ method: "listProjects", virtualMachineId });
    return dockerProjectListSchema.parse(this.projects);
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

  async getProjectLogs(
    virtualMachineId: number,
    projectName: string,
  ): Promise<string> {
    this.callLog.push({ method: "getProjectLogs", virtualMachineId, projectName });
    return `[fake] logs for ${projectName} on vm ${virtualMachineId}`;
  }
}
