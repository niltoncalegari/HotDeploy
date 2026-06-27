use tauri::AppHandle;

use crate::credentials::{
    clear_ssh_credentials, load_ssh_credentials, save_ssh_credentials, ssh_configured,
};
use crate::github::runner::{
    install_runner_script, parse_runner_status_output, parse_uninstall_output, runner_name,
    uninstall_runner_script,
};
use crate::github::types::{RunnerInstallResult, RunnerState, RunnerStatus, RunnerUninstallResult};
use crate::hostinger::client::HostingerClient;
use crate::provider::registry::build_provider;
use crate::ssh::{run_ssh_command, test_ssh_echo, SshError};
use crate::workspace::load_workspace;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SshStatus {
    pub configured: bool,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SshConnectionTest {
    pub connected: bool,
    pub message: String,
}

#[tauri::command]
pub fn save_ssh_credentials_command(
    app: AppHandle,
    private_key: String,
    username: String,
) -> Result<(), String> {
    save_ssh_credentials(&app, &private_key, &username).map_err(String::from)
}

#[tauri::command]
pub fn clear_ssh_credentials_command(app: AppHandle) -> Result<(), String> {
    clear_ssh_credentials(&app).map_err(String::from)
}

#[tauri::command]
pub fn get_ssh_status(app: AppHandle) -> Result<SshStatus, String> {
    Ok(SshStatus {
        configured: ssh_configured(&app).map_err(String::from)?,
    })
}

#[tauri::command]
pub async fn test_ssh_connection(
    app: AppHandle,
    profile_id: String,
) -> Result<SshConnectionTest, String> {
    let (host, username, private_key) = resolve_ssh_target(&app, &profile_id).await?;
    match test_ssh_echo(&host, 22, &username, &private_key) {
        Ok(message) => Ok(SshConnectionTest {
            connected: true,
            message,
        }),
        Err(error) => Ok(SshConnectionTest {
            connected: false,
            message: error.to_string(),
        }),
    }
}

pub async fn install_runner_for_profile(
    app: &AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerInstallResult, String> {
    let (host, username, private_key) = resolve_ssh_target(app, &profile_id).await?;
    let client = crate::commands::github::client_from_app_public(app)?;
    let token = client
        .get_runner_registration_token(&owner, &repo)
        .await
        .map_err(String::from)?;

    let vm_id = workspace_profile_vm_id(app, &profile_id)?;
    let script = install_runner_script(&owner, &repo, vm_id, &token.token);
    let output =
        run_ssh_command(&host, 22, &username, &private_key, &script).map_err(String::from)?;

    let name = runner_name(&owner, &repo, vm_id);
    Ok(RunnerInstallResult {
        success: output.contains("hotdeploy-runner-installed"),
        message: output
            .lines()
            .last()
            .unwrap_or("Runner install completed")
            .to_string(),
        runner_name: name,
    })
}

pub async fn uninstall_runner_for_profile(
    app: &AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerUninstallResult, String> {
    let (host, username, private_key) = resolve_ssh_target(app, &profile_id).await?;
    let client = crate::commands::github::client_from_app_public(app)?;
    let token = client
        .get_runner_remove_token(&owner, &repo)
        .await
        .map_err(String::from)?;

    let vm_id = workspace_profile_vm_id(app, &profile_id)?;
    let script = uninstall_runner_script(&owner, &repo, vm_id, &token.token);
    let output =
        run_ssh_command(&host, 22, &username, &private_key, &script).map_err(String::from)?;

    let name = runner_name(&owner, &repo, vm_id);
    Ok(RunnerUninstallResult {
        success: parse_uninstall_output(&output),
        message: output
            .lines()
            .last()
            .unwrap_or("Runner uninstall completed")
            .to_string(),
        runner_name: name,
    })
}

pub async fn rotate_runner_for_profile(
    app: &AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerInstallResult, String> {
    install_runner_for_profile(app, profile_id, owner, repo).await
}

pub async fn runner_status_for_profile(
    app: &AppHandle,
    profile_id: String,
    owner: String,
    repo: String,
) -> Result<RunnerStatus, String> {
    let (host, username, private_key) = resolve_ssh_target(app, &profile_id).await?;
    let vm_id = workspace_profile_vm_id(app, &profile_id)?;
    let script = crate::github::runner::runner_status_script(&owner, &repo, vm_id);

    match run_ssh_command(&host, 22, &username, &private_key, &script) {
        Ok(output) => {
            let (state, runner_name) = parse_runner_status_output(&output);
            Ok(RunnerStatus {
                state,
                message: output.trim().to_string(),
                runner_name,
            })
        }
        Err(SshError::NotConfigured) => Ok(RunnerStatus {
            state: RunnerState::Error,
            message: "SSH not configured".to_string(),
            runner_name: runner_name(&owner, &repo, vm_id),
        }),
        Err(error) => Ok(RunnerStatus {
            state: RunnerState::Error,
            message: error.to_string(),
            runner_name: runner_name(&owner, &repo, vm_id),
        }),
    }
}

async fn resolve_ssh_target(
    app: &AppHandle,
    profile_id: &str,
) -> Result<(String, String, String), String> {
    let (private_key, username) = load_ssh_credentials(app).map_err(String::from)?;
    let workspace = load_workspace(app).map_err(String::from)?;
    let profile = workspace
        .connection_profiles
        .iter()
        .find(|item| item.id == profile_id)
        .ok_or_else(|| SshError::ProfileNotFound(profile_id.to_string()).to_string())?;

    if let Some(host) = profile
        .ssh_host
        .as_ref()
        .filter(|value| !value.is_empty())
        .cloned()
    {
        return Ok((host, username, private_key));
    }

    let _provider = build_provider(app, &profile.provider).map_err(String::from)?;
    let api_key = crate::credentials::load_api_key_for_provider(app, &profile.provider)
        .map_err(String::from)?;
    let client = HostingerClient::new(api_key);
    let vms = client
        .list_virtual_machines()
        .await
        .map_err(|error| error.to_string())?;

    let vm = vms
        .into_iter()
        .find(|item| item.id == profile.virtual_machine_id)
        .ok_or_else(|| {
            SshError::HostUnavailable(format!("VM {} not found", profile.virtual_machine_id))
                .to_string()
        })?;

    if vm.hostname.is_empty() {
        return Err(SshError::HostUnavailable("VPS hostname is empty".to_string()).to_string());
    }

    Ok((vm.hostname, username, private_key))
}

fn workspace_profile_vm_id(app: &AppHandle, profile_id: &str) -> Result<u64, String> {
    let workspace = load_workspace(app).map_err(String::from)?;
    workspace
        .connection_profiles
        .iter()
        .find(|item| item.id == profile_id)
        .map(|profile| profile.virtual_machine_id)
        .ok_or_else(|| SshError::ProfileNotFound(profile_id.to_string()).to_string())
}
