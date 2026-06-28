mod error;
mod types;

pub use error::WorkspaceError;
pub use types::{
    ConnectionProfile, DeployProjectConfig, DeploySource, GitHubAppRegistration, WorkspaceConfig,
    WORKSPACE_VERSION,
};

use std::fs;
use std::path::PathBuf;

use tauri::Manager;

use crate::github::app_config::{load_github_app_registration, save_github_app_client_id};

const WORKSPACE_FILE: &str = "workspace.json";

pub fn workspace_file_path(app: &tauri::AppHandle) -> Result<PathBuf, WorkspaceError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| WorkspaceError::ConfigDir(error.to_string()))?;

    fs::create_dir_all(&dir)?;
    Ok(dir.join(WORKSPACE_FILE))
}

fn read_workspace_file(app: &tauri::AppHandle) -> Result<WorkspaceConfig, WorkspaceError> {
    let path = workspace_file_path(app)?;

    if !path.exists() {
        return Ok(WorkspaceConfig::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|error| WorkspaceError::Read(error.to_string()))?;
    serde_json::from_str(&contents).map_err(WorkspaceError::from)
}

fn hydrate_persisted_config(
    app: &tauri::AppHandle,
    config: &mut WorkspaceConfig,
) -> Result<bool, WorkspaceError> {
    let mut migrated = false;

    if config.github_app.is_none() {
        if let Some((client_id, slug)) = load_github_app_registration(app) {
            config.github_app = Some(GitHubAppRegistration { client_id, slug });
            migrated = true;
        }
    }

    if let Some(registration) = &config.github_app {
        save_github_app_client_id(app, &registration.client_id, registration.slug.as_deref())
            .map_err(|error| WorkspaceError::Write(error.to_string()))?;
    }

    Ok(migrated)
}

pub fn load_workspace(app: &tauri::AppHandle) -> Result<WorkspaceConfig, WorkspaceError> {
    let mut config = read_workspace_file(app)?;
    let migrated = hydrate_persisted_config(app, &mut config)?;

    if migrated {
        save_workspace(app, config.clone())?;
    }

    Ok(config)
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

pub fn persist_github_app_registration(
    app: &tauri::AppHandle,
    client_id: &str,
    slug: Option<&str>,
) -> Result<(), WorkspaceError> {
    save_github_app_client_id(app, client_id, slug)
        .map_err(|error| WorkspaceError::Write(error.to_string()))?;

    let mut config = read_workspace_file(app)?;
    config.github_app = Some(GitHubAppRegistration {
        client_id: client_id.to_string(),
        slug: slug.map(str::to_string),
    });
    save_workspace(app, config)
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
    fn onboarding_completed_round_trips_as_true() {
        let config = WorkspaceConfig {
            onboarding_completed: Some(true),
            ..WorkspaceConfig::default()
        };

        let json = serde_json::to_string(&config).expect("serialize workspace");
        assert!(json.contains("\"onboardingCompleted\":true"));

        let parsed: WorkspaceConfig = serde_json::from_str(&json).expect("deserialize workspace");
        assert_eq!(parsed.onboarding_completed, Some(true));
    }

    #[test]
    fn github_app_registration_round_trips_through_json() {
        use super::types::GitHubAppRegistration;

        let config = WorkspaceConfig {
            github_app: Some(GitHubAppRegistration {
                client_id: "Iv1.test".to_string(),
                slug: Some("hotdeploy-desktop".to_string()),
            }),
            ..WorkspaceConfig::default()
        };

        let json = serde_json::to_string(&config).expect("serialize workspace");
        let parsed: WorkspaceConfig = serde_json::from_str(&json).expect("deserialize workspace");
        assert_eq!(config.github_app, parsed.github_app);
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
                auto_deploy_on_push: None,
                auto_deploy_last_run_id: None,
            }],
            onboarding_completed: None,
            github_app: None,
        };

        let json = serde_json::to_string_pretty(&config).expect("serialize workspace");
        let parsed: WorkspaceConfig = serde_json::from_str(&json).expect("deserialize workspace");

        assert_eq!(config, parsed);
    }
}
