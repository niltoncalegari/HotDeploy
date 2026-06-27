mod error;
mod types;

pub use error::WorkspaceError;
pub use types::{
    ConnectionProfile, DeployProjectConfig, DeploySource, WorkspaceConfig, WORKSPACE_VERSION,
};

use std::fs;
use std::path::PathBuf;

use tauri::Manager;

const WORKSPACE_FILE: &str = "workspace.json";

pub fn workspace_file_path(app: &tauri::AppHandle) -> Result<PathBuf, WorkspaceError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| WorkspaceError::ConfigDir(error.to_string()))?;

    fs::create_dir_all(&dir)?;
    Ok(dir.join(WORKSPACE_FILE))
}

pub fn load_workspace(app: &tauri::AppHandle) -> Result<WorkspaceConfig, WorkspaceError> {
    let path = workspace_file_path(app)?;

    if !path.exists() {
        return Ok(WorkspaceConfig::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|error| WorkspaceError::Read(error.to_string()))?;
    serde_json::from_str(&contents).map_err(WorkspaceError::from)
}

pub fn save_workspace(
    app: &tauri::AppHandle,
    mut config: WorkspaceConfig,
) -> Result<(), WorkspaceError> {
    let path = workspace_file_path(app)?;
    config.version = WORKSPACE_VERSION;

    let contents = serde_json::to_string_pretty(&config)?;
    fs::write(&path, contents).map_err(|error| WorkspaceError::Write(error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::types::{
        ConnectionProfile, DeployProjectConfig, DeploySource, ThemeMode, WorkspaceConfig,
        WorkspacePreferences, WORKSPACE_VERSION,
    };

    #[test]
    fn default_workspace_serializes_to_json() {
        let config = WorkspaceConfig::default();
        let json = serde_json::to_string(&config).expect("serialize default workspace");

        assert!(json.contains("\"theme\":\"light\""));
        assert!(json.contains("\"connectionProfiles\":[]"));
        assert!(json.contains("\"deployProjects\":[]"));
    }

    #[test]
    fn workspace_round_trips_through_json() {
        let config = WorkspaceConfig {
            version: WORKSPACE_VERSION,
            preferences: WorkspacePreferences {
                theme: ThemeMode::Dark,
            },
            connection_profiles: vec![ConnectionProfile {
                id: "profile-1".to_string(),
                label: "Production".to_string(),
                provider: "hostinger".to_string(),
                virtual_machine_id: 42,
                ssh_host: None,
            }],
            active_connection_profile_id: Some("profile-1".to_string()),
            deploy_projects: vec![DeployProjectConfig {
                id: "project-1".to_string(),
                name: "API".to_string(),
                connection_profile_id: "profile-1".to_string(),
                docker_project_name: "api".to_string(),
                deploy_source: DeploySource::Local {
                    compose_file_path: "/srv/api/docker-compose.yaml".to_string(),
                },
                environment_profile: Some("NODE_ENV=production".to_string()),
                github_link: None,
            }],
        };

        let json = serde_json::to_string_pretty(&config).expect("serialize workspace");
        let parsed: WorkspaceConfig = serde_json::from_str(&json).expect("deserialize workspace");

        assert_eq!(config, parsed);
    }
}
