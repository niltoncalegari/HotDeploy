use serde::Serialize;

use crate::hostinger::types::{
    ActionResult, ConnectionTestResult, Container, DeployProjectRequest, DockerProject, LogEntry,
    ProjectContent, VirtualMachine, VpsMetrics,
};

use super::error::ProviderError;

#[async_trait::async_trait]
pub trait VpsProvider: Send + Sync {
    fn provider_id(&self) -> &'static str;

    fn supports_docker_compose(&self) -> bool;

    async fn list_vms(&self) -> Result<Vec<VirtualMachine>, ProviderError>;

    async fn test_connection(
        &self,
        virtual_machine_id: u64,
    ) -> Result<ConnectionTestResult, ProviderError>;

    async fn list_projects(
        &self,
        virtual_machine_id: u64,
    ) -> Result<Vec<DockerProject>, ProviderError>;

    async fn get_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ProjectContent, ProviderError>;

    async fn get_project_containers(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<Vec<Container>, ProviderError>;

    async fn deploy_project(
        &self,
        virtual_machine_id: u64,
        request: &DeployProjectRequest,
    ) -> Result<ActionResult, ProviderError>;

    async fn start_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError>;

    async fn stop_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError>;

    async fn restart_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError>;

    async fn update_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError>;

    async fn get_project_logs(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<Vec<LogEntry>, ProviderError>;

    async fn get_vps_metrics(
        &self,
        virtual_machine_id: u64,
        date_from: &str,
        date_to: &str,
    ) -> Result<VpsMetrics, ProviderError> {
        let _ = (virtual_machine_id, date_from, date_to);
        Err(ProviderError::unsupported(
            self.provider_id(),
            "VPS metrics",
        ))
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderErrorPayload {
    code: String,
    message: String,
}

impl From<ProviderError> for String {
    fn from(error: ProviderError) -> Self {
        let payload = match error {
            ProviderError::Hostinger(inner) => ProviderErrorPayload {
                code: inner.code().to_string(),
                message: inner.to_string(),
            },
            ProviderError::NotConfigured(provider) => ProviderErrorPayload {
                code: "NOT_CONFIGURED".to_string(),
                message: format!("provider not configured: {provider}"),
            },
            ProviderError::UnknownProvider(provider) => ProviderErrorPayload {
                code: "UNKNOWN_PROVIDER".to_string(),
                message: format!("unknown provider: {provider}"),
            },
            ProviderError::Unsupported { provider, message } => ProviderErrorPayload {
                code: "UNSUPPORTED".to_string(),
                message: format!("{provider}: {message}"),
            },
            ProviderError::DigitalOceanApi { status, message } => ProviderErrorPayload {
                code: "API_ERROR".to_string(),
                message: format!("digitalocean api error ({status}): {message}"),
            },
            ProviderError::Serialization(inner) => ProviderErrorPayload {
                code: "SERIALIZATION_ERROR".to_string(),
                message: inner.to_string(),
            },
        };

        serde_json::to_string(&payload).unwrap_or_else(|_| {
            "{\"code\":\"UNKNOWN\",\"message\":\"unexpected error\"}".to_string()
        })
    }
}
