use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use super::app::GITHUB_USER_AGENT;
use super::app_config::github_app_configured;
use super::error::GitHubError;
use super::oauth::device_flow_works;
use super::types::{GitHubAppConfig, GitHubAppRegisterResult};
use crate::workspace::persist_github_app_registration;

const CALLBACK_PORT: u16 = 19736;
const START_PATH: &str = "/github-app/start";
const CALLBACK_PATH: &str = "/github-app/callback";
const APP_HOMEPAGE: &str = "https://github.com/niltoncalegari/HotDeploy";

#[derive(Debug, Deserialize)]
struct ManifestConversionResponse {
    client_id: String,
    slug: Option<String>,
}

fn build_manifest(callback_url: &str) -> serde_json::Value {
    serde_json::json!({
        "name": "HotDeploy Desktop",
        "url": APP_HOMEPAGE,
        "description": "Desktop control panel for Docker Compose deployments on VPS (Hostinger-first)",
        "hook_attributes": {
            "url": format!("{APP_HOMEPAGE}/webhook"),
            "active": false
        },
        "redirect_url": callback_url,
        "callback_urls": [callback_url],
        "public": true,
        "default_permissions": {
            "actions": "write",
            "administration": "write",
            "contents": "write",
            "environments": "write",
            "metadata": "read",
            "secrets": "write"
        },
        "default_events": [],
        "request_oauth_on_install": false
    })
}

fn build_start_html(manifest: &serde_json::Value) -> String {
    let manifest_json = manifest.to_string();
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Register HotDeploy GitHub App</title>
  </head>
  <body>
    <p>Redirecting to GitHub to register HotDeploy Desktop…</p>
    <script>
      const manifest = {manifest_json};
      const form = document.createElement("form");
      form.method = "post";
      form.action = "https://github.com/settings/apps/new";
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "manifest";
      input.value = JSON.stringify(manifest);
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    </script>
  </body>
</html>"#
    )
}

fn write_http_response(
    stream: &mut std::net::TcpStream,
    status: &str,
    content_type: &str,
    body: &[u8],
) {
    let response = format!(
        "HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.write_all(body);
}

fn extract_query_param(path: &str, key: &str) -> Option<String> {
    let query = path.split('?').nth(1)?;
    for pair in query.split('&') {
        let (name, value) = pair.split_once('=')?;
        if name == key {
            return Some(
                urlencoding::decode(value)
                    .map(|decoded| decoded.into_owned())
                    .unwrap_or_else(|_| value.to_string()),
            );
        }
    }
    None
}

fn wait_for_manifest_code(start_html: String) -> Result<String, GitHubError> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let listener = match TcpListener::bind(("127.0.0.1", CALLBACK_PORT)) {
            Ok(listener) => listener,
            Err(error) => {
                let _ = tx.send(Err(GitHubError::Request(format!(
                    "Failed to start local registration server: {error}"
                ))));
                return;
            }
        };

        for stream in listener.incoming() {
            let mut stream = match stream {
                Ok(stream) => stream,
                Err(_) => continue,
            };

            let mut request_line = String::new();
            let mut reader = BufReader::new(&stream);
            if reader.read_line(&mut request_line).is_err() {
                continue;
            }

            loop {
                let mut line = String::new();
                if reader.read_line(&mut line).is_err() {
                    break;
                }
                if line == "\r\n" || line == "\n" {
                    break;
                }
            }

            let path = request_line.split_whitespace().nth(1).unwrap_or("/");
            let path_only = path.split('?').next().unwrap_or(path);

            if path_only == START_PATH {
                write_http_response(
                    &mut stream,
                    "200 OK",
                    "text/html; charset=utf-8",
                    start_html.as_bytes(),
                );
                continue;
            }

            if path_only == CALLBACK_PATH {
                let Some(code) = extract_query_param(path, "code") else {
                    write_http_response(
                        &mut stream,
                        "400 Bad Request",
                        "text/plain; charset=utf-8",
                        b"Missing code",
                    );
                    let _ = tx.send(Err(GitHubError::Request(
                        "GitHub callback did not include a code parameter.".into(),
                    )));
                    return;
                };

                write_http_response(
                    &mut stream,
                    "200 OK",
                    "text/html; charset=utf-8",
                    b"<h1>HotDeploy GitHub App registered</h1><p>You can close this tab and return to HotDeploy.</p>",
                );
                let _ = tx.send(Ok(code));
                return;
            }

            write_http_response(
                &mut stream,
                "404 Not Found",
                "text/plain; charset=utf-8",
                b"Not found",
            );
        }

        let _ = tx.send(Err(GitHubError::Request(
            "Registration server stopped before GitHub callback.".into(),
        )));
    });

    thread::sleep(Duration::from_millis(100));

    match rx.recv_timeout(Duration::from_secs(300)) {
        Ok(Ok(code)) => Ok(code),
        Ok(Err(error)) => Err(error),
        Err(mpsc::RecvTimeoutError::Timeout) => Err(GitHubError::Request(
            "Timed out waiting for GitHub callback (5 minutes). Try again.".into(),
        )),
        Err(mpsc::RecvTimeoutError::Disconnected) => Err(GitHubError::Request(
            "Registration server stopped unexpectedly.".into(),
        )),
    }
}

