use reqwest::Client;

use super::error::HostingerError;

#[allow(dead_code)] // Wired in Phase 1 — Hostinger connection slice
pub const HOSTINGER_API_BASE: &str = "https://api.hostinger.com";

#[allow(dead_code)]
pub struct HostingerClient {
    http: Client,
    api_key: String,
}

#[allow(dead_code)]
impl HostingerClient {
    pub fn new(api_key: String) -> Self {
        Self {
            http: Client::new(),
            api_key,
        }
    }

    pub fn api_key(&self) -> &str {
        &self.api_key
    }

    pub async fn get(&self, path: &str) -> Result<reqwest::Response, HostingerError> {
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

    pub async fn post_json<T: serde::Serialize>(
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
}
