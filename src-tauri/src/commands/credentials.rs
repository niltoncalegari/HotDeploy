use tauri::AppHandle;

use crate::credentials::{
    clear_provider_api_key, clear_stored_credentials, load_credentials_status,
    provider_credentials_status, save_hostinger_credentials, save_provider_api_key,
};
use crate::hostinger::types::CredentialsStatus;

#[tauri::command]
pub fn get_credentials_status(app: AppHandle) -> Result<CredentialsStatus, String> {
    load_credentials_status(&app).map_err(String::from)
}

#[tauri::command]
pub fn save_credentials(
    app: AppHandle,
    api_key: String,
    virtual_machine_id: u64,
) -> Result<(), String> {
    save_hostinger_credentials(&app, &api_key, virtual_machine_id).map_err(String::from)
}

#[tauri::command]
pub fn clear_credentials(app: AppHandle) -> Result<(), String> {
    clear_stored_credentials(&app).map_err(String::from)
}

#[tauri::command]
pub fn save_provider_credentials(
    app: AppHandle,
    provider: String,
    api_key: String,
) -> Result<(), String> {
    save_provider_api_key(&app, &provider, &api_key).map_err(String::from)
}

#[tauri::command]
pub fn get_provider_credentials_status(
    app: AppHandle,
    provider: String,
) -> Result<CredentialsStatus, String> {
    provider_credentials_status(&app, &provider).map_err(String::from)
}

#[tauri::command]
pub fn clear_provider_credentials(app: AppHandle, provider: String) -> Result<(), String> {
    clear_provider_api_key(&app, &provider).map_err(String::from)
}
