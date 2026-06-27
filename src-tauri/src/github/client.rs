use base64::Engine;
use reqwest::header::{ACCEPT, USER_AGENT};
use reqwest::{Client, Response};
use serde::Deserialize;

use super::error::GitHubError;
use super::runner::parse_github_repo_url;
use super::secrets::encrypt_secret_value;
use super::types::{
    AutoDeployCheckResult, CommitWorkflowResult, GitHubConnectionTest, GitHubEnvironment,
    GitHubRepo, GitHubSecretMeta, GitHubVariable, RunnerRegistrationToken, WorkflowRunSummary,
};

pub const GITHUB_API_BASE: &str = "https://api.github.com";

pub struct GitHubClient {
    http: Client,
    pat: String,
}

impl GitHubClient {
    pub fn new(pat: String) -> Self {
        Self {
            http: Client::new(),
            pat,
        }
    }

    pub async fn test_connection(&self) -> Result<GitHubConnectionTest, GitHubError> {
        let response = self.get("/user").await?;
        let scopes = response
            .headers()
            .get("x-oauth-scopes")
            .and_then(|value| value.to_str().ok())
            .map(|value| {
                value
                    .split(',')
                    .map(|scope| scope.trim().to_string())
                    .filter(|scope| !scope.is_empty())
                    .collect()
            })
            .unwrap_or_default();
        let user: ApiUser = response.json().await.map_err(map_json_error)?;

        Ok(GitHubConnectionTest {
            login: user.login,
            scopes,
        })
    }

    pub async fn current_login(&self) -> Result<String, GitHubError> {
        let response = self.get("/user").await?;
        let user: ApiUser = response.json().await.map_err(map_json_error)?;
        Ok(user.login)
    }

    pub async fn list_repos(&self, page: u32) -> Result<Vec<GitHubRepo>, GitHubError> {
        let path = format!("/user/repos?per_page=100&page={page}&sort=updated");
        let response = self.get(&path).await?;
        let api_repos: Vec<ApiRepo> = response.json().await.map_err(map_json_error)?;

        Ok(api_repos
            .into_iter()
            .map(|repo| GitHubRepo {
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                owner: repo.owner.login,
                default_branch: repo.default_branch.unwrap_or_else(|| "main".to_string()),
                html_url: repo.html_url,
                private: repo.private,
            })
            .collect())
    }

    pub async fn list_secrets(
        &self,
        owner: &str,
        repo: &str,
    ) -> Result<Vec<GitHubSecretMeta>, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/actions/secrets");
        let response = self.get(&path).await?;
        let payload: ApiSecretsList = response.json().await.map_err(map_json_error)?;

