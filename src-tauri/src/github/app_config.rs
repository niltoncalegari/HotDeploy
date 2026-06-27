use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

use super::app::{GITHUB_APP_CLIENT_ID, PLACEHOLDER_GITHUB_APP_CLIENT_ID};
use super::error::GitHubError;

const GITHUB_APP_FILE: &str = "github-app.json";

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GitHubAppFile {
    client_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    slug: Option<String>,
}

fn github_app_file_path(app: &AppHandle) -> Result<PathBuf, GitHubError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    fs::create_dir_all(&dir).map_err(|error| GitHubError::Request(error.to_string()))?;

    Ok(dir.join(GITHUB_APP_FILE))
}

pub fn is_placeholder_client_id(client_id: &str) -> bool {
    client_id == PLACEHOLDER_GITHUB_APP_CLIENT_ID
}

pub fn resolve_github_app_client_id(app: &AppHandle) -> String {
    load_github_app_client_id(app)
        .filter(|client_id| !client_id.is_empty() && !is_placeholder_client_id(client_id))
        .unwrap_or_else(|| GITHUB_APP_CLIENT_ID.to_string())
}

pub fn load_github_app_client_id(app: &AppHandle) -> Option<String> {
    let path = github_app_file_path(app).ok()?;
    if !path.exists() {
        return None;
    }

    let contents = fs::read_to_string(path).ok()?;
    let file: GitHubAppFile = serde_json::from_str(&contents).ok()?;
    if file.client_id.is_empty() {
        None
    } else {
        Some(file.client_id)
    }
}

pub fn save_github_app_client_id(
    app: &AppHandle,
    client_id: &str,
    slug: Option<&str>,
) -> Result<(), GitHubError> {
    let path = github_app_file_path(app)?;
    let file = GitHubAppFile {
        client_id: client_id.to_string(),
        slug: slug.map(str::to_string),
    };
    let contents = serde_json::to_string_pretty(&file)
        .map_err(|error| GitHubError::Request(error.to_string()))?;
    fs::write(path, contents).map_err(|error| GitHubError::Request(error.to_string()))?;
    Ok(())
}

pub fn github_app_configured(app: &AppHandle) -> bool {
    let client_id = resolve_github_app_client_id(app);
    !is_placeholder_client_id(&client_id)
}
