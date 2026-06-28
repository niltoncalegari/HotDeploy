import { useMutation, useQuery } from "@tanstack/react-query";
import { Bug, ClipboardCopy, FolderOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  exportDiagnosticsReport,
  getDiagnosticLogPath,
  openDiagnosticLogFolder,
  readDiagnosticLogTail,
} from "@/lib/diagnostics/client";

const GITHUB_ISSUES_URL =
  "https://github.com/niltoncalegari/HotDeploy/issues/new";

export function DiagnosticsCard() {
  const { data: logPath } = useQuery({
    queryKey: ["diagnostic-log-path"],
    queryFn: getDiagnosticLogPath,
    retry: false,
  });

  const {
    data: logTail = "",
    refetch: refetchLog,
    isFetching,
  } = useQuery({
    queryKey: ["diagnostic-log-tail"],
    queryFn: () => readDiagnosticLogTail(80),
    retry: false,
  });

  const copyReportMutation = useMutation({
    mutationFn: exportDiagnosticsReport,
    onSuccess: async (report) => {
      await navigator.clipboard.writeText(report);
      toast.success("Issue report copied to clipboard.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : String(error));
    },
  });

  const openFolderMutation = useMutation({
    mutationFn: openDiagnosticLogFolder,
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : String(error));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bug className="size-4" />
          Diagnostics
        </CardTitle>
        <CardDescription>
          Errors are appended to a local log file. Copy the issue report to
          paste into GitHub — it includes sanitized workspace structure and
          recent log lines (no API keys or secrets).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logPath ? (
          <p className="text-muted-foreground break-all text-xs">
            Log file: {logPath}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={copyReportMutation.isPending}
            onClick={() => copyReportMutation.mutate()}
          >
            <ClipboardCopy className="size-4" />
            Copy issue report
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              window.open(GITHUB_ISSUES_URL, "_blank", "noopener,noreferrer");
            }}
          >
            Open GitHub Issues
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={openFolderMutation.isPending}
            onClick={() => openFolderMutation.mutate()}
          >
            <FolderOpen className="size-4" />
            Open log folder
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => {
              void refetchLog();
            }}
          >
            <RefreshCw className="size-4" />
            Refresh log
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Recent log</p>
          <Textarea
            readOnly
            value={logTail || "No log entries yet."}
            rows={10}
            className="font-mono text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
