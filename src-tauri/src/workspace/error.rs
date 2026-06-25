use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum WorkspaceError {
    #[error("failed to resolve app config directory: {0}")]
    ConfigDir(String),
    #[error("failed to read workspace file: {0}")]
    Read(String),
    #[error("failed to write workspace file: {0}")]
    Write(String),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceErrorPayload {
    pub code: String,
    pub message: String,
}

impl WorkspaceError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::ConfigDir(_) => "CONFIG_DIR_ERROR",
            Self::Read(_) => "READ_ERROR",
            Self::Write(_) => "WRITE_ERROR",
            Self::Serialization(_) => "SERIALIZATION_ERROR",
            Self::Io(_) => "IO_ERROR",
        }
    }
}

impl From<WorkspaceError> for String {
    fn from(error: WorkspaceError) -> Self {
        serde_json::to_string(&WorkspaceErrorPayload {
            code: error.code().to_string(),
            message: error.to_string(),
        })
        .unwrap_or_else(|_| {
            "{\"code\":\"UNKNOWN\",\"message\":\"unexpected workspace error\"}".to_string()
        })
    }
}
