use std::collections::HashMap;

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
pub struct ContainerStats {
    pub cpu_percentage: Option<f64>,
    pub memory_percentage: Option<f64>,
    pub memory_used: Option<f64>,
    pub memory_total: Option<f64>,
    pub net_in: Option<i64>,
    pub net_out: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Container {
    pub name: String,
    pub image: String,
    pub health: String,
    pub ports: Vec<String>,
    pub state: Option<String>,
    pub stats: Option<ContainerStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricPoint {
    pub timestamp: String,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricSeries {
    pub unit: String,
    pub points: Vec<MetricPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VpsMetrics {
    pub cpu_usage: Option<MetricSeries>,
    pub ram_usage: Option<MetricSeries>,
    pub disk_space: Option<MetricSeries>,
    pub incoming_traffic: Option<MetricSeries>,
    pub outgoing_traffic: Option<MetricSeries>,
    pub uptime: Option<MetricSeries>,
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
pub(crate) struct ApiContainerStats {
    #[serde(default)]
    pub cpu_percentage: Option<f64>,
    #[serde(default)]
    pub memory_percentage: Option<f64>,
    #[serde(default)]
    pub memory_used: Option<f64>,
    #[serde(default)]
    pub memory_total: Option<f64>,
    #[serde(default)]
    pub net_in: Option<i64>,
    #[serde(default)]
    pub net_out: Option<i64>,
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
    #[serde(default)]
    pub stats: Option<ApiContainerStats>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiMetricResource {
    pub unit: String,
    #[serde(default)]
    pub usage: HashMap<String, f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) struct ApiMetricsCollection {
    #[serde(default)]
    pub cpu_usage: Option<ApiMetricResource>,
    #[serde(default)]
    pub ram_usage: Option<ApiMetricResource>,
    #[serde(default)]
    pub disk_space: Option<ApiMetricResource>,
    #[serde(default)]
    pub incoming_traffic: Option<ApiMetricResource>,
    #[serde(default)]
    pub outgoing_traffic: Option<ApiMetricResource>,
    #[serde(default)]
    pub uptime: Option<ApiMetricResource>,
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
            stats: value.stats.map(Into::into),
        }
    }
}

impl From<ApiContainerStats> for ContainerStats {
    fn from(value: ApiContainerStats) -> Self {
        Self {
            cpu_percentage: value.cpu_percentage,
            memory_percentage: value.memory_percentage,
            memory_used: value.memory_used,
            memory_total: value.memory_total,
            net_in: value.net_in,
            net_out: value.net_out,
        }
    }
}

impl From<ApiMetricsCollection> for VpsMetrics {
    fn from(value: ApiMetricsCollection) -> Self {
        Self {
            cpu_usage: metric_series_from_api(value.cpu_usage),
            ram_usage: metric_series_from_api(value.ram_usage),
            disk_space: metric_series_from_api(value.disk_space),
            incoming_traffic: metric_series_from_api(value.incoming_traffic),
            outgoing_traffic: metric_series_from_api(value.outgoing_traffic),
            uptime: metric_series_from_api(value.uptime),
        }
    }
}

fn metric_series_from_api(api: Option<ApiMetricResource>) -> Option<MetricSeries> {
    let api = api?;
    let mut points: Vec<MetricPoint> = api
        .usage
        .into_iter()
        .map(|(timestamp, value)| MetricPoint { timestamp, value })
        .collect();
    points.sort_by(|left, right| left.timestamp.cmp(&right.timestamp));

    Some(MetricSeries {
        unit: api.unit,
        points,
    })
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
            stats: None,
        });

        assert_eq!(container.health, "none");
        assert_eq!(container.ports, vec!["8080:80/tcp"]);
    }

    #[test]
    fn maps_container_stats_from_api() {
        let container = Container::from(ApiContainer {
            name: "web".into(),
            image: "nginx:latest".into(),
            health: Some("healthy".into()),
            state: Some("running".into()),
            ports: vec![],
            stats: Some(ApiContainerStats {
                cpu_percentage: Some(12.5),
                memory_percentage: Some(4.2),
                memory_used: Some(67_000_000.0),
                memory_total: Some(16_000_000_000.0),
                net_in: Some(1_000),
                net_out: Some(2_000),
            }),
        });

        let stats = container.stats.expect("stats");
        assert_eq!(stats.cpu_percentage, Some(12.5));
        assert_eq!(stats.memory_percentage, Some(4.2));
    }

    #[test]
    fn sorts_metric_points_by_timestamp() {
        let metrics = VpsMetrics::from(ApiMetricsCollection {
            cpu_usage: Some(ApiMetricResource {
                unit: "%".into(),
                usage: HashMap::from([("1742269700".into(), 2.0), ("1742269600".into(), 1.0)]),
            }),
            ram_usage: None,
            disk_space: None,
            incoming_traffic: None,
            outgoing_traffic: None,
            uptime: None,
        });

        let cpu = metrics.cpu_usage.expect("cpu");
        assert_eq!(cpu.points.len(), 2);
        assert_eq!(cpu.points[0].value, 1.0);
        assert_eq!(cpu.points[1].value, 2.0);
    }
}
