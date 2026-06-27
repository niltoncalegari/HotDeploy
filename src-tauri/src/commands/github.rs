use tauri::AppHandle;

use crate::credentials::{
    clear_github_pat, github_pat_configured, load_github_pat, save_github_pat,
};
use crate::github::client::GitHubClient;
use crate::github::types::{
    CommitWorkflowResult, GitHubConnectionTest, GitHubRepo, GitHubSecretMeta, GitHubStatus,
    GitHubVariable, RunnerInstallResult, RunnerRegistrationToken, RunnerStatus, WorkflowOptions,
};
use crate::github::workflow::generate_workflow_yaml;

fn github_client_from_app(app: &AppHandle) -> Result<GitHubClient, String> {
    let pat = load_github_pat(app).map_err(String::from)?;
    Ok(GitHubClient::new(pat))
}

pub(crate) fn client_from_app_public(app: &AppHandle) -> Result<GitHubClient, String> {
    github_client_from_app(app)
}

#[tauri::command]
pub async fn save_github_pat_command(app: AppHandle, pat: String) -> Result<(), String> {
    save_github_pat(&app, &pat).map_err(String::from)
}

#[tauri::command]
pub async fn clear_github_pat_command(app: AppHandle) -> Result<(), String> {
    clear_github_pat(&app).map_err(String::from)
}

#[tauri::command]
pub async fn get_github_status(app: AppHandle) -> Result<GitHubStatus, String> {
    if !github_pat_configured(&app).map_err(String::from)? {
        return Ok(GitHubStatus {
            connected: false,
            login: None,
        });
    }

    let client = github_client_from_app(&app)?;
    match client.current_login().await {
        Ok(login) => Ok(GitHubStatus {
            connected: true,
            login: Some(login),
        }),
        Err(_) => Ok(GitHubStatus {
            connected: true,
            login: None,
        }),
    }
}

#[tauri::command]
pub async fn test_github_connection(app: AppHandle) -> Result<GitHubConnectionTest, String> {
    let client = github_client_from_app(&app)?;
    client.test_connection().await.map_err(String::from)
}

#[tauri::command]
pub async fn list_github_repos(
    app: AppHandle,
    page: Option<u32>,
) -> Result<Vec<GitHubRepo>, String> {
    let client = github_client_from_app(&app)?;
    client
        .list_repos(page.unwrap_or(1))
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn list_github_secrets(
    app: AppHandle,
    owner: String,
    repo: String,
) -> Result<Vec<GitHubSecretMeta>, String> {
    let client = github_client_from_app(&app)?;
    client
        .list_secrets(&owner, &repo)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn upsert_github_secret(
    app: AppHandle,
    owner: String,
    repo: String,
    name: String,
    value: String,
) -> Result<(), String> {
    let client = github_client_from_app(&app)?;
    client
        .upsert_secret(&owner, &repo, &name, &value)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn delete_github_secret(
    app: AppHandle,
    owner: String,
    repo: String,
    name: String,
) -> Result<(), String> {
    let client = github_client_from_app(&app)?;
    client
        .delete_secret(&owner, &repo, &name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn list_github_variables(
    app: AppHandle,
    owner: String,
    repo: String,
) -> Result<Vec<GitHubVariable>, String> {
    let client = github_client_from_app(&app)?;
    client
        .list_variables(&owner, &repo)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn upsert_github_variable(
    app: AppHandle,
    owner: String,
    repo: String,
    name: String,
    value: String,
) -> Result<(), String> {
    let client = github_client_from_app(&app)?;
    client
        .upsert_variable(&owner, &repo, &name, &value)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn delete_github_variable(
    app: AppHandle,
    owner: String,
    repo: String,
    name: String,
) -> Result<(), String> {
    let client = github_client_from_app(&app)?;
    client
        .delete_variable(&owner, &repo, &name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub fn generate_workflow_yaml_command(options: WorkflowOptions) -> Result<String, String> {
    Ok(generate_workflow_yaml(&options))
}

#[tauri::command]
pub async fn commit_workflow_file(
    app: AppHandle,
    owner: String,
    repo: String,
    content: String,
    message: String,
) -> Result<CommitWorkflowResult, String> {
    let client = github_client_from_app(&app)?;
    client
        .commit_workflow_file(&owner, &repo, &content, &message)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn get_runner_registration_token(
    app: AppHandle,
    owner: String,
    repo: String,
) -> Result<RunnerRegistrationToken, String> {
    let client = github_client_from_app(&app)?;
    client
        .get_runner_registration_token(&owner, &repo)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn install_self_hosted_runner(
    app: AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerInstallResult, String> {
    crate::commands::ssh::install_runner_for_profile(&app, profile_id, owner, repo).await
}

#[tauri::command]
pub async fn get_runner_status(
    app: AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerStatus, String> {
    crate::commands::ssh::runner_status_for_profile(&app, profile_id, owner, repo).await
}

#[tauri::command]
pub fn parse_github_repo_url_command(url: String) -> Result<(String, String), String> {
    crate::github::client::parse_repo_from_url(&url).map_err(String::from)
}
