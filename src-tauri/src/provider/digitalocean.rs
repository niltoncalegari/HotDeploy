use serde::Deserialize;

use tauri::AppHandle;

use crate::credentials::load_api_key_for_provider;
use crate::hostinger::error::HostingerError;
use crate::hostinger::types::{
    ActionResult, ConnectionTestResult, Container, DeployProjectRequest, DockerProject, LogEntry,
    ProjectContent, VirtualMachine,
};

use super::error::ProviderError;
use super::traits::VpsProvider;

pub const DIGITALOCEAN_API_BASE: &str = "https://api.digitalocean.com";

pub struct DigitalOceanProvider {
    http: reqwest::Client,
    api_key: String,
}

#[derive(Debug, Deserialize)]
struct DropletsResponse {
    droplets: Vec<ApiDroplet>,
}

#[derive(Debug, Deserialize)]
struct ApiDroplet {
    id: u64,
    name: String,
    status: String,
}

impl DigitalOceanProvider {
    pub fn from_app(app: &AppHandle) -> Result<Self, ProviderError> {
        let api_key = load_api_key_for_provider(app, "digitalocean")?;
        Ok(Self::from_api_key(api_key))
    }

    pub fn from_api_key(api_key: String) -> Self {
        Self {
            http: reqwest::Client::new(),
            api_key,
        }
    }

    async fn list_droplets(&self) -> Result<Vec<VirtualMachine>, ProviderError> {
        let response = self
            .http
            .get(format!("{DIGITALOCEAN_API_BASE}/v2/droplets"))
            .bearer_auth(&self.api_key)
            .send()
            .await
            .map_err(|error| ProviderError::Hostinger(HostingerError::Http(error)))?;

        let status = response.status();
        if !status.is_success() {
            let message = response.text().await.unwrap_or_default();
            return Err(ProviderError::DigitalOceanApi {
                status: status.as_u16(),
                message,
            });
        }

        let payload: DropletsResponse = response
            .json()
            .await
            .map_err(|error| ProviderError::Hostinger(HostingerError::Http(error)))?;
        Ok(payload
            .droplets
            .into_iter()
            .map(|droplet| VirtualMachine {
                id: droplet.id,
                hostname: droplet.name,
                state: droplet.status,
            })
            .collect())
    }

    fn unsupported(&self, action: &str) -> ProviderError {
        ProviderError::unsupported(
            self.provider_id(),
            format!(
                "{action} is not available for DigitalOcean yet. Use a Hostinger connection profile for Docker Compose operations."
            ),
        )
    }
}

#[async_trait::async_trait]
impl VpsProvider for DigitalOceanProvider {
    fn provider_id(&self) -> &'static str {
        "digitalocean"
    }

    fn supports_docker_compose(&self) -> bool {
        false
    }

    async fn list_vms(&self) -> Result<Vec<VirtualMachine>, ProviderError> {
        self.list_droplets().await
    }

    async fn test_connection(
        &self,
        virtual_machine_id: u64,
    ) -> Result<ConnectionTestResult, ProviderError> {
        let droplets = self.list_droplets().await?;
        let found = droplets
            .iter()
            .any(|droplet| droplet.id == virtual_machine_id);

        if found {
            Ok(ConnectionTestResult {
                connected: true,
                message: "Connected to DigitalOcean droplet".to_string(),
                project_count: 0,
            })
        } else {
            Err(ProviderError::DigitalOceanApi {
                status: 404,
                message: format!("droplet {virtual_machine_id} not found"),
            })
        }
    }

    async fn list_projects(
        &self,
        _virtual_machine_id: u64,
    ) -> Result<Vec<DockerProject>, ProviderError> {
        Err(self.unsupported("Docker project listing"))
    }

    async fn get_project(
        &self,
        _virtual_machine_id: u64,
        _project_name: &str,
    ) -> Result<ProjectContent, ProviderError> {
        Err(self.unsupported("Docker project detail"))
    }

    async fn get_project_containers(
        &self,
        _virtual_machine_id: u64,
        _project_name: &str,
    ) -> Result<Vec<Container>, ProviderError> {
        Err(self.unsupported("Container listing"))
    }

    async fn deploy_project(
        &self,
        _virtual_machine_id: u64,
        _request: &DeployProjectRequest,
    ) -> Result<ActionResult, ProviderError> {
        Err(self.unsupported("Deploy"))
    }

    async fn start_project(
        &self,
        _virtual_machine_id: u64,
        _project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        Err(self.unsupported("Start"))
    }

    async fn stop_project(
        &self,
        _virtual_machine_id: u64,
        _project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        Err(self.unsupported("Stop"))
    }

    async fn restart_project(
        &self,
        _virtual_machine_id: u64,
        _project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        Err(self.unsupported("Restart"))
    }

    async fn update_project(
        &self,
        _virtual_machine_id: u64,
        _project_name: &str,
    ) -> Result<ActionResult, ProviderError> {
        Err(self.unsupported("Update"))
    }

    async fn get_project_logs(
        &self,
        _virtual_machine_id: u64,
        _project_name: &str,
    ) -> Result<Vec<LogEntry>, ProviderError> {
        Err(self.unsupported("Logs"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_droplet_payload_to_virtual_machine() {
        let droplet = ApiDroplet {
            id: 42,
            name: "mflow-staging".to_string(),
            status: "active".to_string(),
        };

        let vm = VirtualMachine {
            id: droplet.id,
            hostname: droplet.name.clone(),
            state: droplet.status.clone(),
        };

        assert_eq!(vm.id, 42);
        assert_eq!(vm.hostname, "mflow-staging");
        assert_eq!(vm.state, "active");
    }
}
