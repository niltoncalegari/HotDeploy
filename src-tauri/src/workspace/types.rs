use serde::{Deserialize, Serialize};

pub const WORKSPACE_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ThemeMode {
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspacePreferences {
    #[serde(default = "default_theme")]
    pub theme: ThemeMode,
}

fn default_theme() -> ThemeMode {
    ThemeMode::Light
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub id: String,
    pub label: String,
    pub provider: String,
    pub virtual_machine_id: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_host: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum DeploySource {
    #[serde(rename = "local", rename_all = "camelCase")]
    Local { compose_file_path: String },
    #[serde(rename = "github", rename_all = "camelCase")]
    Github { repository_url: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeployProjectConfig {
    pub id: String,
    pub name: String,
    pub connection_profile_id: String,
    pub docker_project_name: String,
    pub deploy_source: DeploySource,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment_profile: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub github_link: Option<GitHubLink>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub auto_deploy_on_push: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub auto_deploy_last_run_id: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitHubLink {
    pub owner: String,
    pub repo: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitHubAppRegistration {
    pub client_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceConfig {
    pub version: u32,
    pub preferences: WorkspacePreferences,
    #[serde(default)]
    pub connection_profiles: Vec<ConnectionProfile>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_connection_profile_id: Option<String>,
    #[serde(default)]
    pub deploy_projects: Vec<DeployProjectConfig>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub onboarding_completed: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub github_app: Option<GitHubAppRegistration>,
}

impl Default for WorkspaceConfig {
    fn default() -> Self {
        Self {
            version: WORKSPACE_VERSION,
            preferences: WorkspacePreferences {
                theme: ThemeMode::Light,
            },
            connection_profiles: Vec::new(),
            active_connection_profile_id: None,
            deploy_projects: Vec::new(),
            onboarding_completed: None,
            github_app: None,
        }
    }
}
