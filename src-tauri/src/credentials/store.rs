use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

use crate::hostinger::error::HostingerError;
use crate::hostinger::types::CredentialsStatus;
use crate::provider::error::ProviderError;

const CREDENTIALS_FILE: &str = "credentials.json";

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CredentialFile {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    hostinger_api_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    digitalocean_api_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    hostinger_virtual_machine_id: Option<u64>,
}

#[derive(Debug, thiserror::Error)]
pub enum CredentialStoreError {
    #[error("config dir unavailable: {0}")]
    ConfigDir(String),
    #[error("failed to read credentials: {0}")]
    Read(String),
    #[error("failed to write credentials: {0}")]
    Write(String),
}

impl From<CredentialStoreError> for String {
    fn from(error: CredentialStoreError) -> Self {
        String::from(HostingerError::CredentialStore(error.to_string()))
    }
}

pub fn credentials_file_path(app: &AppHandle) -> Result<PathBuf, CredentialStoreError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| CredentialStoreError::ConfigDir(error.to_string()))?;

    fs::create_dir_all(&dir).map_err(|error| CredentialStoreError::Write(error.to_string()))?;

    Ok(dir.join(CREDENTIALS_FILE))
}

fn read_file(app: &AppHandle) -> Result<CredentialFile, CredentialStoreError> {
    let path = credentials_file_path(app)?;

    if !path.exists() {
        return Ok(CredentialFile::default());
    }

    let contents =
        fs::read_to_string(&path).map_err(|error| CredentialStoreError::Read(error.to_string()))?;

    serde_json::from_str(&contents).map_err(|error| CredentialStoreError::Read(error.to_string()))
}

fn write_file(app: &AppHandle, credentials: &CredentialFile) -> Result<(), CredentialStoreError> {
    let path = credentials_file_path(app)?;
    let contents = serde_json::to_string_pretty(credentials)
        .map_err(|error| CredentialStoreError::Write(error.to_string()))?;

    fs::write(&path, contents).map_err(|error| CredentialStoreError::Write(error.to_string()))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(metadata) = fs::metadata(&path) {
            let mut permissions = metadata.permissions();
            permissions.set_mode(0o600);
            let _ = fs::set_permissions(&path, permissions);
        }
    }

    Ok(())
}

fn api_key_for_provider(credentials: &CredentialFile, provider: &str) -> Option<String> {
    match provider {
        "hostinger" => credentials.hostinger_api_key.clone(),
        "digitalocean" => credentials.digitalocean_api_key.clone(),
        _ => None,
    }
}

pub fn load_credentials_status(app: &AppHandle) -> Result<CredentialsStatus, CredentialStoreError> {
    let credentials = read_file(app)?;
    let api_key = credentials.hostinger_api_key.unwrap_or_default();

    Ok(CredentialsStatus {
        configured: !api_key.is_empty(),
        virtual_machine_id: credentials.hostinger_virtual_machine_id,
    })
}

pub fn save_hostinger_credentials(
    app: &AppHandle,
    api_key: &str,
    virtual_machine_id: u64,
) -> Result<(), CredentialStoreError> {
    let mut credentials = read_file(app)?;

    if api_key.trim().is_empty() {
        if credentials
            .hostinger_api_key
            .as_ref()
            .is_none_or(|value| value.is_empty())
        {
            return Err(CredentialStoreError::Write(
                HostingerError::NotConfigured.to_string(),
            ));
        }
    } else {
        credentials.hostinger_api_key = Some(api_key.trim().to_string());
    }

    credentials.hostinger_virtual_machine_id = Some(virtual_machine_id);
    write_file(app, &credentials)
}

pub fn clear_stored_credentials(app: &AppHandle) -> Result<(), CredentialStoreError> {
    let path = credentials_file_path(app)?;

    if path.exists() {
        fs::remove_file(&path).map_err(|error| CredentialStoreError::Write(error.to_string()))?;
    }

    Ok(())
}

pub fn load_api_key_for_provider(app: &AppHandle, provider: &str) -> Result<String, ProviderError> {
    if !matches!(provider, "hostinger" | "digitalocean") {
        return Err(ProviderError::UnknownProvider(provider.to_string()));
    }

    let credentials = read_file(app).map_err(|error| {
        ProviderError::Hostinger(HostingerError::CredentialStore(error.to_string()))
    })?;

    let api_key = api_key_for_provider(&credentials, provider).unwrap_or_default();

    if api_key.is_empty() {
        return Err(ProviderError::NotConfigured(provider.to_string()));
    }

    Ok(api_key)
}

pub fn save_provider_api_key(
    app: &AppHandle,
    provider: &str,
    api_key: &str,
) -> Result<(), CredentialStoreError> {
    if api_key.trim().is_empty() {
        return Err(CredentialStoreError::Write(
            HostingerError::NotConfigured.to_string(),
        ));
    }

    let mut credentials = read_file(app)?;

    match provider {
        "hostinger" => credentials.hostinger_api_key = Some(api_key.trim().to_string()),
        "digitalocean" => credentials.digitalocean_api_key = Some(api_key.trim().to_string()),
        other => {
            return Err(CredentialStoreError::Write(
                ProviderError::UnknownProvider(other.to_string()).to_string(),
            ));
        }
    }

    write_file(app, &credentials)
}

pub fn clear_provider_api_key(app: &AppHandle, provider: &str) -> Result<(), CredentialStoreError> {
    let mut credentials = read_file(app)?;

    match provider {
        "hostinger" => {
            credentials.hostinger_api_key = None;
            credentials.hostinger_virtual_machine_id = None;
        }
        "digitalocean" => credentials.digitalocean_api_key = None,
        other => {
            return Err(CredentialStoreError::Write(
                ProviderError::UnknownProvider(other.to_string()).to_string(),
            ));
        }
    }

    if credentials.hostinger_api_key.is_none()
        && credentials.digitalocean_api_key.is_none()
        && credentials.hostinger_virtual_machine_id.is_none()
    {
        return clear_stored_credentials(app);
    }

    write_file(app, &credentials)
}

pub fn provider_credentials_status(
    app: &AppHandle,
    provider: &str,
) -> Result<CredentialsStatus, ProviderError> {
    match load_api_key_for_provider(app, provider) {
        Ok(_) => {
            let credentials = read_file(app).map_err(|error| {
                ProviderError::Hostinger(HostingerError::CredentialStore(error.to_string()))
            })?;

            Ok(CredentialsStatus {
                configured: true,
                virtual_machine_id: if provider == "hostinger" {
                    credentials.hostinger_virtual_machine_id
                } else {
                    None
                },
            })
        }
        Err(ProviderError::NotConfigured(_)) => Ok(CredentialsStatus {
            configured: false,
            virtual_machine_id: None,
        }),
        Err(error) => Err(error),
    }
}

#[cfg(test)]
mod tests {
    use super::CredentialFile;

    #[test]
    fn credential_file_round_trips_through_json() {
        let file = CredentialFile {
            hostinger_api_key: Some("secret".into()),
            digitalocean_api_key: None,
            hostinger_virtual_machine_id: Some(42),
        };

        let json = serde_json::to_string(&file).expect("serialize");
        let parsed: CredentialFile = serde_json::from_str(&json).expect("deserialize");

        assert_eq!(parsed.hostinger_api_key, Some("secret".into()));
        assert_eq!(parsed.hostinger_virtual_machine_id, Some(42));
    }
}
