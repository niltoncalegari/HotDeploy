import { invoke } from "@tauri-apps/api/core";

export type DiagnosticLogLevel = "error" | "warn" | "info";

export async function appendDiagnosticLog(
  level: DiagnosticLogLevel,
  source: string,
  message: string,
  context?: string,
): Promise<void> {
  try {
    await invoke("append_diagnostic_log", { level, source, message, context });
  } catch {
    // Browser-only dev mode — no log file available.
  }
}

export async function getDiagnosticLogPath(): Promise<string> {
  return invoke<string>("get_diagnostic_log_path");
}

export async function readDiagnosticLogTail(maxLines = 200): Promise<string> {
  return invoke<string>("read_diagnostic_log_tail", { maxLines });
}

export async function exportDiagnosticsReport(): Promise<string> {
  return invoke<string>("export_diagnostics_report");
}

export async function openDiagnosticLogFolder(): Promise<void> {
  await invoke("open_diagnostic_log_folder");
}

export async function logDiagnosticError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const contextJson = context ? JSON.stringify(context) : undefined;
  await appendDiagnosticLog("error", source, message, contextJson);
}
