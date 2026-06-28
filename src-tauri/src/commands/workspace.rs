use tauri::AppHandle;

use crate::diagnostics::append_log_line;
use crate::workspace::{load_workspace, save_workspace, workspace_file_path, WorkspaceConfig};

#[tauri::command]
pub fn get_workspace(app: AppHandle) -> Result<WorkspaceConfig, String> {
    load_workspace(&app).map_err(|error| {
        let message = error.to_string();
        let _ = append_log_line(&app, "error", "get_workspace", &message, None);
        message
    })
}

#[tauri::command]
pub fn save_workspace_command(app: AppHandle, config: WorkspaceConfig) -> Result<(), String> {
    let context = format!(
        "profiles={}, projects={}",
        config.connection_profiles.len(),
        config.deploy_projects.len()
    );

    save_workspace(&app, config).map_err(|error| {
        let message = error.to_string();
        let _ = append_log_line(
            &app,
            "error",
            "save_workspace_command",
            &message,
            Some(&context),
        );
        message
    })
}

#[tauri::command]
pub fn get_workspace_file_path(app: AppHandle) -> Result<String, String> {
    workspace_file_path(&app)
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(String::from)
}
