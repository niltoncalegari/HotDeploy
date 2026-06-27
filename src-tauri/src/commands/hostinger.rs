use std::fs;

use tauri::AppHandle;

use crate::deployment::{
    append_deployment_record, clear_deployment_history, load_deployment_history, DeploymentRecord,
};
use crate::hostinger::error::HostingerError;
use crate::hostinger::types::{
    ActionResult, ConnectionTestResult, Container, DeployProjectRequest, DockerProject, LogEntry,
    ProjectContent, VirtualMachine, VpsMetrics,
};
use crate::provider::digitalocean::DigitalOceanProvider;
use crate::provider::error::ProviderError;
use crate::provider::hostinger::HostingerProvider;
use crate::provider::registry::{build_provider, resolve_provider_id};
use crate::provider::traits::VpsProvider;
use crate::workspace::{load_workspace, DeploySource, WorkspaceConfig};

fn preview_provider(
    api_key: String,
    provider_id: &str,
) -> Result<Box<dyn VpsProvider>, ProviderError> {
    if api_key.trim().is_empty() {
        return Err(ProviderError::Hostinger(HostingerError::NotConfigured));
    }

    match provider_id {
        "hostinger" => Ok(Box::new(HostingerProvider::from_api_key(
            api_key.trim().to_string(),
        ))),
        "digitalocean" => Ok(Box::new(DigitalOceanProvider::from_api_key(
            api_key.trim().to_string(),
        ))),
        other => Err(ProviderError::UnknownProvider(other.to_string())),
    }
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
pub async fn list_vms(
    app: AppHandle,
    provider: Option<String>,
) -> Result<Vec<VirtualMachine>, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    provider.list_vms().await.map_err(String::from)
}

#[tauri::command]
pub async fn preview_list_vms(
    api_key: String,
    provider: Option<String>,
) -> Result<Vec<VirtualMachine>, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = preview_provider(api_key, &provider_id).map_err(String::from)?;
    provider.list_vms().await.map_err(String::from)
}

#[tauri::command]
pub async fn test_connection(
    app: AppHandle,
    virtual_machine_id: u64,
    provider: Option<String>,
) -> Result<ConnectionTestResult, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    provider
        .test_connection(virtual_machine_id)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn list_projects(
    app: AppHandle,
    virtual_machine_id: u64,
    provider: Option<String>,
) -> Result<Vec<DockerProject>, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    provider
        .list_projects(virtual_machine_id)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn get_project(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
    provider: Option<String>,
) -> Result<ProjectContent, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    provider
        .get_project(virtual_machine_id, &project_name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn get_project_containers(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
    provider: Option<String>,
) -> Result<Vec<Container>, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    provider
        .get_project_containers(virtual_machine_id, &project_name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn get_vps_metrics(
    app: AppHandle,
    virtual_machine_id: u64,
    date_from: String,
    date_to: String,
    provider: Option<String>,
) -> Result<VpsMetrics, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    provider
        .get_vps_metrics(virtual_machine_id, &date_from, &date_to)
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

    let provider = build_provider(&app, &profile.provider).map_err(String::from)?;
    if !provider.supports_docker_compose() {
        return Err(String::from(ProviderError::unsupported(
            &profile.provider,
            "Docker Compose deploy",
        )));
    }

    let content = resolve_deploy_content(&deploy_config.deploy_source)?;
    let request = DeployProjectRequest {
        project_name: deploy_config.docker_project_name.clone(),
        content,
        environment: deploy_config.environment_profile.clone(),
    };

    let result = provider
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
    provider: Option<String>,
) -> Result<ActionResult, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    let result = provider
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
    provider: Option<String>,
) -> Result<ActionResult, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    let result = provider
        .stop_project(virtual_machine_id, &project_name)
        .await;
    record_lifecycle(&app, virtual_machine_id, &project_name, "stop", &result);
    result.map_err(String::from)
}

#[tauri::command]
pub async fn restart_project(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
    provider: Option<String>,
) -> Result<ActionResult, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    let result = provider
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
    provider: Option<String>,
) -> Result<ActionResult, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    let result = provider
        .update_project(virtual_machine_id, &project_name)
        .await;
    record_lifecycle(&app, virtual_machine_id, &project_name, "update", &result);
    result.map_err(String::from)
}

#[tauri::command]
pub async fn get_project_logs(
    app: AppHandle,
    virtual_machine_id: u64,
    project_name: String,
    provider: Option<String>,
) -> Result<Vec<LogEntry>, String> {
    let provider_id = resolve_provider_id(provider);
    let provider = build_provider(&app, &provider_id).map_err(String::from)?;
    provider
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

#[tauri::command]
pub fn list_supported_providers() -> Vec<SupportedProvider> {
    vec![
        SupportedProvider {
            id: "hostinger".to_string(),
            label: "Hostinger".to_string(),
            docker_compose_supported: true,
        },
        SupportedProvider {
            id: "digitalocean".to_string(),
            label: "DigitalOcean".to_string(),
            docker_compose_supported: false,
        },
    ]
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SupportedProvider {
    pub id: String,
    pub label: String,
    pub docker_compose_supported: bool,
}

fn record_lifecycle(
    app: &AppHandle,
    virtual_machine_id: u64,
    project_name: &str,
    action: &str,
    result: &Result<ActionResult, ProviderError>,
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
