use std::process::Command;

use super::error::GitHubError;

pub fn read_gh_auth_token() -> Result<String, GitHubError> {
    let output = Command::new("gh")
        .args(["auth", "token"])
        .output()
        .map_err(|error| {
            GitHubError::Request(format!(
                "GitHub CLI (`gh`) is not available: {error}. Install it from https://cli.github.com/"
            ))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let message = if stderr.is_empty() {
            "GitHub CLI is not authenticated. Run `gh auth login`.".to_string()
        } else {
            stderr
        };
        return Err(GitHubError::Request(message));
    }

    let token = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if token.is_empty() {
        return Err(GitHubError::Request(
            "GitHub CLI returned an empty token.".into(),
        ));
    }

    Ok(token)
}
