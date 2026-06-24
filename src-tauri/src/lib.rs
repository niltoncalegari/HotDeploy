mod commands;
mod hostinger;

use commands::{
    clear_credentials, get_credentials_status, get_project_logs, list_projects, list_vms,
    save_credentials,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_credentials_status,
            save_credentials,
            clear_credentials,
            list_vms,
            list_projects,
            get_project_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