async fn convert_manifest(code: &str) -> Result<ManifestConversionResponse, GitHubError> {
    let client = reqwest::Client::new();
    let response = client
        .post(format!(
            "https://api.github.com/app-manifests/{code}/conversions"
        ))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", GITHUB_USER_AGENT)
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let message = response.text().await.unwrap_or_default();
        return Err(GitHubError::Api { status, message });
    }

    response
        .json::<ManifestConversionResponse>()
        .await
        .map_err(|error| GitHubError::Request(error.to_string()))
}

pub async fn get_github_app_config(app: &AppHandle) -> Result<GitHubAppConfig, GitHubError> {
    let configured = github_app_configured(app);
    let slug = super::app_config::load_github_app_registration(app).and_then(|(_, slug)| slug);
    let settings_url = slug
        .as_deref()
        .map(|app_slug| format!("https://github.com/settings/apps/{app_slug}"));
    let device_flow_ready = if configured {
        device_flow_works(&super::app_config::resolve_github_app_client_id(app)).await
    } else {
        false
    };

    Ok(GitHubAppConfig {
        configured,
        device_flow_ready,
        slug,
        settings_url,
    })
}

pub async fn link_github_app(
    app: &AppHandle,
    client_id: &str,
    slug: Option<&str>,
) -> Result<GitHubAppRegisterResult, GitHubError> {
    let client_id = client_id.trim();
    if client_id.is_empty() {
        return Err(GitHubError::Request(
            "GitHub App Client ID is required.".into(),
        ));
    }

    persist_github_app_registration(app, client_id, slug)
        .map_err(|error| GitHubError::Request(error.to_string()))?;
    let device_flow_ready = device_flow_works(client_id).await;

    if !device_flow_ready {
        if let Some(app_slug) = slug {
            let settings_url = format!("https://github.com/settings/apps/{app_slug}");
            let _ = app.opener().open_url(settings_url, None::<&str>);
        }
    }

    Ok(GitHubAppRegisterResult {
        client_id: client_id.to_string(),
        slug: slug.map(str::to_string),
        device_flow_ready,
    })
}

pub async fn register_github_app(app: &AppHandle) -> Result<GitHubAppRegisterResult, GitHubError> {
    let callback_url = format!("http://127.0.0.1:{CALLBACK_PORT}{CALLBACK_PATH}");
    let manifest = build_manifest(&callback_url);
    let start_html = build_start_html(&manifest);
    let start_url = format!("http://127.0.0.1:{CALLBACK_PORT}{START_PATH}");

    let server_handle = tokio::task::spawn_blocking(move || wait_for_manifest_code(start_html));

    app.opener()
        .open_url(start_url, None::<&str>)
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    let code = server_handle
        .await
        .map_err(|error| GitHubError::Request(error.to_string()))??;

    let payload = convert_manifest(&code).await?;
    persist_github_app_registration(app, &payload.client_id, payload.slug.as_deref())
        .map_err(|error| GitHubError::Request(error.to_string()))?;

    let device_flow_ready = device_flow_works(&payload.client_id).await;
    if !device_flow_ready {
        if let Some(slug) = &payload.slug {
            let settings_url = format!("https://github.com/settings/apps/{slug}");
            let _ = app.opener().open_url(settings_url, None::<&str>);
        }
    }

    Ok(GitHubAppRegisterResult {
        client_id: payload.client_id,
        slug: payload.slug,
        device_flow_ready,
    })
}
