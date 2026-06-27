use super::error::HostingerError;
use super::types::{
    ActionResult, ApiActionResult, ApiDockerProject, ApiMetricsCollection, ApiProjectContent,
    ApiServiceLogs, ApiVirtualMachine, ConnectionTestResult, Container, DeployProjectRequest,
    DockerProject, LogEntry, ProjectContent, VirtualMachine, VpsMetrics,
};

pub const HOSTINGER_API_BASE: &str = "https://developers.hostinger.com";

pub struct HostingerClient {
    http: reqwest::Client,
    api_key: String,
}

impl HostingerClient {
    pub fn new(api_key: String) -> Self {
        Self {
            http: reqwest::Client::new(),
            api_key,
        }
    }

    pub async fn list_virtual_machines(&self) -> Result<Vec<VirtualMachine>, HostingerError> {
        let response = self.get("/api/vps/v1/virtual-machines").await?;
        let api_vms: Vec<ApiVirtualMachine> = response.json().await?;
        Ok(api_vms.into_iter().map(Into::into).collect())
    }

    pub async fn test_connection(
        &self,
        virtual_machine_id: u64,
    ) -> Result<ConnectionTestResult, HostingerError> {
        let projects = self.list_projects(virtual_machine_id).await?;
        Ok(ConnectionTestResult {
            connected: true,
            message: "Connected to Docker Manager".to_string(),
            project_count: projects.len(),
        })
    }

    pub async fn list_projects(
        &self,
        virtual_machine_id: u64,
    ) -> Result<Vec<DockerProject>, HostingerError> {
        let path = format!("/api/vps/v1/virtual-machines/{virtual_machine_id}/docker");
        let response = self.get(&path).await?;
        let api_projects: Vec<ApiDockerProject> = response.json().await?;
        Ok(api_projects.into_iter().map(Into::into).collect())
    }

    pub async fn get_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ProjectContent, HostingerError> {
        let path =
            format!("/api/vps/v1/virtual-machines/{virtual_machine_id}/docker/{project_name}");
        let response = self.get(&path).await?;
        let content: ApiProjectContent = response.json().await?;
        Ok(content.into())
    }

    pub async fn get_project_containers(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<Vec<Container>, HostingerError> {
        let path = format!(
            "/api/vps/v1/virtual-machines/{virtual_machine_id}/docker/{project_name}/containers"
        );
        let response = self.get(&path).await?;
        let api_containers: Vec<super::types::ApiContainer> = response.json().await?;
        Ok(api_containers.into_iter().map(Into::into).collect())
    }

    pub async fn get_vps_metrics(
        &self,
        virtual_machine_id: u64,
        date_from: &str,
        date_to: &str,
    ) -> Result<VpsMetrics, HostingerError> {
        let path = format!("/api/vps/v1/virtual-machines/{virtual_machine_id}/metrics");
        let url = format!("{HOSTINGER_API_BASE}{path}");
        let response = self
            .http
            .get(url)
            .bearer_auth(&self.api_key)
            .header("Accept", "application/json")
            .query(&[("date_from", date_from), ("date_to", date_to)])
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status().as_u16();
            let message = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".into());
            return Err(HostingerError::Api { status, message });
        }

        let api_metrics: ApiMetricsCollection = response.json().await?;
        Ok(api_metrics.into())
    }

    pub async fn deploy_project(
        &self,
        virtual_machine_id: u64,
        request: &DeployProjectRequest,
    ) -> Result<ActionResult, HostingerError> {
        let path = format!("/api/vps/v1/virtual-machines/{virtual_machine_id}/docker");
        let response = self.post_json(&path, request).await?;
        let action: ApiActionResult = response.json().await?;
        Ok(action.into())
    }

    pub async fn start_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, HostingerError> {
        self.project_action(virtual_machine_id, project_name, "start")
            .await
    }

    pub async fn stop_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, HostingerError> {
        self.project_action(virtual_machine_id, project_name, "stop")
            .await
    }

    pub async fn restart_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, HostingerError> {
        self.project_action(virtual_machine_id, project_name, "restart")
            .await
    }

    pub async fn update_project(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<ActionResult, HostingerError> {
        self.project_action(virtual_machine_id, project_name, "update")
            .await
    }

    pub async fn get_project_logs(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
    ) -> Result<Vec<LogEntry>, HostingerError> {
        let path =
            format!("/api/vps/v1/virtual-machines/{virtual_machine_id}/docker/{project_name}/logs");
        let response = self.get(&path).await?;
        let services: Vec<ApiServiceLogs> = response.json().await?;

        let mut entries = Vec::new();
        for service in services {
            for entry in service.entries {
                entries.push(LogEntry {
                    service: service.service.clone(),
                    timestamp: entry.timestamp,
                    message: entry.line,
                });
            }
        }

        Ok(entries)
    }

    async fn project_action(
        &self,
        virtual_machine_id: u64,
        project_name: &str,
        action: &str,
    ) -> Result<ActionResult, HostingerError> {
        let path = format!(
            "/api/vps/v1/virtual-machines/{virtual_machine_id}/docker/{project_name}/{action}"
        );
        let response = self.post_empty(&path).await?;
        let action_result: ApiActionResult = response.json().await?;
        Ok(action_result.into())
    }

    async fn get(&self, path: &str) -> Result<reqwest::Response, HostingerError> {
        let url = format!("{HOSTINGER_API_BASE}{path}");
        let response = self
            .http
            .get(url)
            .bearer_auth(&self.api_key)
            .header("Accept", "application/json")
            .send()
            .await?;

        if response.status().is_success() {
            return Ok(response);
        }

        let status = response.status().as_u16();
        let message = response
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".into());
        Err(HostingerError::Api { status, message })
    }

    async fn post_json<T: serde::Serialize>(
        &self,
        path: &str,
        body: &T,
    ) -> Result<reqwest::Response, HostingerError> {
        let url = format!("{HOSTINGER_API_BASE}{path}");
        let response = self
            .http
            .post(url)
            .bearer_auth(&self.api_key)
            .header("Accept", "application/json")
            .json(body)
            .send()
            .await?;

        if response.status().is_success() {
            return Ok(response);
        }

        let status = response.status().as_u16();
        let message = response
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".into());
        Err(HostingerError::Api { status, message })
    }

    async fn post_empty(&self, path: &str) -> Result<reqwest::Response, HostingerError> {
        let url = format!("{HOSTINGER_API_BASE}{path}");
        let response = self
            .http
            .post(url)
            .bearer_auth(&self.api_key)
            .header("Accept", "application/json")
            .send()
            .await?;

        if response.status().is_success() {
            return Ok(response);
        }

        let status = response.status().as_u16();
        let message = response
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".into());
        Err(HostingerError::Api { status, message })
    }
}

#[cfg(test)]
mod tests {
    use super::HOSTINGER_API_BASE;

    #[test]
    fn api_base_matches_official_hostinger_sdk() {
        assert_eq!(HOSTINGER_API_BASE, "https://developers.hostinger.com");
    }
}
