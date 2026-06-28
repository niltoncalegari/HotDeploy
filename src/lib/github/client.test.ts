// As a developer, I want GitHub client wrappers to invoke Tauri commands so that secrets stay in Rust.
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  checkAutoDeployRun,
  clearGitHubPat,
  commitWorkflowFile,
  createGitHubEnvironment,
  deleteGitHubEnvironment,
  deleteGitHubSecret,
  deleteGitHubVariable,
  dispatchGitHubWorkflow,
  generateWorkflowYaml,
  getGitHubAppConfig,
  getGitHubAuthMethod,
  getGitHubStatus,
  getGitHubWorkflowRunJobs,
  getRunnerStatus,
  getSshStatus,
  installSelfHostedRunner,
  isDeviceFlowDisabledError,
  linkGitHubApp,
  listGitHubEnvironments,
  listGitHubRepos,
  listGitHubSecrets,
  listGitHubVariables,
  listGitHubWorkflowRuns,
  listGitHubWorkflows,
  parseGitHubError,
  parseGithubRepoUrl,
  pollGitHubDeviceToken,
  registerGitHubApp,
  connectGitHubFromGhCli,
  isGitHubAppMisconfiguredError,
  rotateRunnerRegistration,
  saveGitHubPat,
  saveSshCredentials,
  startGitHubDeviceFlow,
  syncEnvProfileToGitHubSecrets,
  testGitHubConnection,
  testSshConnection,
  uninstallSelfHostedRunner,
  upsertGitHubSecret,
  upsertGitHubVariable,
} from "@/lib/github/client";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("parseGitHubError", () => {
  it("extracts message from structured JSON error", () => {
    expect(
      parseGitHubError('{"code":"api_error","message":"Bad credentials"}'),
    ).toBe("Bad credentials");
  });

  it("returns plain string errors unchanged", () => {
    expect(parseGitHubError("network down")).toBe("network down");
  });

  it("handles Error instances", () => {
    expect(parseGitHubError(new Error("boom"))).toBe("boom");
  });

  it("handles unknown error values", () => {
    expect(parseGitHubError(42)).toBe("Unknown GitHub error");
  });

  it("maps device_flow_disabled to a friendly message", () => {
    expect(
      parseGitHubError(
        '{"code":"request_error","message":"GitHub request failed: Device Flow is disabled on your GitHub App. Open your app settings on GitHub, enable Enable Device Flow, save, then try Connect again. You do not need to register a new app."}',
      ),
    ).toContain("Device Flow is disabled");
    expect(isDeviceFlowDisabledError("device_flow_disabled")).toBe(true);
  });
});

describe("isGitHubAppMisconfiguredError", () => {
  it("detects missing GitHub App configuration", () => {
    expect(
      isGitHubAppMisconfiguredError(
        '{"code":"request_error","message":"GitHub App is not configured. Use Register GitHub App in Settings first."}',
      ),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isGitHubAppMisconfiguredError("Bad credentials")).toBe(false);
  });
});