        Ok(payload
            .secrets
            .into_iter()
            .map(|secret| GitHubSecretMeta {
                name: secret.name,
                updated_at: secret.updated_at,
            })
            .collect())
    }

    pub async fn upsert_secret(
        &self,
        owner: &str,
        repo: &str,
        name: &str,
        value: &str,
    ) -> Result<(), GitHubError> {
        let path = format!("/repos/{owner}/{repo}/actions/secrets/public-key");
        let response = self.get(&path).await?;
        let key: ApiPublicKey = response.json().await.map_err(map_json_error)?;

        let encrypted_value = encrypt_secret_value(&key.key, value)?;

        let put_path = format!("/repos/{owner}/{repo}/actions/secrets/{name}");
        self.put(
            &put_path,
            &serde_json::json!({
                "encrypted_value": encrypted_value,
                "key_id": key.key_id,
            }),
        )
        .await?;
        Ok(())
    }

    pub async fn delete_secret(
        &self,
        owner: &str,
        repo: &str,
        name: &str,
    ) -> Result<(), GitHubError> {
        let path = format!("/repos/{owner}/{repo}/actions/secrets/{name}");
        self.delete(&path).await
    }

    pub async fn list_variables(
        &self,
        owner: &str,
        repo: &str,
    ) -> Result<Vec<GitHubVariable>, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/actions/variables");
        let response = self.get(&path).await?;
        let payload: ApiVariablesList = response.json().await.map_err(map_json_error)?;

        Ok(payload
            .variables
            .into_iter()
            .map(|variable| GitHubVariable {
                name: variable.name,
                value: variable.value,
                updated_at: variable.updated_at,
            })
            .collect())
    }

    pub async fn upsert_variable(
        &self,
        owner: &str,
        repo: &str,
        name: &str,
        value: &str,
    ) -> Result<(), GitHubError> {
        let list_path = format!("/repos/{owner}/{repo}/actions/variables");
        let response = self.get(&list_path).await?;
        let payload: ApiVariablesList = response.json().await.map_err(map_json_error)?;

        if payload.variables.iter().any(|item| item.name == name) {
            let path = format!("/repos/{owner}/{repo}/actions/variables/{name}");
            self.patch(
                &path,
                &serde_json::json!({
                    "name": name,
                    "value": value,
                }),
            )
            .await?;
        } else {
            self.post(
                &list_path,
                &serde_json::json!({
                    "name": name,
                    "value": value,
                }),
            )
            .await?;
        }

        Ok(())
    }

    pub async fn delete_variable(
        &self,
        owner: &str,
        repo: &str,
        name: &str,
    ) -> Result<(), GitHubError> {
        let path = format!("/repos/{owner}/{repo}/actions/variables/{name}");
        self.delete(&path).await
    }

    pub async fn commit_workflow_file(
        &self,
        owner: &str,
        repo: &str,
        content: &str,
        message: &str,
    ) -> Result<CommitWorkflowResult, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/contents/.github/workflows/hotdeploy.yml");
        let sha = self.get_file_sha(owner, repo).await?;

        let mut body = serde_json::json!({
            "message": message,
            "content": base64::engine::general_purpose::STANDARD.encode(content),
        });

        if let Some(existing_sha) = sha {
            body["sha"] = serde_json::Value::String(existing_sha);
        }

        let response = self.put(&path, &body).await?;
        let payload: ApiContentResponse = response.json().await.map_err(map_json_error)?;
        Ok(CommitWorkflowResult {
            sha: payload.content.sha,
        })
    }

    pub async fn get_runner_registration_token(
        &self,
        owner: &str,
        repo: &str,
    ) -> Result<RunnerRegistrationToken, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/actions/runners/registration-token");
        let response = self.post(&path, &serde_json::json!({})).await?;
        let payload: ApiRegistrationToken = response.json().await.map_err(map_json_error)?;
        Ok(RunnerRegistrationToken {
            token: payload.token,
            expires_at: payload.expires_at,
        })
    }

    pub async fn get_runner_remove_token(
        &self,
        owner: &str,
        repo: &str,
    ) -> Result<RunnerRegistrationToken, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/actions/runners/remove-token");
        let response = self.post(&path, &serde_json::json!({})).await?;
        let payload: ApiRegistrationToken = response.json().await.map_err(map_json_error)?;
        Ok(RunnerRegistrationToken {
            token: payload.token,
            expires_at: payload.expires_at,
        })
    }

    pub async fn list_environments(
        &self,
        owner: &str,
        repo: &str,
    ) -> Result<Vec<GitHubEnvironment>, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/environments");
        let response = self.get(&path).await?;
        let payload: ApiEnvironmentsList = response.json().await.map_err(map_json_error)?;

        Ok(payload
            .environments
            .into_iter()
            .map(|env| GitHubEnvironment {
                name: env.name,
                html_url: env.html_url,
            })
            .collect())
    }

    pub async fn create_environment(
        &self,
        owner: &str,
        repo: &str,
        name: &str,
    ) -> Result<GitHubEnvironment, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/environments/{name}");
        let response = self.put(&path, &serde_json::json!({})).await?;
        let payload: ApiEnvironment = response.json().await.map_err(map_json_error)?;
        Ok(GitHubEnvironment {
            name: payload.name,
            html_url: payload.html_url,
        })
    }

    pub async fn delete_environment(
        &self,
        owner: &str,
        repo: &str,
        name: &str,
    ) -> Result<(), GitHubError> {
        let path = format!("/repos/{owner}/{repo}/environments/{name}");
        self.delete(&path).await
    }

    pub async fn latest_successful_run_on_branch(
        &self,
        owner: &str,
        repo: &str,
        branch: &str,
    ) -> Result<Option<WorkflowRunSummary>, GitHubError> {
        let path = format!(
            "/repos/{owner}/{repo}/actions/runs?branch={branch}&status=completed&per_page=5"
        );
        let response = self.get(&path).await?;
        let payload: ApiWorkflowRunsList = response.json().await.map_err(map_json_error)?;

        Ok(payload
            .workflow_runs
            .into_iter()
            .find(|run| run.conclusion.as_deref() == Some("success"))
            .map(|run| WorkflowRunSummary {
                id: run.id,
                status: run.status,
                conclusion: run.conclusion,
                head_branch: run.head_branch,
                html_url: run.html_url,
            }))
    }

    pub fn evaluate_auto_deploy(
        run: Option<&WorkflowRunSummary>,
        last_deployed_run_id: Option<u64>,
    ) -> AutoDeployCheckResult {
        match run {
            Some(summary) if Some(summary.id) != last_deployed_run_id => AutoDeployCheckResult {
                should_deploy: true,
                run_id: Some(summary.id),
                message: format!("Successful workflow run {} ready to deploy", summary.id),
            },
            Some(summary) => AutoDeployCheckResult {
                should_deploy: false,
                run_id: Some(summary.id),
                message: "Already deployed latest successful run".to_string(),
            },
            None => AutoDeployCheckResult {
                should_deploy: false,
                run_id: None,
                message: "No successful workflow run on default branch".to_string(),
            },
        }
    }

    async fn get_file_sha(&self, owner: &str, repo: &str) -> Result<Option<String>, GitHubError> {
        let path = format!("/repos/{owner}/{repo}/contents/.github/workflows/hotdeploy.yml");
        let response = self
            .http
            .get(format!("{GITHUB_API_BASE}{path}"))
            .bearer_auth(&self.pat)
            .header(USER_AGENT, "HotDeploy")
            .header(ACCEPT, "application/vnd.github+json")
            .send()
            .await
            .map_err(map_request_error)?;

        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }

        if !response.status().is_success() {
            return Err(map_api_error(response).await);
        }

        let payload: ApiContentFile = response.json().await.map_err(map_json_error)?;
        Ok(Some(payload.sha))
    }

    async fn get(&self, path: &str) -> Result<Response, GitHubError> {
        let response = self
            .http
            .get(format!("{GITHUB_API_BASE}{path}"))
            .bearer_auth(&self.pat)
            .header(USER_AGENT, "HotDeploy")
            .header(ACCEPT, "application/vnd.github+json")
            .send()
            .await
            .map_err(map_request_error)?;

        if response.status().is_success() {
            Ok(response)
        } else {
            Err(map_api_error(response).await)
        }
    }

    async fn post(&self, path: &str, body: &serde_json::Value) -> Result<Response, GitHubError> {
        let response = self
            .http
            .post(format!("{GITHUB_API_BASE}{path}"))
            .bearer_auth(&self.pat)
            .header(USER_AGENT, "HotDeploy")
            .header(ACCEPT, "application/vnd.github+json")
            .json(body)
            .send()
            .await
            .map_err(map_request_error)?;

        if response.status().is_success() {
            Ok(response)
        } else {
            Err(map_api_error(response).await)
        }
    }

    async fn put(&self, path: &str, body: &serde_json::Value) -> Result<Response, GitHubError> {
        let response = self
            .http
            .put(format!("{GITHUB_API_BASE}{path}"))
            .bearer_auth(&self.pat)
            .header(USER_AGENT, "HotDeploy")
            .header(ACCEPT, "application/vnd.github+json")
            .json(body)
            .send()
            .await
            .map_err(map_request_error)?;

        if response.status().is_success() {
            Ok(response)
        } else {
            Err(map_api_error(response).await)
        }
    }

    async fn patch(&self, path: &str, body: &serde_json::Value) -> Result<Response, GitHubError> {
        let response = self
            .http
            .patch(format!("{GITHUB_API_BASE}{path}"))
            .bearer_auth(&self.pat)
            .header(USER_AGENT, "HotDeploy")
            .header(ACCEPT, "application/vnd.github+json")
            .json(body)
            .send()
            .await
            .map_err(map_request_error)?;

        if response.status().is_success() {
            Ok(response)
        } else {
            Err(map_api_error(response).await)
        }
    }

    async fn delete(&self, path: &str) -> Result<(), GitHubError> {
        let response = self
            .http
            .delete(format!("{GITHUB_API_BASE}{path}"))
            .bearer_auth(&self.pat)
            .header(USER_AGENT, "HotDeploy")
            .header(ACCEPT, "application/vnd.github+json")
            .send()
            .await
            .map_err(map_request_error)?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(map_api_error(response).await)
        }
    }
}

