import { invoke } from "@tauri-apps/api/core";

import type { ProviderId } from "@/lib/workspace/schemas";

export interface CredentialsStatus {
  configured: boolean;
  virtualMachineId: number | null;
}

export interface SupportedProvider {
  id: ProviderId;
  label: string;
  dockerComposeSupported: boolean;
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

export interface ContainerStats {
  cpuPercentage?: number;
  memoryPercentage?: number;
  memoryUsed?: number;
  memoryTotal?: number;
  netIn?: number;
  netOut?: number;
}

export interface Container {
  name: string;
  image: string;
  health: string;
  ports: string[];
  state?: string;
  stats?: ContainerStats;
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

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface MetricSeries {
  unit: string;
  points: MetricPoint[];
}

export interface VpsMetrics {
  cpuUsage?: MetricSeries;
  ramUsage?: MetricSeries;
  diskSpace?: MetricSeries;
  incomingTraffic?: MetricSeries;
  outgoingTraffic?: MetricSeries;
  uptime?: MetricSeries;
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

export async function getProviderCredentialsStatus(
  provider: ProviderId,
): Promise<CredentialsStatus> {
  return invoke<CredentialsStatus>("get_provider_credentials_status", {
    provider,
  });
}

export async function saveProviderCredentials(
  provider: ProviderId,
  apiKey: string,
): Promise<void> {
  return invoke("save_provider_credentials", { provider, apiKey });
}

export async function clearProviderCredentials(
  provider: ProviderId,
): Promise<void> {
  return invoke("clear_provider_credentials", { provider });
}

export async function listSupportedProviders(): Promise<SupportedProvider[]> {
  return invoke<SupportedProvider[]>("list_supported_providers");
}

export async function listVirtualMachines(
  provider: ProviderId = "hostinger",
): Promise<VirtualMachine[]> {
  return invoke<VirtualMachine[]>("list_vms", { provider });
}

export async function previewListVirtualMachines(
  apiKey: string,
  provider: ProviderId = "hostinger",
): Promise<VirtualMachine[]> {
  return invoke<VirtualMachine[]>("preview_list_vms", { apiKey, provider });
}

export async function testConnection(
  virtualMachineId: number,
  provider: ProviderId = "hostinger",
): Promise<ConnectionTestResult> {
  return invoke<ConnectionTestResult>("test_connection", {
    virtualMachineId,
    provider,
  });
}

export async function listProjects(
  virtualMachineId: number,
  provider: ProviderId = "hostinger",
): Promise<DockerProject[]> {
  return invoke<DockerProject[]>("list_projects", {
    virtualMachineId,
    provider,
  });
}

export async function getProject(
  virtualMachineId: number,
  projectName: string,
  provider: ProviderId = "hostinger",
): Promise<ProjectContent> {
  return invoke<ProjectContent>("get_project", {
    virtualMachineId,
    projectName,
    provider,
  });
}

export async function getProjectContainers(
  virtualMachineId: number,
  projectName: string,
  provider: ProviderId = "hostinger",
): Promise<Container[]> {
  return invoke<Container[]>("get_project_containers", {
    virtualMachineId,
    projectName,
    provider,
  });
}

export async function getVpsMetrics(
  virtualMachineId: number,
  dateFrom: string,
  dateTo: string,
  provider: ProviderId = "hostinger",
): Promise<VpsMetrics> {
  return invoke<VpsMetrics>("get_vps_metrics", {
    virtualMachineId,
    dateFrom,
    dateTo,
    provider,
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
  provider: ProviderId = "hostinger",
): Promise<ActionResult> {
  return invoke<ActionResult>("start_project", {
    virtualMachineId,
    projectName,
    provider,
  });
}

export async function stopProject(
  virtualMachineId: number,
  projectName: string,
  provider: ProviderId = "hostinger",
): Promise<ActionResult> {
  return invoke<ActionResult>("stop_project", {
    virtualMachineId,
    projectName,
    provider,
  });
}

export async function restartProject(
  virtualMachineId: number,
  projectName: string,
  provider: ProviderId = "hostinger",
): Promise<ActionResult> {
  return invoke<ActionResult>("restart_project", {
    virtualMachineId,
    projectName,
    provider,
  });
}

export async function updateProject(
  virtualMachineId: number,
  projectName: string,
  provider: ProviderId = "hostinger",
): Promise<ActionResult> {
  return invoke<ActionResult>("update_project", {
    virtualMachineId,
    projectName,
    provider,
  });
}

export async function getProjectLogs(
  virtualMachineId: number,
  projectName: string,
  provider: ProviderId = "hostinger",
): Promise<LogEntry[]> {
  return invoke<LogEntry[]>("get_project_logs", {
    virtualMachineId,
    projectName,
    provider,
  });
}

export async function getDeploymentHistory(): Promise<DeploymentRecord[]> {
  return invoke<DeploymentRecord[]>("get_deployment_history");
}

export async function clearDeploymentHistory(): Promise<void> {
  return invoke("clear_deployment_history_command");
}

function parseStructuredErrorMessage(raw: string): string | null {
  try {
    const payload = JSON.parse(raw) as HostingerErrorPayload;
    return typeof payload.message === "string" ? payload.message : null;
  } catch {
    return null;
  }
}

export function parseHostingerError(error: unknown): string {
  if (error instanceof Error) {
    const structured = parseStructuredErrorMessage(error.message);
    return structured ?? error.message;
  }

  if (typeof error === "string") {
    return parseStructuredErrorMessage(error) ?? error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") {
      return parseHostingerError(message);
    }
  }

  return "Unexpected error";
}
