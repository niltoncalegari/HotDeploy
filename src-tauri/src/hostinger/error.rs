use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum HostingerError {
    #[error("credentials are not configured")]
    NotConfigured,
    #[error("feature not implemented yet: {0}")]
    NotImplemented(String),
    #[error("http request failed: {0}")]
    Http(#[from] reqwest::Error),
    #[error("api error ({status}): {message}")]
    Api { status: u16, message: String },
    #[error("credential store error: {0}")]
    CredentialStore(String),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HostingerErrorPayload {
    pub code: String,
    pub message: String,
}

impl HostingerError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::NotConfigured => "NOT_CONFIGURED",
            Self::NotImplemented(_) => "NOT_IMPLEMENTED",
            Self::Http(_) => "HTTP_ERROR",
            Self::Api { .. } => "API_ERROR",
            Self::CredentialStore(_) => "CREDENTIAL_STORE_ERROR",
            Self::Serialization(_) => "SERIALIZATION_ERROR",
        }
    }
}

impl From<HostingerError> for HostingerErrorPayload {
    fn from(error: HostingerError) -> Self {
        Self {
            code: error.code().to_string(),
            message: error.to_string(),
        }
    }
}

impl From<HostingerError> for String {
    fn from(error: HostingerError) -> Self {
        serde_json::to_string(&HostingerErrorPayload::from(error)).unwrap_or_else(|_| {
            "{\"code\":\"UNKNOWN\",\"message\":\"unexpected error\"}".to_string()
        })
    }
}
