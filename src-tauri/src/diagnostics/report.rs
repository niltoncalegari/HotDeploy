use serde::Serialize;
use tauri::AppHandle;

use crate::credentials::{credentials_presence, github_pat_configured, load_github_pat};
use crate::diagnostics::log::{log_file_path, read_log_tail, DiagnosticLogError};
use crate::github::client::GitHubClient;
use crate::workspace::{load_workspace, WorkspaceConfig};

const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSummary {
    pub version: u32,
    pub onboarding_completed: Option<bool>,
    pub active_connection_profile_id: Option<String>,
    pub connection_profiles: Vec<ConnectionProfileSummary>,
    pub deploy_projects: Vec<DeployProjectSummary>,
    pub github_app_configured: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfileSummary {
    pub id: String,
    pub label: String,
    pub provider: String,
    pub virtual_machine_id: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeployProjectSummary {
    pub id: String,
    pub name: String,
    pub connection_profile_id: String,
    pub docker_project_name: String,
    pub deploy_source_type: String,
    pub deploy_source_detail: String,
    pub github_link: Option<String>,
    pub environment_profile: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectivitySummary {
    pub hostinger_configured: bool,
    pub hostinger_vm_id: Option<u64>,
    pub digitalocean_configured: bool,
    pub github_connected: bool,
    pub github_login: Option<String>,
}

fn summarize_environment_profile(value: Option<&String>) -> String {
    match value {
        None => "not set".to_string(),
        Some(raw) if raw.trim().is_empty() => "empty".to_string(),
        Some(raw) => {
            let line_count = raw.lines().filter(|line| !line.trim().is_empty()).count();
            format!("{line_count} line(s), values redacted")
        }
    }
}

pub fn summarize_workspace(config: &WorkspaceConfig) -> WorkspaceSummary {
    WorkspaceSummary {
        version: config.version,
        onboarding_completed: config.onboarding_completed,
        active_connection_profile_id: config.active_connection_profile_id.clone(),
        connection_profiles: config
            .connection_profiles
            .iter()
            .map(|profile| ConnectionProfileSummary {
                id: profile.id.clone(),
                label: profile.label.clone(),
                provider: profile.provider.clone(),
                virtual_machine_id: profile.virtual_machine_id,
            })
            .collect(),
        deploy_projects: config
            .deploy_projects
            .iter()
            .map(|project| {
                let (deploy_source_type, deploy_source_detail) = match &project.deploy_source {
                    crate::workspace::DeploySource::Local { compose_file_path } => {
                        ("local".to_string(), compose_file_path.clone())
                    }
                    crate::workspace::DeploySource::Github { repository_url } => {
                        ("github".to_string(), repository_url.clone())
                    }
                };

                DeployProjectSummary {
                    id: project.id.clone(),
                    name: project.name.clone(),
                    connection_profile_id: project.connection_profile_id.clone(),
                    docker_project_name: project.docker_project_name.clone(),
                    deploy_source_type,
                    deploy_source_detail,
                    github_link: project
                        .github_link
                        .as_ref()
                        .map(|link| format!("{}/{}", link.owner, link.repo)),
                    environment_profile: summarize_environment_profile(
                        project.environment_profile.as_ref(),
                    ),
                }
            })
            .collect(),
        github_app_configured: config.github_app.is_some(),
    }
}

pub async fn build_connectivity_summary(app: &AppHandle) -> ConnectivitySummary {
    let hostinger = crate::credentials::load_credentials_status(app).ok();
    let digitalocean = crate::credentials::provider_credentials_status(app, "digitalocean")
        .ok()
        .is_some_and(|status| status.configured);

    let github_login = if github_pat_configured(app).unwrap_or(false) {
        match load_github_pat(app) {
            Ok(pat) => GitHubClient::new(pat).current_login().await.ok(),
            Err(_) => None,
        }
    } else {
        None
    };

    ConnectivitySummary {
        hostinger_configured: hostinger.as_ref().is_some_and(|status| status.configured),
        hostinger_vm_id: hostinger.and_then(|status| status.virtual_machine_id),
        digitalocean_configured: digitalocean,
        github_connected: github_login.is_some(),
        github_login,
    }
}

pub async fn build_diagnostics_report(app: &AppHandle) -> Result<String, DiagnosticLogError> {
    let workspace = load_workspace(app).unwrap_or_default();
    let summary = summarize_workspace(&workspace);
    let connectivity = build_connectivity_summary(app).await;
    let log_path = log_file_path(app)?.to_string_lossy().into_owned();
    let log_tail = read_log_tail(app, 200)?;
    let workspace_path = crate::workspace::workspace_file_path(app)
        .ok()
        .map(|path| path.to_string_lossy().into_owned());

    let credentials_present = credentials_presence(app)
        .map(|flags| serde_json::to_string(&flags).unwrap_or_else(|_| "{}".to_string()))
        .unwrap_or_else(|_| "unavailable".to_string());

    let workspace_json =
        serde_json::to_string_pretty(&summary).unwrap_or_else(|_| "{}".to_string());

    Ok(format!(
        "## HotDeploy diagnostics\n\n\
         - App version: {APP_VERSION}\n\
         - Platform: {}\n\
         - Workspace file: {}\n\
         - Log file: {log_path}\n\n\
         ### Connectivity\n\
         ```json\n{}\n```\n\n\
         ### Credentials present (not values)\n\
         {credentials_present}\n\n\
         ### Workspace summary\n\
         ```json\n{workspace_json}\n```\n\n\
         ### Recent log (last 200 lines)\n\
         ```\n{log_tail}\n```\n",
        std::env::consts::OS,
        workspace_path.unwrap_or_else(|| "unknown".to_string()),
        serde_json::to_string_pretty(&connectivity).unwrap_or_else(|_| "{}".to_string()),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn environment_profile_values_are_redacted_in_summary() {
        let config = WorkspaceConfig {
            deploy_projects: vec![crate::workspace::DeployProjectConfig {
                id: "p1".to_string(),
                name: "API".to_string(),
                connection_profile_id: "profile-1".to_string(),
                docker_project_name: "api".to_string(),
                deploy_source: crate::workspace::DeploySource::Github {
                    repository_url: "https://github.com/acme/api".to_string(),
                },
                environment_profile: Some("SECRET=abc\nPORT=3000".to_string()),
                github_link: None,
                auto_deploy_on_push: None,
                auto_deploy_last_run_id: None,
            }],
            ..WorkspaceConfig::default()
        };

        let summary = summarize_workspace(&config);
        assert_eq!(
            summary
                .deploy_projects
                .first()
                .expect("project")
                .environment_profile,
            "2 line(s), values redacted"
        );
    }
}
