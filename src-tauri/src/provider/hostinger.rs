use crate::commands::credentials::load_api_key;
use crate::hostinger::client::HostingerClient;
use crate::hostinger::types::{
    ActionResult, ConnectionTestResult, Container, DeployProjectRequest, DockerProject, LogEntry,
    ProjectContent, VirtualMachine,
};

use super::error::ProviderError;
use super::traits::VpsProvider;

pub struct HostingerProvider {
    client: HostingerClient,
}

impl HostingerProvider {
    pub fn from_keychain() -> Result<Self, ProviderError> {
        let api_key = load_api_key().map_err(ProviderError::from)?;
        Ok(Self {
            client: HostingerClient::new(api_key),
        })
    }

    pub fn from_api_key(api_key: String) -> Self {
        Self {
            client: HostingerClient::new(api_key),
        }
    }
}

#[async_trait::async_trait]
impl VpsProvider for HostingerProvider {
    fn provider_id(&self) -> &'static str {
        "hostinger"
    }

    fn supports_docker_compose(&self) -> bool {
        true
    }

    async fn list_vms(&self) -> Result<Vec<VirtualMachine>, ProviderError> {
        self.client
            .list_virtual_machines()
            .await
            .map_err(ProviderError::from)
    }

    async fn test_connection(
        &self,
        virtual_machine_id: u64,
    ) -> Result<ConnectionTestResult, ProviderError> {
        self.client
            .test_connection(virtual_machine_id)
            .await
            .map_err(ProviderError::from)
    }

    async fn list_projects(
        &self,
        virtual_machine_id: u64,
    ) -> Result<Vec<DockerProject>, ProviderError> {
        self.client
            .list_projects(virtual_machine_id)
            .await
            .map_err(ProviderError::from)
    }

    async fn get_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ProjectContent, ProviderError> {
        self.client
            .get_project(virtual_machine_id, project_name)
            .await
            .map_err(ProviderError::from)
    }

    async fn get_project_containers(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<Vec<Container>, ProviderError> {
        self.client
            .get_project_containers(virtual_machine_id, project_name)
            .await
            .map_err(ProviderError::from)
    }

    async fn deploy_project(
        &self,
        virtual_machine_id: u64,
        request: &DeployProjectRequest,
    ) -> Result<ActionResult, ProviderError> {
        self.client
            .deploy_project(virtual_machine_id, request)
            .await
            .map_err(ProviderError::from)
    }

    async fn start_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        self.client
            .start_project(virtual_machine_id, project_name)
            .await
            .map_err(ProviderError::from)
    }

    async fn stop_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        self.client
            .stop_project(virtual_machine_id, project_name)
            .await
            .map_err(ProviderError::from)
    }

    async fn restart_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        self.client
            .restart_project(virtual_machine_id, project_name)
            .await
            .map_err(ProviderError::from)
    }

    async fn update_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        self.client
            .update_project(virtual_machine_id, project_name)
            .await
            .map_err(ProviderError::from)
    }

    async fn get_project_logs(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<Vec<LogEntry>, ProviderError> {
        self.client
            .get_project_logs(virtual_machine_id, project_name)
            .await
            .map_err(ProviderError::from)
    }
}
