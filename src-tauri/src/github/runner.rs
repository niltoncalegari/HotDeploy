use super::error::GitHubError;

pub fn runner_name(owner: &str, repo: &str, vm_id: u64) -> String {
    format!("hotdeploy-{}-{}-{}", sanitize(owner), sanitize(repo), vm_id)
}

pub fn install_runner_script(
    owner: &str,
    repo: &str,
    vm_id: u64,
    registration_token: &str,
) -> String {
    let name = runner_name(owner, repo, vm_id);
    let labels = format!("self-hosted,linux,hotdeploy,vps-{vm_id}");

    format!(
        r#"set -euo pipefail
RUNNER_USER="${{RUNNER_USER:-github-runner}}"
RUNNER_HOME="/home/${{RUNNER_USER}}/actions-runner"
if ! id "$RUNNER_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$RUNNER_USER"
fi
mkdir -p "$RUNNER_HOME"
cd "$RUNNER_HOME"
if [ ! -f ./config.sh ]; then
  curl -fsSL -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
  tar xzf actions-runner.tar.gz
  rm actions-runner.tar.gz
fi
./config.sh --url https://github.com/{owner}/{repo} --token {token} --name {name} --labels {labels} --unattended --replace
./svc.sh install "$RUNNER_USER"
./svc.sh start
echo hotdeploy-runner-installed:{name}
"#,
        owner = owner,
        repo = repo,
        token = registration_token,
        name = name,
        labels = labels,
    )
}

pub fn uninstall_runner_script(owner: &str, repo: &str, vm_id: u64, remove_token: &str) -> String {
    let name = runner_name(owner, repo, vm_id);
    format!(
        r#"set -euo pipefail
RUNNER_USER="${{RUNNER_USER:-github-runner}}"
RUNNER_HOME="/home/${{RUNNER_USER}}/actions-runner"
if [ -d "$RUNNER_HOME" ] && [ -f "$RUNNER_HOME/config.sh" ]; then
  cd "$RUNNER_HOME"
  ./svc.sh stop || true
  ./config.sh remove --token {token} || true
fi
echo hotdeploy-runner-uninstalled:{name}
"#,
        token = remove_token,
        name = name,
    )
}

pub fn parse_uninstall_output(output: &str) -> bool {
    output.contains("hotdeploy-runner-uninstalled:")
}

pub fn runner_status_script(owner: &str, repo: &str, vm_id: u64) -> String {
    let name = runner_name(owner, repo, vm_id);
    format!(
        r#"if systemctl is-active --quiet actions.runner.*.{name}.service 2>/dev/null; then
  echo hotdeploy-runner-status:online:{name}
elif [ -d "/home/github-runner/actions-runner" ]; then
  echo hotdeploy-runner-status:offline:{name}
else
  echo hotdeploy-runner-status:not_installed:{name}
fi"#,
        name = name,
    )
}

pub fn parse_runner_status_output(output: &str) -> (super::types::RunnerState, String) {
    for line in output.lines() {
        if let Some(rest) = line.strip_prefix("hotdeploy-runner-status:") {
            let mut parts = rest.splitn(3, ':');
            let state = parts.next().unwrap_or("error");
            let name = parts.next().unwrap_or("runner").to_string();
            return (
                match state {
                    "online" => super::types::RunnerState::Online,
                    "offline" => super::types::RunnerState::Offline,
                    "not_installed" => super::types::RunnerState::NotInstalled,
                    _ => super::types::RunnerState::Error,
                },
                name,
            );
        }
    }
    (super::types::RunnerState::Error, "unknown".to_string())
}

fn sanitize(value: &str) -> String {
    value
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>()
        .trim_matches('-')
        .to_string()
}

pub fn parse_github_repo_url(url: &str) -> Result<(String, String), GitHubError> {
    let trimmed = url.trim().trim_end_matches('/');
    let path = trimmed
        .strip_prefix("https://github.com/")
        .or_else(|| trimmed.strip_prefix("http://github.com/"))
        .or_else(|| trimmed.strip_prefix("github.com/"))
        .ok_or_else(|| GitHubError::InvalidRepo(url.to_string()))?;

    let mut parts = path.split('/');
    let owner = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or_else(|| GitHubError::InvalidRepo(url.to_string()))?
        .to_string();
    let repo = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or_else(|| GitHubError::InvalidRepo(url.to_string()))?
        .trim_end_matches(".git")
        .to_string();

    Ok((owner, repo))
}

#[cfg(test)]
mod tests {
    use super::{parse_github_repo_url, runner_name};

    #[test]
    fn parses_standard_github_url() {
        let (owner, repo) = parse_github_repo_url("https://github.com/acme/widget").expect("parse");
        assert_eq!(owner, "acme");
        assert_eq!(repo, "widget");
    }

    #[test]
    fn runner_name_is_stable() {
        assert_eq!(
            runner_name("Acme", "Widget", 42),
            "hotdeploy-acme-widget-42"
        );
    }

    #[test]
    fn uninstall_script_contains_config_remove() {
        let script = super::uninstall_runner_script("acme", "widget", 1, "remove-token");
        assert!(script.contains("config.sh remove"));
        assert!(script.contains("remove-token"));
    }

    #[test]
    fn parse_uninstall_output_detects_success() {
        assert!(super::parse_uninstall_output(
            "hotdeploy-runner-uninstalled:hotdeploy-acme-widget-1"
        ));
        assert!(!super::parse_uninstall_output("error"));
    }
}
