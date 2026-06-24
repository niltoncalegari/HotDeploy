use keyring::Entry;
use serde::{Deserialize, Serialize};

use crate::hostinger::error::HostingerError;
use crate::hostinger::types::CredentialsStatus;

const SERVICE_NAME: &str = "com.hotdeploy.app";
const API_KEY_ACCOUNT: &str = "hostinger-api-key";
const VM_ID_ACCOUNT: &str = "hostinger-vm-id";

#[derive(Debug, Serialize, Deserialize)]
struct StoredVmId {
    virtual_machine_id: u64,
}

fn read_password(entry: &Entry) -> Option<String> {
    entry.get_password().ok()
}

fn keychain_err(error: keyring::Error) -> String {
    String::from(HostingerError::Keychain(error.to_string()))
}

#[tauri::command]
pub fn get_credentials_status() -> Result<CredentialsStatus, String> {
    let api_key_entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT).map_err(keychain_err)?;
    let vm_entry = Entry::new(SERVICE_NAME, VM_ID_ACCOUNT).map_err(keychain_err)?;

    let api_key = read_password(&api_key_entry).unwrap_or_default();
    let vm_raw = read_password(&vm_entry).unwrap_or_default();

    let configured = !api_key.is_empty();
    let virtual_machine_id = if vm_raw.is_empty() {
        None
    } else {
        serde_json::from_str::<StoredVmId>(&vm_raw)
            .ok()
            .map(|value| value.virtual_machine_id)
    };

    Ok(CredentialsStatus {
        configured,
        virtual_machine_id,
    })
}

#[tauri::command]
pub fn save_credentials(api_key: String, virtual_machine_id: u64) -> Result<(), String> {
    let api_key_entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT).map_err(keychain_err)?;
    let vm_entry = Entry::new(SERVICE_NAME, VM_ID_ACCOUNT).map_err(keychain_err)?;

    api_key_entry.set_password(&api_key).map_err(keychain_err)?;

    let payload = StoredVmId { virtual_machine_id };
    let serialized = serde_json::to_string(&payload)
        .map_err(|error| String::from(HostingerError::Serialization(error)))?;

    vm_entry.set_password(&serialized).map_err(keychain_err)?;

    Ok(())
}

#[tauri::command]
pub fn clear_credentials() -> Result<(), String> {
    let api_key_entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT).map_err(keychain_err)?;
    let vm_entry = Entry::new(SERVICE_NAME, VM_ID_ACCOUNT).map_err(keychain_err)?;

    let _ = api_key_entry.delete_credential();
    let _ = vm_entry.delete_credential();

    Ok(())
}

pub fn load_api_key() -> Result<String, HostingerError> {
    let entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|error| HostingerError::Keychain(error.to_string()))?;

    let api_key = read_password(&entry).unwrap_or_default();

    if api_key.is_empty() {
        return Err(HostingerError::NotConfigured);
    }

    Ok(api_key)
}
