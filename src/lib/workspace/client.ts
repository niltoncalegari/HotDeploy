import { invoke } from "@tauri-apps/api/core";

import type { WorkspaceConfig } from "@/lib/workspace/schemas";

export async function getWorkspace(): Promise<WorkspaceConfig> {
  return invoke<WorkspaceConfig>("get_workspace");
}

export async function saveWorkspace(config: WorkspaceConfig): Promise<void> {
  return invoke("save_workspace_command", { config });
}

export async function getWorkspaceFilePath(): Promise<string> {
  return invoke<string>("get_workspace_file_path");
}
