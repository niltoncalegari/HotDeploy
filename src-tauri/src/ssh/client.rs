use std::io::Write;
use std::process::{Command, Stdio};

use tempfile::NamedTempFile;

use super::error::SshError;

pub fn test_ssh_echo(
    host: &str,
    port: u16,
    username: &str,
    private_key: &str,
) -> Result<String, SshError> {
    let output = run_ssh_command(host, port, username, private_key, "echo hotdeploy-ssh-ok")?;
    if output.trim() == "hotdeploy-ssh-ok" {
        Ok("SSH connection successful".to_string())
    } else {
        Err(SshError::Command(format!(
            "unexpected echo output: {output}"
        )))
    }
}

pub fn run_ssh_command(
    host: &str,
    port: u16,
    username: &str,
    private_key: &str,
    command: &str,
) -> Result<String, SshError> {
    let mut key_file =
        NamedTempFile::new().map_err(|error| SshError::Connection(error.to_string()))?;
    key_file
        .write_all(private_key.as_bytes())
        .map_err(|error| SshError::Connection(error.to_string()))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut permissions = key_file
            .as_file()
            .metadata()
            .map_err(|error| SshError::Connection(error.to_string()))?
            .permissions();
        permissions.set_mode(0o600);
        key_file
            .as_file()
            .set_permissions(permissions)
            .map_err(|error| SshError::Connection(error.to_string()))?;
    }

    let key_path = key_file.path().to_string_lossy();

    let output = Command::new("ssh")
        .args([
            "-i",
            &key_path,
            "-p",
            &port.to_string(),
            "-o",
            "BatchMode=yes",
            "-o",
            "StrictHostKeyChecking=accept-new",
            "-o",
            "ConnectTimeout=15",
            &format!("{username}@{host}"),
            command,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|error| SshError::Connection(format!("failed to run ssh: {error}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(SshError::Command(stderr.to_string()));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[cfg(test)]
mod tests {
    use super::run_ssh_command;

    #[test]
    fn invalid_host_returns_error() {
        let result = run_ssh_command("127.0.0.1", 1, "root", "not-a-key", "echo test");
        assert!(result.is_err());
    }
}
