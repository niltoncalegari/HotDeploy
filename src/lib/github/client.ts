import { invoke } from "@tauri-apps/api/core";

export interface GitHubStatus {
  connected: boolean;
  login?: string;
}

export interface GitHubConnectionTest {
  login: string;
  scopes: string[];
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  htmlUrl: string;
  private: boolean;
}

export interface GitHubSecretMeta {
  name: string;
  updatedAt: string;
}

export interface GitHubVariable {
  name: string;
  value: string;
  updatedAt: string;
}

export interface WorkflowOptions {
  dockerProjectName: string;
  vmId: number;
  trigger: string;
  runnerType: string;
  includeTestStep: boolean;
}

export interface CommitWorkflowResult {
  sha: string;
}

export type RunnerState =
  | "notInstalled"
  | "installing"
  | "online"
  | "offline"
  | "error";

export interface RunnerStatus {
  state: RunnerState;
  message: string;
  runnerName: string;
}

export interface RunnerInstallResult {
  success: boolean;
  message: string;
  runnerName: string;
}

export interface RunnerUninstallResult {
  success: boolean;
  message: string;
  runnerName: string;
}

export interface SshStatus {
  configured: boolean;
}

export interface SshConnectionTest {
  connected: boolean;
  message: string;
}

export function parseGitHubError(error: unknown): string {
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error) as { message?: string };
      return parsed.message ?? error;
    } catch {
      return error;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown GitHub error";
}

export async function saveGitHubPat(pat: string): Promise<void> {
  await invoke("save_github_pat_command", { pat });
}

export async function clearGitHubPat(): Promise<void> {
  await invoke("clear_github_pat_command");
}

export async function getGitHubStatus(): Promise<GitHubStatus> {
  return invoke<GitHubStatus>("get_github_status");
}

export async function testGitHubConnection(): Promise<GitHubConnectionTest> {
  return invoke<GitHubConnectionTest>("test_github_connection");
}

export async function listGitHubRepos(page = 1): Promise<GitHubRepo[]> {
  return invoke<GitHubRepo[]>("list_github_repos", { page });
}

export async function listGitHubSecrets(
  owner: string,
  repo: string,
): Promise<GitHubSecretMeta[]> {
  return invoke<GitHubSecretMeta[]>("list_github_secrets", { owner, repo });
}

export async function upsertGitHubSecret(
  owner: string,
  repo: string,
  name: string,
  value: string,
): Promise<void> {
  await invoke("upsert_github_secret", { owner, repo, name, value });
}

export async function deleteGitHubSecret(
  owner: string,
  repo: string,
  name: string,
): Promise<void> {
  await invoke("delete_github_secret", { owner, repo, name });
}

export async function listGitHubVariables(
  owner: string,
  repo: string,
): Promise<GitHubVariable[]> {
  return invoke<GitHubVariable[]>("list_github_variables", { owner, repo });
}

export async function upsertGitHubVariable(
  owner: string,
  repo: string,
  name: string,
  value: string,
): Promise<void> {
  await invoke("upsert_github_variable", { owner, repo, name, value });
}

export async function deleteGitHubVariable(
  owner: string,
  repo: string,
  name: string,
): Promise<void> {
  await invoke("delete_github_variable", { owner, repo, name });
}

export async function generateWorkflowYaml(
  options: WorkflowOptions,
): Promise<string> {
  return invoke<string>("generate_workflow_yaml_command", { options });
}

export async function commitWorkflowFile(
  owner: string,
  repo: string,
  content: string,
  message: string,
): Promise<CommitWorkflowResult> {
  return invoke<CommitWorkflowResult>("commit_workflow_file", {
    owner,
    repo,
    content,
    message,
  });
}

export async function installSelfHostedRunner(
  profileId: string,
  owner: string,
  repo: string,
): Promise<RunnerInstallResult> {
  return invoke<RunnerInstallResult>("install_self_hosted_runner", {
    profileId,
    owner,
    repo,
  });
}

export async function getRunnerStatus(
  profileId: string,
  owner: string,
  repo: string,
): Promise<RunnerStatus> {
  return invoke<RunnerStatus>("get_runner_status", {
    profileId,
    owner,
    repo,
  });
}

export async function uninstallSelfHostedRunner(
  profileId: string,
  owner: string,
  repo: string,
): Promise<RunnerUninstallResult> {
  return invoke<RunnerUninstallResult>("uninstall_self_hosted_runner", {
    profileId,
    owner,
    repo,
  });
}

export async function rotateRunnerRegistration(
  profileId: string,
  owner: string,
  repo: string,
): Promise<RunnerInstallResult> {
  return invoke<RunnerInstallResult>("rotate_runner_registration", {
    profileId,
    owner,
    repo,
  });
}

export async function parseGithubRepoUrl(
  url: string,
): Promise<[string, string]> {
  return invoke<[string, string]>("parse_github_repo_url_command", { url });
}

export async function saveSshCredentials(
  privateKey: string,
  username: string,
): Promise<void> {
  await invoke("save_ssh_credentials_command", { privateKey, username });
}

export async function getSshStatus(): Promise<SshStatus> {
  return invoke<SshStatus>("get_ssh_status");
}

export async function testSshConnection(
  profileId: string,
): Promise<SshConnectionTest> {
  return invoke<SshConnectionTest>("test_ssh_connection", { profileId });
}

export interface GitHubEnvironment {
  name: string;
  htmlUrl: string;
}

export interface EnvProfileSyncResult {
  imported: string[];
  skipped: string[];
}

export interface AutoDeployCheckResult {
  shouldDeploy: boolean;
  runId?: number;
  message: string;
}

export interface DeviceFlowStart {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface GitHubAuthMethod {
  method: string;
}

export async function syncEnvProfileToGitHubSecrets(
  owner: string,
  repo: string,
  environmentProfile: string,
  keys: string[],
): Promise<EnvProfileSyncResult> {
  return invoke<EnvProfileSyncResult>("sync_env_profile_to_github_secrets", {
    owner,
    repo,
    environmentProfile,
    keys,
  });
}

export async function listGitHubEnvironments(
  owner: string,
  repo: string,
): Promise<GitHubEnvironment[]> {
  return invoke<GitHubEnvironment[]>("list_github_environments", { owner, repo });
}

export async function createGitHubEnvironment(
  owner: string,
  repo: string,
  name: string,
): Promise<GitHubEnvironment> {
  return invoke<GitHubEnvironment>("create_github_environment", {
    owner,
    repo,
    name,
  });
}

export async function deleteGitHubEnvironment(
  owner: string,
  repo: string,
  name: string,
): Promise<void> {
  await invoke("delete_github_environment", { owner, repo, name });
}

export async function checkAutoDeployRun(
  owner: string,
  repo: string,
  branch: string,
  lastDeployedRunId?: number,
): Promise<AutoDeployCheckResult> {
  return invoke<AutoDeployCheckResult>("check_auto_deploy_run", {
    owner,
    repo,
    branch,
    lastDeployedRunId: lastDeployedRunId ?? null,
  });
}

export async function startGitHubDeviceFlow(): Promise<DeviceFlowStart> {
  return invoke<DeviceFlowStart>("start_github_device_flow");
}

export async function pollGitHubDeviceToken(
  deviceCode: string,
): Promise<GitHubStatus> {
  return invoke<GitHubStatus>("poll_github_device_token", { deviceCode });
}

export async function getGitHubAuthMethod(): Promise<GitHubAuthMethod> {
  return invoke<GitHubAuthMethod>("get_github_auth_method_command");
}
