use reqwest::Client;
use serde::Deserialize;

use super::app::GITHUB_APP_CLIENT_ID;
use super::error::GitHubError;

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceFlowStart {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Deserialize)]
struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Debug, Deserialize)]
struct DeviceTokenResponse {
    access_token: Option<String>,
    error: Option<String>,
}

pub async fn start_device_flow() -> Result<DeviceFlowStart, GitHubError> {
    let client = Client::new();
    let response = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[("client_id", GITHUB_APP_CLIENT_ID)])
        .send()
        .await
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let message = response.text().await.unwrap_or_default();
        return Err(GitHubError::Api { status, message });
    }

    let payload: DeviceCodeResponse = response
        .json()
        .await
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    Ok(DeviceFlowStart {
        device_code: payload.device_code,
        user_code: payload.user_code,
        verification_uri: payload.verification_uri,
        expires_in: payload.expires_in,
        interval: payload.interval,
    })
}

pub async fn poll_device_token(device_code: &str) -> Result<Option<String>, GitHubError> {
    let client = Client::new();
    let response = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", GITHUB_APP_CLIENT_ID),
            ("device_code", device_code),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send()
        .await
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    let payload: DeviceTokenResponse = response
        .json()
        .await
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    if let Some(token) = payload.access_token {
        return Ok(Some(token));
    }

    match payload.error.as_deref() {
        Some("authorization_pending") | Some("slow_down") => Ok(None),
        Some(error) => Err(GitHubError::Request(error.to_string())),
        None => Ok(None),
    }
}
