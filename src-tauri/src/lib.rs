mod commands;
mod credentials;
mod deployment;
mod hostinger;
mod provider;
mod workspace;

use commands::{
    clear_credentials, clear_deployment_history_command, clear_provider_credentials,
    deploy_project, get_credentials_status, get_deployment_history, get_project,
    get_project_containers, get_project_logs, get_provider_credentials_status, get_vps_metrics,
    get_workspace, get_workspace_file_path, list_projects, list_supported_providers, list_vms,
    preview_list_vms, restart_project, save_credentials, save_provider_credentials,
    save_workspace_command, start_project, stop_project, test_connection, update_project,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_credentials_status,
            save_credentials,
            clear_credentials,
            save_provider_credentials,
            get_provider_credentials_status,
            clear_provider_credentials,
            list_vms,
            preview_list_vms,
            test_connection,
            list_projects,
            list_supported_providers,
            get_project,
            get_project_containers,
            get_vps_metrics,
            deploy_project,
            start_project,
            stop_project,
            restart_project,
            update_project,
            get_project_logs,
            get_deployment_history,
            clear_deployment_history_command,
            get_workspace,
            save_workspace_command,
            get_workspace_file_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
