/// Placeholder used when no real GitHub App client ID is configured.
pub const PLACEHOLDER_GITHUB_APP_CLIENT_ID: &str = "Ov23liHotDeployDesktop";

/// Required on all GitHub HTTP requests (REST + OAuth device flow).
pub const GITHUB_USER_AGENT: &str = "HotDeploy";

/// Public GitHub App client ID for device flow.
/// Set `GITHUB_APP_CLIENT_ID` in `.env` or run `pnpm register:github-app`.
pub const GITHUB_APP_CLIENT_ID: &str = env!("GITHUB_APP_CLIENT_ID");
