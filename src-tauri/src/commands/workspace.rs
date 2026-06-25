use tauri::AppHandle;

use crate::workspace::{load_workspace, save_workspace, workspace_file_path, WorkspaceConfig};

#[tauri::command]
pub fn get_workspace(app: AppHandle) -> Result<WorkspaceConfig, String> {
    load_workspace(&app).map_err(String::from)
}

#[tauri::command]
pub fn save_workspace_command(app: AppHandle, config: WorkspaceConfig) -> Result<(), String> {
    save_workspace(&app, config).map_err(String::from)
}

#[tauri::command]
pub fn get_workspace_file_path(app: AppHandle) -> Result<String, String> {
    workspace_file_path(&app)
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(String::from)
}
