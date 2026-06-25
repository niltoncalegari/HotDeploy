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
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum DeploySource {
    Local { compose_file_path: String },
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
        }
    }
}
