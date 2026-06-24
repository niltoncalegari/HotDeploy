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

export interface DockerProjectSummary {
  name: string;
  state: string;
  filePath: string;
  containerCount: number;
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

export async function listProjects(
  virtualMachineId: number,
): Promise<DockerProjectSummary[]> {
  return invoke<DockerProjectSummary[]>("list_projects", { virtualMachineId });
}

export async function getProjectLogs(
  virtualMachineId: number,
  projectName: string,
): Promise<string> {
  return invoke<string>("get_project_logs", {
    virtualMachineId,
    projectName,
  });
}
