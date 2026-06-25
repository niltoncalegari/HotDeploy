use thiserror::Error;

use crate::hostinger::error::HostingerError;

#[derive(Debug, Error)]
pub enum ProviderError {
    #[error(transparent)]
    Hostinger(#[from] HostingerError),
    #[error("provider not configured: {0}")]
    NotConfigured(String),
    #[error("unknown provider: {0}")]
    UnknownProvider(String),
    #[error("unsupported for provider {provider}: {message}")]
    Unsupported { provider: String, message: String },
    #[error("digitalocean api error ({status}): {message}")]
    DigitalOceanApi { status: u16, message: String },
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

impl ProviderError {
    pub fn unsupported(provider: &str, message: impl Into<String>) -> Self {
        Self::Unsupported {
            provider: provider.to_string(),
            message: message.into(),
        }
    }
}
