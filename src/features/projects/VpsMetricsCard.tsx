import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricsSparkline } from "@/features/projects/MetricsSparkline";
import {
  buildVpsMetricsWindow,
  formatSeriesSummary,
  sparklineValues,
} from "@/lib/hostinger/metrics";
import { getVpsMetrics, parseHostingerError } from "@/lib/hostinger/client";
import type { ProviderId } from "@/lib/workspace/schemas";

interface VpsMetricsCardProps {
  virtualMachineId: number;
  provider: ProviderId;
}

export function VpsMetricsCard({ virtualMachineId, provider }: VpsMetricsCardProps) {
  const {
    data: metrics,
    isFetching,
    isError,
    error,
    refetch,
    isFetched,
  } = useQuery({
    queryKey: ["vps-metrics", virtualMachineId, provider],
    queryFn: () => {
      const { dateFrom, dateTo } = buildVpsMetricsWindow();
      return getVpsMetrics(virtualMachineId, dateFrom, dateTo, provider);
    },
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (provider !== "hostinger") {
    return null;
  }

  const cpuValues = sparklineValues(metrics?.cpuUsage);
  const ramValues = sparklineValues(metrics?.ramUsage);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">VPS usage</CardTitle>
          <CardDescription>
            Last 1 hour of CPU and RAM. Loaded only when you refresh.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => {
            void refetch();
          }}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetched ? "Refresh" : "Load metrics"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isFetched ? (
          <p className="text-muted-foreground text-sm">
            Click Load metrics to fetch VPS usage for the last hour.
          </p>
        ) : isError ? (
          <p className="text-destructive text-sm">{parseHostingerError(error)}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">CPU</p>
              <p className="text-muted-foreground text-xs">
                {formatSeriesSummary(metrics?.cpuUsage, "cpu")}
              </p>
              <MetricsSparkline label="CPU usage sparkline" values={cpuValues} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">RAM</p>
              <p className="text-muted-foreground text-xs">
                {formatSeriesSummary(metrics?.ramUsage, "ram")}
              </p>
              <MetricsSparkline label="RAM usage sparkline" values={ramValues} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
