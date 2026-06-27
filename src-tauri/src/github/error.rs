use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum GitHubError {
    #[error("GitHub not configured")]
    NotConfigured,
    #[error("GitHub API error ({status}): {message}")]
    Api { status: u16, message: String },
    #[error("GitHub request failed: {0}")]
    Request(String),
    #[error("Invalid repository: {0}")]
    InvalidRepo(String),
    #[error("Encryption failed: {0}")]
    Encryption(String),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubErrorBody {
    pub code: String,
    pub message: String,
}

impl From<GitHubError> for String {
    fn from(error: GitHubError) -> Self {
        serde_json::to_string(&GitHubErrorBody {
            code: match &error {
                GitHubError::NotConfigured => "not_configured",
                GitHubError::Api { .. } => "api_error",
                GitHubError::Request(_) => "request_error",
                GitHubError::InvalidRepo(_) => "invalid_repo",
                GitHubError::Encryption(_) => "encryption_error",
            }
            .to_string(),
            message: error.to_string(),
        })
        .unwrap_or_else(|_| error.to_string())
    }
}
