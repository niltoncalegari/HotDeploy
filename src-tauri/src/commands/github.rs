use tauri::AppHandle;

use crate::credentials::{
    clear_github_pat, get_github_auth_method, github_pat_configured, load_github_pat,
    save_github_app_token, save_github_pat,
};
use crate::github::app_config::resolve_github_app_client_id;
use crate::github::client::GitHubClient;
use crate::github::env_profile::parse_env_profile;
use crate::github::gh_cli::read_gh_auth_token;
use crate::github::oauth::DeviceFlowStart;
use crate::github::oauth::{poll_device_token, start_device_flow};
use crate::github::register::{get_github_app_config, register_github_app};
use crate::github::types::{
    AutoDeployCheckResult, CommitWorkflowResult, EnvProfileSyncResult, GitHubAppConfig,
    GitHubAppRegisterResult, GitHubAuthMethod, GitHubConnectionTest, GitHubEnvironment, GitHubRepo,
    GitHubSecretMeta, GitHubStatus, GitHubVariable, RunnerInstallResult, RunnerRegistrationToken,
    RunnerStatus, RunnerUninstallResult, WorkflowOptions,
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
pub async fn uninstall_self_hosted_runner(
    app: AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerUninstallResult, String> {
    crate::commands::ssh::uninstall_runner_for_profile(&app, profile_id, owner, repo).await
}

#[tauri::command]
pub async fn rotate_runner_registration(
    app: AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerInstallResult, String> {
    crate::commands::ssh::rotate_runner_for_profile(&app, profile_id, owner, repo).await
}

#[tauri::command]
pub fn parse_github_repo_url_command(url: String) -> Result<(String, String), String> {
    crate::github::client::parse_repo_from_url(&url).map_err(String::from)
}

#[tauri::command]
pub async fn sync_env_profile_to_github_secrets(
    app: AppHandle,
    owner: String,
    repo: String,
    environment_profile: String,
    keys: Vec<String>,
) -> Result<EnvProfileSyncResult, String> {
    let client = github_client_from_app(&app)?;
    let pairs = parse_env_profile(&environment_profile);
    let key_set: std::collections::HashSet<&str> = keys.iter().map(String::as_str).collect();

    let mut imported = Vec::new();
    let mut skipped = Vec::new();

    for (key, value) in pairs {
        if !key_set.contains(key.as_str()) {
            skipped.push(key);
            continue;
        }
        client
            .upsert_secret(&owner, &repo, &key, &value)
            .await
            .map_err(String::from)?;
        imported.push(key);
    }

    Ok(EnvProfileSyncResult { imported, skipped })
}

#[tauri::command]
pub async fn list_github_environments(
    app: AppHandle,
    owner: String,
    repo: String,
) -> Result<Vec<GitHubEnvironment>, String> {
    let client = github_client_from_app(&app)?;
    client
        .list_environments(&owner, &repo)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn create_github_environment(
    app: AppHandle,
    owner: String,
    repo: String,
    name: String,
) -> Result<GitHubEnvironment, String> {
    let client = github_client_from_app(&app)?;
    client
        .create_environment(&owner, &repo, &name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn delete_github_environment(
    app: AppHandle,
    owner: String,
    repo: String,
    name: String,
) -> Result<(), String> {
    let client = github_client_from_app(&app)?;
    client
        .delete_environment(&owner, &repo, &name)
        .await
        .map_err(String::from)
}

#[tauri::command]
pub async fn check_auto_deploy_run(
    app: AppHandle,
    owner: String,
    repo: String,
    branch: String,
    last_deployed_run_id: Option<u64>,
) -> Result<AutoDeployCheckResult, String> {
    let client = github_client_from_app(&app)?;
    let run = client
        .latest_successful_run_on_branch(&owner, &repo, &branch)
        .await
        .map_err(String::from)?;
    Ok(GitHubClient::evaluate_auto_deploy(
        run.as_ref(),
        last_deployed_run_id,
    ))
}

#[tauri::command]
pub async fn get_github_app_config_command(app: AppHandle) -> Result<GitHubAppConfig, String> {
    get_github_app_config(&app).await.map_err(String::from)
}

#[tauri::command]
pub async fn register_github_app_command(
    app: AppHandle,
) -> Result<GitHubAppRegisterResult, String> {
    register_github_app(&app).await.map_err(String::from)
}

#[tauri::command]
pub async fn connect_github_from_gh_cli(app: AppHandle) -> Result<GitHubStatus, String> {
    let token = read_gh_auth_token().map_err(String::from)?;
    save_github_app_token(&app, &token).map_err(String::from)?;
    let client = GitHubClient::new(token);
    let login = client.current_login().await.ok();
    Ok(GitHubStatus {
        connected: true,
        login,
    })
}

#[tauri::command]
pub async fn start_github_device_flow(app: AppHandle) -> Result<DeviceFlowStart, String> {
    let client_id = resolve_github_app_client_id(&app);
    start_device_flow(&client_id).await.map_err(String::from)
}

#[tauri::command]
pub async fn poll_github_device_token(
    app: AppHandle,
    device_code: String,
) -> Result<GitHubStatus, String> {
    let client_id = resolve_github_app_client_id(&app);
    match poll_device_token(&client_id, &device_code)
        .await
        .map_err(String::from)?
    {
        Some(token) => {
            save_github_app_token(&app, &token).map_err(String::from)?;
            let client = GitHubClient::new(token);
            let login = client.current_login().await.ok();
            Ok(GitHubStatus {
                connected: true,
                login,
            })
        }
        None => Ok(GitHubStatus {
            connected: false,
            login: None,
        }),
    }
}

#[tauri::command]
pub fn get_github_auth_method_command(app: AppHandle) -> Result<GitHubAuthMethod, String> {
    let method = get_github_auth_method(&app)
        .map_err(String::from)?
        .unwrap_or_else(|| "none".to_string());
    Ok(GitHubAuthMethod { method })
}