describe("GitHub invoke wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getGitHubStatus invokes command", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue({ connected: false });

    const status = await getGitHubStatus();
    expect(status.connected).toBe(false);
    expect(invoke).toHaveBeenCalledWith("get_github_status");
  });

  it("saveGitHubPat forwards pat", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue(undefined);

    await saveGitHubPat("token");
    expect(invoke).toHaveBeenCalledWith("save_github_pat_command", { pat: "token" });
  });

  it("clearGitHubPat invokes command", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue(undefined);

    await clearGitHubPat();
    expect(invoke).toHaveBeenCalledWith("clear_github_pat_command");
  });

  it("testGitHubConnection invokes command", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue({ login: "dev", scopes: [] });

    const result = await testGitHubConnection();
    expect(result.login).toBe("dev");
  });

  it("listGitHubRepos passes page", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue([]);

    await listGitHubRepos(2);
    expect(invoke).toHaveBeenCalledWith("list_github_repos", { page: 2 });
  });

  it("manages secrets and variables", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue(undefined);

    await listGitHubSecrets("o", "r");
    await upsertGitHubSecret("o", "r", "KEY", "val");
    await deleteGitHubSecret("o", "r", "KEY");
    await listGitHubVariables("o", "r");
    await upsertGitHubVariable("o", "r", "VAR", "val");
    await deleteGitHubVariable("o", "r", "VAR");

    expect(invoke).toHaveBeenCalledTimes(6);
  });

  it("generates and commits workflows", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke)
      .mockResolvedValueOnce("yaml")
      .mockResolvedValueOnce({ sha: "abc" });

    const yaml = await generateWorkflowYaml({
      dockerProjectName: "app",
      vmId: 1,
      trigger: "push",
      runnerType: "self-hosted",
      includeTestStep: true,
    });
    expect(yaml).toBe("yaml");

    const result = await commitWorkflowFile("o", "r", "yaml", "msg");
    expect(result.sha).toBe("abc");
  });

  it("runner and ssh commands", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke)
      .mockResolvedValueOnce({ success: true, message: "ok", runnerName: "r" })
      .mockResolvedValueOnce({ state: "online", message: "ok", runnerName: "r" })
      .mockResolvedValueOnce({ configured: true })
      .mockResolvedValueOnce({ connected: true, message: "ok" });

    await installSelfHostedRunner("p", "o", "r");
    await getRunnerStatus("p", "o", "r");
    await getSshStatus();
    await testSshConnection("p");
    await saveSshCredentials("key", "root");
    await parseGithubRepoUrl("https://github.com/o/r");

    expect(invoke).toHaveBeenCalledTimes(6);
  });

  it("phase 8 invoke wrappers", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue(undefined);

    await uninstallSelfHostedRunner("p", "o", "r");
    await rotateRunnerRegistration("p", "o", "r");
    await syncEnvProfileToGitHubSecrets("o", "r", "K=v", ["K"]);
    await listGitHubEnvironments("o", "r");
    await createGitHubEnvironment("o", "r", "staging");
    await deleteGitHubEnvironment("o", "r", "staging");
    await checkAutoDeployRun("o", "r", "main", 1);
    await getGitHubAppConfig();
    await registerGitHubApp();
    await startGitHubDeviceFlow();
    await connectGitHubFromGhCli();
    await pollGitHubDeviceToken("device");
    await getGitHubAuthMethod();

    expect(invoke).toHaveBeenCalledTimes(13);
  });
});

// As a developer, I want CI invoke wrappers so that GitHub Actions stay in Rust.
describe("GitHub CI invoke wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists workflows for a repository", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue([]);

    await listGitHubWorkflows("owner", "repo");
    expect(invoke).toHaveBeenCalledWith("list_github_workflows", {
      owner: "owner",
      repo: "repo",
    });
  });

  it("lists workflow runs with optional filters", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue([]);

    await listGitHubWorkflowRuns("owner", "repo", {
      workflowId: 9,
      branch: "main",
      status: "completed",
      perPage: 20,
    });
    expect(invoke).toHaveBeenCalledWith("list_github_workflow_runs", {
      owner: "owner",
      repo: "repo",
      workflowId: 9,
      branch: "main",
      status: "completed",
      perPage: 20,
    });
  });

  it("loads jobs for a workflow run", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue([]);

    await getGitHubWorkflowRunJobs("owner", "repo", 42);
    expect(invoke).toHaveBeenCalledWith("get_github_workflow_run_jobs", {
      owner: "owner",
      repo: "repo",
      runId: 42,
    });
  });

  it("dispatches a workflow on a branch", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue(undefined);

    await dispatchGitHubWorkflow("owner", "repo", 7, "main");
    expect(invoke).toHaveBeenCalledWith("dispatch_github_workflow", {
      owner: "owner",
      repo: "repo",
      workflowId: 7,
      reference: "main",
      inputs: null,
    });
  });

  it("links an existing GitHub App by client id", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue({
      clientId: "Iv1.test",
      slug: "hotdeploy-desktop",
      deviceFlowReady: false,
    });

    await linkGitHubApp("Iv1.test", "hotdeploy-desktop");
    expect(invoke).toHaveBeenCalledWith("link_github_app_command", {
      clientId: "Iv1.test",
      slug: "hotdeploy-desktop",
    });
  });
});
