mod commands;
mod credentials;
mod deployment;
mod github;
mod hostinger;
mod provider;
mod ssh;
mod workspace;

use commands::{
    check_auto_deploy_run, clear_credentials, clear_deployment_history_command,
    clear_github_pat_command, clear_provider_credentials, clear_ssh_credentials_command,
    commit_workflow_file, create_github_environment, delete_github_environment,
    delete_github_secret, delete_github_variable, deploy_project, generate_workflow_yaml_command,
    get_credentials_status, get_deployment_history, get_github_auth_method_command,
    get_github_status, get_project, get_project_containers, get_project_logs,
    get_provider_credentials_status, get_runner_registration_token, get_runner_status,
    get_ssh_status, get_vps_metrics, get_workspace, get_workspace_file_path,
    install_self_hosted_runner, list_github_environments, list_github_repos, list_github_secrets,
    list_github_variables, list_projects, list_supported_providers, list_vms,
    parse_github_repo_url_command, poll_github_device_token, preview_list_vms, restart_project,
    rotate_runner_registration, save_credentials, save_github_pat_command,
    save_provider_credentials, save_ssh_credentials_command, save_workspace_command,
    start_github_device_flow, start_project, stop_project, sync_env_profile_to_github_secrets,
    test_connection, test_github_connection, test_ssh_connection, uninstall_self_hosted_runner,
    update_project, upsert_github_secret, upsert_github_variable,
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
            save_github_pat_command,
            clear_github_pat_command,
            get_github_status,
            test_github_connection,
            list_github_repos,
            list_github_secrets,
            upsert_github_secret,
            delete_github_secret,
            list_github_variables,
            upsert_github_variable,
            delete_github_variable,
            generate_workflow_yaml_command,
            commit_workflow_file,
            get_runner_registration_token,
            install_self_hosted_runner,
            get_runner_status,
            uninstall_self_hosted_runner,
            rotate_runner_registration,
            parse_github_repo_url_command,
            sync_env_profile_to_github_secrets,
            list_github_environments,
            create_github_environment,
            delete_github_environment,
            check_auto_deploy_run,
            start_github_device_flow,
            poll_github_device_token,
            get_github_auth_method_command,
            save_ssh_credentials_command,
            clear_ssh_credentials_command,
            get_ssh_status,
            test_ssh_connection,
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
