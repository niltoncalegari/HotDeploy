use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::hostinger::error::HostingerError;

const MAX_HISTORY_ENTRIES: usize = 100;
const HISTORY_FILE: &str = "deployments.json";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeploymentRecord {
    pub id: String,
    pub timestamp: String,
    pub docker_project_name: String,
    pub virtual_machine_id: u64,
    pub action: String,
    pub outcome: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeploymentHistoryFile {
    #[serde(default)]
    entries: Vec<DeploymentRecord>,
}

fn history_path(app: &tauri::AppHandle) -> Result<PathBuf, HostingerError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| HostingerError::Keychain(error.to_string()))?;
    Ok(dir.join(HISTORY_FILE))
}

pub fn load_deployment_history(
    app: &tauri::AppHandle,
) -> Result<Vec<DeploymentRecord>, HostingerError> {
    let path = history_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let raw = fs::read_to_string(path).map_err(|error| {
        HostingerError::Keychain(format!("failed to read deployment history: {error}"))
    })?;

    let file: DeploymentHistoryFile = serde_json::from_str(&raw)?;
    Ok(file.entries)
}

pub fn append_deployment_record(
    app: &tauri::AppHandle,
    docker_project_name: String,
    virtual_machine_id: u64,
    action: String,
    outcome: String,
) -> Result<(), HostingerError> {
    let path = history_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            HostingerError::Keychain(format!("failed to create history directory: {error}"))
        })?;
    }

    let mut entries = load_deployment_history(app)?;
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or(0);

    entries.insert(
        0,
        DeploymentRecord {
            id: format!("{virtual_machine_id}-{millis}"),
            timestamp: format_timestamp(millis),
            docker_project_name,
            virtual_machine_id,
            action,
            outcome,
        },
    );
    entries.truncate(MAX_HISTORY_ENTRIES);

    let file = DeploymentHistoryFile { entries };
    let serialized = serde_json::to_string_pretty(&file)?;
    fs::write(path, serialized).map_err(|error| {
        HostingerError::Keychain(format!("failed to write deployment history: {error}"))
    })?;

    Ok(())
}

pub fn clear_deployment_history(app: &tauri::AppHandle) -> Result<(), HostingerError> {
    let path = history_path(app)?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| {
            HostingerError::Keychain(format!("failed to clear deployment history: {error}"))
        })?;
    }
    Ok(())
}

fn format_timestamp(millis: u128) -> String {
    millis.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deployment_record_serializes_camel_case() {
        let record = DeploymentRecord {
            id: "abc".into(),
            timestamp: "2026-06-24T00:00:00Z".into(),
            docker_project_name: "api".into(),
            virtual_machine_id: 1,
            action: "deploy".into(),
            outcome: "success".into(),
        };

        let json = serde_json::to_string(&record).expect("serialize");
        assert!(json.contains("\"dockerProjectName\""));
    }
}
