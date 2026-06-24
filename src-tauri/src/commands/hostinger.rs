use crate::commands::credentials::load_api_key;
use crate::hostinger::error::HostingerError;
use crate::hostinger::types::{DockerProjectSummary, VirtualMachine};

#[tauri::command]
pub async fn list_vms() -> Result<Vec<VirtualMachine>, String> {
    let _api_key = load_api_key().map_err(String::from)?;
    Err(HostingerError::NotImplemented("list_vms".into()).into())
}

#[tauri::command]
pub async fn list_projects(virtual_machine_id: u64) -> Result<Vec<DockerProjectSummary>, String> {
    let _api_key = load_api_key().map_err(String::from)?;
    let _ = virtual_machine_id;
    Err(HostingerError::NotImplemented("list_projects".into()).into())
}

#[tauri::command]
pub async fn get_project_logs(
    virtual_machine_id: u64,
    project_name: String,
) -> Result<String, String> {
    let _api_key = load_api_key().map_err(String::from)?;
    let _ = (virtual_machine_id, project_name);
    Err(HostingerError::NotImplemented("get_project_logs".into()).into())
}
