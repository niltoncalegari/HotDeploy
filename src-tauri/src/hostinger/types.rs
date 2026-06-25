use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialsStatus {
    pub configured: bool,
    pub virtual_machine_id: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VirtualMachine {
    pub id: u64,
    pub hostname: String,
    pub state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionTestResult {
    pub connected: bool,
    pub message: String,
    pub project_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Container {
    pub name: String,
    pub image: String,
    pub health: String,
    pub ports: Vec<String>,
    pub state: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DockerProject {
    pub name: String,
    pub state: String,
    pub file_path: String,
    pub containers: Vec<Container>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectContent {
    pub content: String,
    pub environment: Option<String>,
}

// API request body uses snake_case field names.
#[derive(Debug, Clone, Serialize)]
pub struct DeployProjectRequest {
    pub project_name: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionResult {
    pub id: u64,
    pub name: String,
    pub state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub service: String,
    pub timestamp: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiVirtualMachine {
    pub id: u64,
    pub hostname: String,
    pub state: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiDockerProject {
    pub name: String,
    pub state: String,
    pub path: String,
    #[serde(default)]
    pub containers: Vec<ApiContainer>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiContainer {
    pub name: String,
    pub image: String,
    #[serde(default)]
    pub health: Option<String>,
    #[serde(default)]
    pub state: Option<String>,
    #[serde(default)]
    pub ports: Vec<ApiContainerPort>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiContainerPort {
    #[serde(default)]
    pub host_port: Option<u16>,
    #[serde(default)]
    pub container_port: Option<u16>,
    #[serde(default)]
    pub protocol: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiProjectContent {
    pub content: String,
    pub environment: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiActionResult {
    pub id: u64,
    pub name: String,
    pub state: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiServiceLogs {
    pub service: String,
    #[serde(default)]
    pub entries: Vec<ApiLogEntry>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiLogEntry {
    pub timestamp: String,
    pub line: String,
}

impl From<ApiVirtualMachine> for VirtualMachine {
    fn from(value: ApiVirtualMachine) -> Self {
        Self {
            id: value.id,
            hostname: value.hostname,
            state: value.state,
        }
    }
}

impl From<ApiDockerProject> for DockerProject {
    fn from(value: ApiDockerProject) -> Self {
        Self {
            name: value.name,
            state: value.state,
            file_path: value.path,
            containers: value.containers.into_iter().map(Into::into).collect(),
        }
    }
}

impl From<ApiContainer> for Container {
    fn from(value: ApiContainer) -> Self {
        let health = match value.health.as_deref() {
            Some("") | None => "none".to_string(),
            Some(health) => health.to_string(),
        };

        Self {
            name: value.name,
            image: value.image,
            health,
            ports: value.ports.into_iter().map(format_port).collect(),
            state: value.state,
        }
    }
}

impl From<ApiProjectContent> for ProjectContent {
    fn from(value: ApiProjectContent) -> Self {
        Self {
            content: value.content,
            environment: value.environment,
        }
    }
}

impl From<ApiActionResult> for ActionResult {
    fn from(value: ApiActionResult) -> Self {
        Self {
            id: value.id,
            name: value.name,
            state: value.state,
        }
    }
}

fn format_port(port: ApiContainerPort) -> String {
    match (port.host_port, port.container_port) {
        (Some(host), Some(container)) => {
            let protocol = port.protocol.unwrap_or_else(|| "tcp".to_string());
            format!("{host}:{container}/{protocol}")
        }
        (Some(host), None) => host.to_string(),
        (None, Some(container)) => container.to_string(),
        (None, None) => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_empty_health_to_none() {
        let container = Container::from(ApiContainer {
            name: "web".into(),
            image: "nginx:latest".into(),
            health: Some(String::new()),
            state: Some("running".into()),
            ports: vec![ApiContainerPort {
                host_port: Some(8080),
                container_port: Some(80),
                protocol: Some("tcp".into()),
            }],
        });

        assert_eq!(container.health, "none");
        assert_eq!(container.ports, vec!["8080:80/tcp"]);
    }
}
