import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjectLogs, parseHostingerError } from "@/lib/hostinger/client";
import type { ProviderId } from "@/lib/workspace/schemas";

interface LogsPanelProps {
  virtualMachineId: number;
  projectName: string;
  provider: ProviderId;
}

export function LogsPanel({
  virtualMachineId,
  projectName,
  provider,
}: LogsPanelProps) {
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const { data: logs = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["project-logs", virtualMachineId, projectName, provider],
    queryFn: () => getProjectLogs(virtualMachineId, projectName, provider),
  });

  const services = useMemo(
    () => [...new Set(logs.map((entry) => entry.service))],
    [logs],
  );

  const filteredLogs =
    serviceFilter === "all"
      ? logs
      : logs.filter((entry) => entry.service === serviceFilter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Logs</CardTitle>
          <CardDescription>Recent container output by service.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <label htmlFor="service-filter" className="text-muted-foreground text-sm">
            Service
          </label>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger id="service-filter" size="sm" className="min-w-[8rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading logs…</p>
        ) : isError ? (
          <p className="text-destructive text-sm">{parseHostingerError(error)}</p>
        ) : (
          <ScrollArea className="bg-muted h-64 rounded-md border p-3">
            <pre className="font-mono text-xs whitespace-pre-wrap">
              {filteredLogs.length === 0
                ? "No log entries."
                : filteredLogs
                    .map(
                      (entry) =>
                        `[${entry.timestamp}] ${entry.service}: ${entry.message}`,
                    )
                    .join("\n")}
            </pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
