use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::AppHandle;
use tauri::Manager;

const LOG_FILE: &str = "hotdeploy.log";
const MAX_LOG_BYTES: u64 = 512 * 1024;
const TRIM_TARGET_BYTES: u64 = 400 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum DiagnosticLogError {
    #[error("config dir unavailable: {0}")]
    ConfigDir(String),
    #[error("failed to write log: {0}")]
    Write(String),
    #[error("failed to read log: {0}")]
    Read(String),
}

impl From<DiagnosticLogError> for String {
    fn from(error: DiagnosticLogError) -> Self {
        error.to_string()
    }
}

pub fn log_file_path(app: &AppHandle) -> Result<PathBuf, DiagnosticLogError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| DiagnosticLogError::ConfigDir(error.to_string()))?;

    fs::create_dir_all(&dir).map_err(|error| DiagnosticLogError::Write(error.to_string()))?;

    Ok(dir.join(LOG_FILE))
}

fn format_timestamp() -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or(0);
    millis.to_string()
}

fn maybe_rotate(path: &PathBuf) -> Result<(), DiagnosticLogError> {
    let metadata = match fs::metadata(path) {
        Ok(value) => value,
        Err(_) => return Ok(()),
    };

    if metadata.len() <= MAX_LOG_BYTES {
        return Ok(());
    }

    let contents =
        fs::read_to_string(path).map_err(|error| DiagnosticLogError::Read(error.to_string()))?;
    let bytes = contents.as_bytes();
    let start = bytes.len().saturating_sub(TRIM_TARGET_BYTES as usize);
    let trimmed = &contents[start..];
    let next = format!("--- log trimmed ---\n{trimmed}");
    fs::write(path, next).map_err(|error| DiagnosticLogError::Write(error.to_string()))?;
    Ok(())
}

pub fn append_log_line(
    app: &AppHandle,
    level: &str,
    source: &str,
    message: &str,
    context: Option<&str>,
) -> Result<(), DiagnosticLogError> {
    let path = log_file_path(app)?;
    maybe_rotate(&path)?;

    let context_suffix = context
        .filter(|value| !value.trim().is_empty())
        .map(|value| format!(" | context={value}"))
        .unwrap_or_default();

    let line = format!(
        "[{}] {} {}: {}{}\n",
        format_timestamp(),
        level.to_uppercase(),
        source,
        message.replace('\n', " "),
        context_suffix
    );

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|error| DiagnosticLogError::Write(error.to_string()))?;

    file.write_all(line.as_bytes())
        .map_err(|error| DiagnosticLogError::Write(error.to_string()))?;

    Ok(())
}

pub fn read_log_tail(app: &AppHandle, max_lines: usize) -> Result<String, DiagnosticLogError> {
    let path = log_file_path(app)?;
    if !path.exists() {
        return Ok(String::new());
    }

    let contents =
        fs::read_to_string(path).map_err(|error| DiagnosticLogError::Read(error.to_string()))?;

    if max_lines == 0 {
        return Ok(String::new());
    }

    let lines: Vec<&str> = contents.lines().collect();
    if lines.len() <= max_lines {
        return Ok(contents);
    }

    Ok(lines[lines.len() - max_lines..].join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trim_keeps_recent_portion_when_over_limit() {
        let dir = tempfile::tempdir().expect("tempdir");
        let path = dir.path().join(LOG_FILE);
        let payload = "x".repeat((MAX_LOG_BYTES + 1024) as usize);
        fs::write(&path, payload).expect("write");

        maybe_rotate(&path).expect("rotate");

        let trimmed = fs::read_to_string(path).expect("read");
        assert!(trimmed.starts_with("--- log trimmed ---"));
        assert!(trimmed.len() < (MAX_LOG_BYTES + 1024) as usize);
    }
}
