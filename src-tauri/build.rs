use std::path::Path;

fn load_github_app_client_id() -> String {
    if let Ok(id) = std::env::var("GITHUB_APP_CLIENT_ID") {
        let trimmed = id.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    let env_path = Path::new("../.env");
    if let Ok(contents) = std::fs::read_to_string(env_path) {
        for line in contents.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let Some((key, value)) = line.split_once('=') else {
                continue;
            };
            if key.trim() != "GITHUB_APP_CLIENT_ID" {
                continue;
            }
            let trimmed = value.trim().trim_matches('"').trim_matches('\'');
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }

    "Ov23liHotDeployDesktop".to_string()
}

fn main() {
    let client_id = load_github_app_client_id();
    println!("cargo:rustc-env=GITHUB_APP_CLIENT_ID={client_id}");
    println!("cargo:rerun-if-changed=../.env");
    println!("cargo:rerun-if-env-changed=GITHUB_APP_CLIENT_ID");
    println!("cargo:rerun-if-changed=tauri.conf.json");
    println!("cargo:rerun-if-changed=icons/icon.icns");
    println!("cargo:rerun-if-changed=icons/icon.ico");
    println!("cargo:rerun-if-changed=icons/icon.png");
    println!("cargo:rerun-if-changed=../src/assets/brand/app-icon.svg");
    tauri_build::build()
}
