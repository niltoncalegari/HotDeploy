use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::diagnostics::{append_log_line, build_diagnostics_report, log_file_path, read_log_tail};

#[tauri::command]
pub fn append_diagnostic_log(
    app: AppHandle,
    level: String,
    source: String,
    message: String,
    context: Option<String>,
) -> Result<(), String> {
    append_log_line(&app, &level, &source, &message, context.as_deref()).map_err(String::from)
}

#[tauri::command]
pub fn get_diagnostic_log_path(app: AppHandle) -> Result<String, String> {
    log_file_path(&app)
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(String::from)
}

#[tauri::command]
pub fn read_diagnostic_log_tail(
    app: AppHandle,
    max_lines: Option<usize>,
) -> Result<String, String> {
    read_log_tail(&app, max_lines.unwrap_or(200)).map_err(String::from)
}

#[tauri::command]
pub async fn export_diagnostics_report(app: AppHandle) -> Result<String, String> {
    build_diagnostics_report(&app).await.map_err(String::from)
}

#[tauri::command]
pub fn open_diagnostic_log_folder(app: AppHandle) -> Result<(), String> {
    let path = log_file_path(&app).map_err(String::from)?;
    let folder = path
        .parent()
        .ok_or_else(|| "log file has no parent directory".to_string())?;

    app.opener()
        .open_path(folder.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|error| error.to_string())
}
