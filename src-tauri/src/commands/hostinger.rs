use std::fs;

use tauri::AppHandle;

use crate::commands::credentials::load_api_key;
use crate::deployment::{
    append_deployment_record, clear_deployment_history, load_deployment_history, DeploymentRecord,
};
use crate::hostinger::client::HostingerClient;
use crate::hostinger::error::HostingerError;
use crate::hostinger::types::{
    ActionResult, ConnectionTestResult, Container, DeployProjectRequest, DockerProject, LogEntry,
    ProjectContent, VirtualMachine,
};
use crate::workspace::{load_workspace, DeploySource, WorkspaceConfig};

fn client_from_credentials() -> Result<HostingerClient, String> {
    let api_key = load_api_key().map_err(String::from)?;
    Ok(HostingerClient::new(api_key))
}

fn record_action(
    app: &AppHandle,
    docker_project_name: String,
    virtual_machine_id: u64,
    action: &str,
    outcome: &str,
) {
    let _ = append_deployment_record(
        app,
        docker_project_name,
        virtual_machine_id,
        action.to_string(),
        outcome.to_string(),
    );
}

#[tauri::command]
pub async fn list_vms() -> Result<Vec<VirtualMachine>, String> {
    let client = client_from_credentials()?;
    client.list_virtual_machines().await.map_err(String::from)
}

#[tauri::command]
pub async fn preview_list_vms(api_key: String) -> Result<Vec<VirtualMachine>, String> {
    if api_key.trim().is_empty() {
        return Err(String::from(HostingerError::NotConfigured));
    }

    let client = HostingerClient::new(api_key.trim().to_string());
    client.list_virtual_machines().await.map_err(String::from)
}

#[tauri::command]
pub async fn test_connection(virtual_machine_id: u64) -> Result<ConnectionTestResult, String> {
    let client = client_from_credentials()?;
    client
        .test_connection(virtual_machine_id)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn list_projects(virtual_machine_id: u64) -> Result<Vec<DockerProject>, String> {
    let client = client_from_credentials()?;
    client
        .list_projects(virtual_machine_id)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn get_project(
    virtual_machine_id: u64,
    project_name: String,
) -> Result<ProjectContent, String> {
    let client = client_from_credentials()?;
    client
        .get_project(virtual_machine_id, &project_name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn get_project_containers(
    virtual_machine_id: u64,
    project_name: String,
) -> Result<Vec<Container>, String> {
    let client = client_from_credentials()?;
    client
        .get_project_containers(virtual_machine_id, &project_name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn deploy_project(
    app: AppHandle,
    deploy_project_id: String,
) -> Result<ActionResult, String> {
    let workspace = load_workspace(&app).map_err(|error| error.to_string())?;
    let deploy_config = find_deploy_project(&workspace, &deploy_project_id)?;
    let profile = find_connection_profile(&workspace, &deploy_config.connection_profile_id)?;

    let content = resolve_deploy_content(&deploy_config.deploy_source)?;
    let request = DeployProjectRequest {
        project_name: deploy_config.docker_project_name.clone(),
        content,
        environment: deploy_config.environment_profile.clone(),
    };

    let client = client_from_credentials()?;
    let result = client
        .deploy_project(profile.virtual_machine_id, &request)
        .await;

    let outcome = if result.is_ok() { "success" } else { "error" };
    record_action(
        &app,
        deploy_config.docker_project_name.clone(),
        profile.virtual_machine_id,
        "deploy",
        outcome,
    );

    result.map_err(String::from)
}

#[tauri::command]
pub async fn start_project(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
) -> Result<ActionResult, String> {
    let client = client_from_credentials()?;
    let result = client
        .start_project(virtual_machine_id, &project_name)
        .await;
    record_lifecycle(&app, virtual_machine_id, &project_name, "start", &result);
    result.map_err(String::from)
}

#[tauri::command]
pub async fn stop_project(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
) -> Result<ActionResult, String> {
    let client = client_from_credentials()?;
    let result = client.stop_project(virtual_machine_id, &project_name).await;
    record_lifecycle(&app, virtual_machine_id, &project_name, "stop", &result);
    result.map_err(String::from)
}

#[tauri::command]
pub async fn restart_project(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
) -> Result<ActionResult, String> {
    let client = client_from_credentials()?;
    let result = client
        .restart_project(virtual_machine_id, &project_name)
        .await;
    record_lifecycle(&app, virtual_machine_id, &project_name, "restart", &result);
    result.map_err(String::from)
}

#[tauri::command]
pub async fn update_project(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
) -> Result<ActionResult, String> {
    let client = client_from_credentials()?;
    let result = client
        .update_project(virtual_machine_id, &project_name)
        .await;
    record_lifecycle(&app, virtual_machine_id, &project_name, "update", &result);
    result.map_err(String::from)
}

#[tauri::command]
pub async fn get_project_logs(
    virtual_machine_id: u64,
    project_name: String,
) -> Result<Vec<LogEntry>, String> {
    let client = client_from_credentials()?;
    client
        .get_project_logs(virtual_machine_id, &project_name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub fn get_deployment_history(app: AppHandle) -> Result<Vec<DeploymentRecord>, String> {
    load_deployment_history(&app).map_err(String::from)
}

#[tauri::command]
pub fn clear_deployment_history_command(app: AppHandle) -> Result<(), String> {
    clear_deployment_history(&app).map_err(String::from)
}

fn record_lifecycle(
    app: &AppHandle,
    virtual_machine_id: u64,
    project_name: &str,
    action: &str,
    result: &Result<ActionResult, HostingerError>,
) {
    let outcome = if result.is_ok() { "success" } else { "error" };
    record_action(
        app,
        project_name.to_string(),
        virtual_machine_id,
        action,
        outcome,
    );
}

fn find_deploy_project<'a>(
    workspace: &'a WorkspaceConfig,
    deploy_project_id: &str,
) -> Result<&'a crate::workspace::DeployProjectConfig, String> {
    workspace
        .deploy_projects
        .iter()
        .find(|project| project.id == deploy_project_id)
        .ok_or_else(|| {
            String::from(HostingerError::NotImplemented(format!(
                "deploy project not found: {deploy_project_id}"
            )))
        })
}

fn find_connection_profile<'a>(
    workspace: &'a WorkspaceConfig,
    profile_id: &str,
) -> Result<&'a crate::workspace::ConnectionProfile, String> {
    workspace
        .connection_profiles
        .iter()
        .find(|profile| profile.id == profile_id)
        .ok_or_else(|| {
            String::from(HostingerError::NotImplemented(format!(
                "connection profile not found: {profile_id}"
            )))
        })
}

fn resolve_deploy_content(source: &DeploySource) -> Result<String, String> {
    match source {
        DeploySource::Local { compose_file_path } => {
            fs::read_to_string(compose_file_path).map_err(|error| {
                String::from(HostingerError::Api {
                    status: 400,
                    message: format!("failed to read compose file: {error}"),
                })
            })
        }
        DeploySource::Github { repository_url } => Ok(repository_url.clone()),
    }
}
