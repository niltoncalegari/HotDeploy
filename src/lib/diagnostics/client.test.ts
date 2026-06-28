import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  appendDiagnosticLog,
  exportDiagnosticsReport,
  getDiagnosticLogPath,
  logDiagnosticError,
  openDiagnosticLogFolder,
  readDiagnosticLogTail,
} from "@/lib/diagnostics/client";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(await import("@tauri-apps/api/core")).invoke;

describe("diagnostics client", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("appendDiagnosticLog invokes command", async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await appendDiagnosticLog("error", "save_workspace", "write failed");
    expect(mockedInvoke).toHaveBeenCalledWith("append_diagnostic_log", {
      level: "error",
      source: "save_workspace",
      message: "write failed",
      context: undefined,
    });
  });

  it("appendDiagnosticLog ignores invoke failures", async () => {
    mockedInvoke.mockRejectedValueOnce(new Error("no tauri"));
    await expect(
      appendDiagnosticLog("info", "browser", "dev mode"),
    ).resolves.toBeUndefined();
  });

  it("logDiagnosticError serializes context", async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await logDiagnosticError("DeployProjectsCard", new Error("boom"), {
      projects: 1,
    });
    expect(mockedInvoke).toHaveBeenCalledWith("append_diagnostic_log", {
      level: "error",
      source: "DeployProjectsCard",
      message: "boom",
      context: JSON.stringify({ projects: 1 }),
    });
  });

  it("logDiagnosticError stringifies non-Error values", async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await logDiagnosticError("source", "plain failure");
    expect(mockedInvoke).toHaveBeenCalledWith("append_diagnostic_log", {
      level: "error",
      source: "source",
      message: "plain failure",
      context: undefined,
    });
  });

  it("exportDiagnosticsReport invokes command", async () => {
    mockedInvoke.mockResolvedValueOnce("# report");
    const report = await exportDiagnosticsReport();
    expect(report).toBe("# report");
  });

  it("getDiagnosticLogPath invokes command", async () => {
    mockedInvoke.mockResolvedValueOnce("/tmp/hotdeploy.log");
    await expect(getDiagnosticLogPath()).resolves.toBe("/tmp/hotdeploy.log");
  });

  it("readDiagnosticLogTail invokes command with max lines", async () => {
    mockedInvoke.mockResolvedValueOnce("line 1");
    await expect(readDiagnosticLogTail(50)).resolves.toBe("line 1");
    expect(mockedInvoke).toHaveBeenCalledWith("read_diagnostic_log_tail", {
      maxLines: 50,
    });
  });

  it("openDiagnosticLogFolder invokes command", async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await openDiagnosticLogFolder();
    expect(mockedInvoke).toHaveBeenCalledWith("open_diagnostic_log_folder");
  });
});
