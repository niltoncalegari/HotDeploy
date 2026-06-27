use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum SshError {
    #[error("SSH not configured")]
    NotConfigured,
    #[error("SSH connection failed: {0}")]
    Connection(String),
    #[error("SSH command failed: {0}")]
    Command(String),
    #[error("Profile not found: {0}")]
    ProfileNotFound(String),
    #[error("VPS host unavailable: {0}")]
    HostUnavailable(String),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SshErrorBody {
    pub code: String,
    pub message: String,
}

impl From<SshError> for String {
    fn from(error: SshError) -> Self {
        serde_json::to_string(&SshErrorBody {
            code: match &error {
                SshError::NotConfigured => "not_configured",
                SshError::Connection(_) => "connection_error",
                SshError::Command(_) => "command_error",
                SshError::ProfileNotFound(_) => "profile_not_found",
                SshError::HostUnavailable(_) => "host_unavailable",
            }
            .to_string(),
            message: error.to_string(),
        })
        .unwrap_or_else(|_| error.to_string())
    }
}
