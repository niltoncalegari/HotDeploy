use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubStatus {
    pub connected: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub login: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubConnectionTest {
    pub login: String,
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubRepo {
    pub id: u64,
    pub name: String,
    pub full_name: String,
    pub owner: String,
    pub default_branch: String,
    pub html_url: String,
    pub private: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubSecretMeta {
    pub name: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubVariable {
    pub name: String,
    pub value: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowOptions {
    pub docker_project_name: String,
    pub vm_id: u64,
    pub trigger: String,
    pub runner_type: String,
    pub include_test_step: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitWorkflowResult {
    pub sha: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunnerRegistrationToken {
    pub token: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunnerInstallResult {
    pub success: bool,
    pub message: String,
    pub runner_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum RunnerState {
    NotInstalled,
    Installing,
    Online,
    Offline,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunnerStatus {
    pub state: RunnerState,
    pub message: String,
    pub runner_name: String,
}
