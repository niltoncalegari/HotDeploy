import { invoke } from "@tauri-apps/api/core";

import { logDiagnosticError } from "@/lib/diagnostics/client";
import type { WorkspaceConfig } from "@/lib/workspace/schemas";

export async function getWorkspace(): Promise<WorkspaceConfig> {
  return invoke<WorkspaceConfig>("get_workspace");
}

export async function saveWorkspace(config: WorkspaceConfig): Promise<void> {
  try {
    await invoke("save_workspace_command", { config });
  } catch (error) {
    await logDiagnosticError("save_workspace_command", error, {
      connectionProfiles: config.connectionProfiles.length,
      deployProjects: config.deployProjects.length,
    });
    throw error;
  }
}

export async function getWorkspaceFilePath(): Promise<string> {
  return invoke<string>("get_workspace_file_path");
}