pub fn parse_repo_from_url(url: &str) -> Result<(String, String), GitHubError> {
    parse_github_repo_url(url)
}

#[derive(Debug, Deserialize)]
struct ApiUser {
    login: String,
}

#[derive(Debug, Deserialize)]
struct ApiRepo {
    id: u64,
    name: String,
    full_name: String,
    owner: ApiOwner,
    html_url: String,
    private: bool,
    default_branch: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ApiOwner {
    login: String,
}

#[derive(Debug, Deserialize)]
struct ApiSecretsList {
    secrets: Vec<ApiSecretMeta>,
}

#[derive(Debug, Deserialize)]
struct ApiSecretMeta {
    name: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
struct ApiPublicKey {
    key_id: String,
    key: String,
}

#[derive(Debug, Deserialize)]
struct ApiVariablesList {
    variables: Vec<ApiVariable>,
}

#[derive(Debug, Deserialize)]
struct ApiVariable {
    name: String,
    value: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
struct ApiContentResponse {
    content: ApiContentSha,
}

#[derive(Debug, Deserialize)]
struct ApiContentSha {
    sha: String,
}

#[derive(Debug, Deserialize)]
struct ApiContentFile {
    sha: String,
}

#[derive(Debug, Deserialize)]
struct ApiRegistrationToken {
    token: String,
    expires_at: String,
}

#[derive(Debug, Deserialize)]
struct ApiEnvironmentsList {
    environments: Vec<ApiEnvironment>,
}

#[derive(Debug, Deserialize)]
struct ApiEnvironment {
    name: String,
    html_url: String,
}

#[derive(Debug, Deserialize)]
struct ApiWorkflowRunsList {
    workflow_runs: Vec<ApiWorkflowRun>,
}

#[derive(Debug, Deserialize)]
struct ApiWorkflowRun {
    id: u64,
    status: String,
    conclusion: Option<String>,
    head_branch: String,
    html_url: String,
}

fn map_request_error(error: reqwest::Error) -> GitHubError {
    GitHubError::Request(error.to_string())
}

async fn map_api_error(response: Response) -> GitHubError {
    let status = response.status().as_u16();
    let message = response
        .text()
        .await
        .unwrap_or_else(|_| "unknown GitHub API error".to_string());
    GitHubError::Api { status, message }
}

fn map_json_error(error: reqwest::Error) -> GitHubError {
    GitHubError::Request(format!("invalid JSON: {error}"))
}

#[cfg(test)]
mod tests {
    use super::{parse_repo_from_url, GitHubClient};
    use crate::github::types::WorkflowRunSummary;

    #[test]
    fn parse_repo_helper_delegates() {
        let (owner, repo) = parse_repo_from_url("https://github.com/o/r").expect("ok");
        assert_eq!(owner, "o");
        assert_eq!(repo, "r");
    }

    #[test]
    fn auto_deploy_when_new_run() {
        let run = WorkflowRunSummary {
            id: 99,
            status: "completed".into(),
            conclusion: Some("success".into()),
            head_branch: "main".into(),
            html_url: "https://github.com".into(),
        };
        let result = GitHubClient::evaluate_auto_deploy(Some(&run), Some(1));
        assert!(result.should_deploy);
    }
}
