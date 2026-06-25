use keyring::Entry;
use serde::{Deserialize, Serialize};

use crate::hostinger::error::HostingerError;
use crate::hostinger::types::CredentialsStatus;
use crate::provider::error::ProviderError;

const SERVICE_NAME: &str = "com.hotdeploy.app";
const API_KEY_ACCOUNT: &str = "hostinger-api-key";
const DIGITALOCEAN_API_KEY_ACCOUNT: &str = "digitalocean-api-key";
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

    if !api_key.trim().is_empty() {
        api_key_entry
            .set_password(api_key.trim())
            .map_err(keychain_err)?;
    } else if read_password(&api_key_entry).unwrap_or_default().is_empty() {
        return Err(String::from(HostingerError::NotConfigured));
    }

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
    load_api_key_for_provider("hostinger").map_err(|error| match error {
        ProviderError::Hostinger(inner) => inner,
        ProviderError::NotConfigured(_) => HostingerError::NotConfigured,
        other => HostingerError::NotImplemented(other.to_string()),
    })
}

pub fn load_api_key_for_provider(provider: &str) -> Result<String, ProviderError> {
    let account = match provider {
        "hostinger" => API_KEY_ACCOUNT,
        "digitalocean" => DIGITALOCEAN_API_KEY_ACCOUNT,
        other => {
            return Err(ProviderError::UnknownProvider(other.to_string()));
        }
    };

    let entry = Entry::new(SERVICE_NAME, account)
        .map_err(|error| ProviderError::Hostinger(HostingerError::Keychain(error.to_string())))?;

    let api_key = read_password(&entry).unwrap_or_default();

    if api_key.is_empty() {
        return Err(ProviderError::NotConfigured(provider.to_string()));
    }

    Ok(api_key)
}

#[tauri::command]
pub fn save_provider_credentials(provider: String, api_key: String) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err(String::from(HostingerError::NotConfigured));
    }

    let account = match provider.as_str() {
        "hostinger" => API_KEY_ACCOUNT,
        "digitalocean" => DIGITALOCEAN_API_KEY_ACCOUNT,
        other => {
            return Err(String::from(ProviderError::UnknownProvider(
                other.to_string(),
            )));
        }
    };

    let entry = Entry::new(SERVICE_NAME, account).map_err(keychain_err)?;
    entry.set_password(api_key.trim()).map_err(keychain_err)?;

    Ok(())
}

#[tauri::command]
pub fn get_provider_credentials_status(provider: String) -> Result<CredentialsStatus, String> {
    match load_api_key_for_provider(&provider) {
        Ok(_) => {
            let vm_entry = Entry::new(SERVICE_NAME, VM_ID_ACCOUNT).map_err(keychain_err)?;
            let vm_raw = read_password(&vm_entry).unwrap_or_default();
            let virtual_machine_id = if provider == "hostinger" && !vm_raw.is_empty() {
                serde_json::from_str::<StoredVmId>(&vm_raw)
                    .ok()
                    .map(|value| value.virtual_machine_id)
            } else {
                None
            };

            Ok(CredentialsStatus {
                configured: true,
                virtual_machine_id,
            })
        }
        Err(ProviderError::NotConfigured(_)) => Ok(CredentialsStatus {
            configured: false,
            virtual_machine_id: None,
        }),
        Err(error) => Err(String::from(error)),
    }
}

#[tauri::command]
pub fn clear_provider_credentials(provider: String) -> Result<(), String> {
    let account = match provider.as_str() {
        "hostinger" => API_KEY_ACCOUNT,
        "digitalocean" => DIGITALOCEAN_API_KEY_ACCOUNT,
        other => {
            return Err(String::from(ProviderError::UnknownProvider(
                other.to_string(),
            )));
        }
    };

    let entry = Entry::new(SERVICE_NAME, account).map_err(keychain_err)?;
    let _ = entry.delete_credential();

    if provider == "hostinger" {
        let vm_entry = Entry::new(SERVICE_NAME, VM_ID_ACCOUNT).map_err(keychain_err)?;
        let _ = vm_entry.delete_credential();
    }

    Ok(())
}
