import { invoke } from "@tauri-apps/api/core";

export interface CredentialsStatus {
  configured: boolean;
  virtualMachineId: number | null;
}

export interface VirtualMachine {
  id: number;
  hostname: string;
  state: string;
}

export interface ConnectionTestResult {
  connected: boolean;
  message: string;
  projectCount: number;
}

export interface Container {
  name: string;
  image: string;
  health: string;
  ports: string[];
  state?: string;
}

export interface DockerProject {
  name: string;
  state: string;
  filePath: string;
  containers: Container[];
}

export interface ProjectContent {
  content: string;
  environment?: string;
}

export interface ActionResult {
  id: number;
  name: string;
  state: string;
}

export interface LogEntry {
  service: string;
  timestamp: string;
  message: string;
}

export interface DeploymentRecord {
  id: string;
  timestamp: string;
  dockerProjectName: string;
  virtualMachineId: number;
  action: string;
  outcome: string;
}

export interface HostingerErrorPayload {
  code: string;
  message: string;
}

export async function getCredentialsStatus(): Promise<CredentialsStatus> {
  return invoke<CredentialsStatus>("get_credentials_status");
}

export async function saveCredentials(
  apiKey: string,
  virtualMachineId: number,
): Promise<void> {
  return invoke("save_credentials", { apiKey, virtualMachineId });
}

export async function clearCredentials(): Promise<void> {
  return invoke("clear_credentials");
}

export async function listVirtualMachines(): Promise<VirtualMachine[]> {
  return invoke<VirtualMachine[]>("list_vms");
}

export async function testConnection(
  virtualMachineId: number,
): Promise<ConnectionTestResult> {
  return invoke<ConnectionTestResult>("test_connection", { virtualMachineId });
}

export async function listProjects(
  virtualMachineId: number,
): Promise<DockerProject[]> {
  return invoke<DockerProject[]>("list_projects", { virtualMachineId });
}

export async function getProject(
  virtualMachineId: number,
  projectName: string,
): Promise<ProjectContent> {
  return invoke<ProjectContent>("get_project", {
    virtualMachineId,
    projectName,
  });
}

export async function getProjectContainers(
  virtualMachineId: number,
  projectName: string,
): Promise<Container[]> {
  return invoke<Container[]>("get_project_containers", {
    virtualMachineId,
    projectName,
  });
}

export async function deployProject(
  deployProjectId: string,
): Promise<ActionResult> {
  return invoke<ActionResult>("deploy_project", { deployProjectId });
}

export async function startProject(
  virtualMachineId: number,
  projectName: string,
): Promise<ActionResult> {
  return invoke<ActionResult>("start_project", {
    virtualMachineId,
    projectName,
  });
}

export async function stopProject(
  virtualMachineId: number,
  projectName: string,
): Promise<ActionResult> {
  return invoke<ActionResult>("stop_project", { virtualMachineId, projectName });
}

export async function restartProject(
  virtualMachineId: number,
  projectName: string,
): Promise<ActionResult> {
  return invoke<ActionResult>("restart_project", {
    virtualMachineId,
    projectName,
  });
}

export async function updateProject(
  virtualMachineId: number,
  projectName: string,
): Promise<ActionResult> {
  return invoke<ActionResult>("update_project", {
    virtualMachineId,
    projectName,
  });
}

export async function getProjectLogs(
  virtualMachineId: number,
  projectName: string,
): Promise<LogEntry[]> {
  return invoke<LogEntry[]>("get_project_logs", {
    virtualMachineId,
    projectName,
  });
}

export async function getDeploymentHistory(): Promise<DeploymentRecord[]> {
  return invoke<DeploymentRecord[]>("get_deployment_history");
}

export async function clearDeploymentHistory(): Promise<void> {
  return invoke("clear_deployment_history_command");
}

export function parseHostingerError(error: unknown): string {
  if (typeof error === "string") {
    try {
      const payload = JSON.parse(error) as HostingerErrorPayload;
      return payload.message;
    } catch {
      return error;
    }
  }
  return "Unexpected error";
}
