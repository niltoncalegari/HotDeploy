import type { MetricSeries } from "@/lib/hostinger/client";

const VPS_METRICS_WINDOW_MS = 60 * 60 * 1000;

export function buildVpsMetricsWindow(now: number = Date.now()): {
  dateFrom: string;
  dateTo: string;
} {
  const dateTo = new Date(now);
  const dateFrom = new Date(now - VPS_METRICS_WINDOW_MS);

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  };
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

export function formatBytes(value: number | undefined): string {
  if (value === undefined) {
    return "—";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function sparklineValues(series: MetricSeries | undefined): number[] {
  return series?.points.map((point) => point.value) ?? [];
}

export function seriesLatestValue(series: MetricSeries | undefined): number | undefined {
  const points = series?.points;
  if (!points || points.length === 0) {
    return undefined;
  }

  return points[points.length - 1]?.value;
}

export function formatSeriesSummary(
  series: MetricSeries | undefined,
  kind: "cpu" | "ram",
): string {
  const latest = seriesLatestValue(series);
  if (latest === undefined) {
    return "No data";
  }

  if (kind === "cpu") {
    return `Latest ${formatPercent(latest)}`;
  }

  return `Latest ${formatBytes(latest)}`;
}
