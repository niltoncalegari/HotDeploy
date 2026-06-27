import { describe, expect, it } from "vitest";

import {
  buildVpsMetricsWindow,
  formatBytes,
  formatPercent,
  formatSeriesSummary,
  seriesLatestValue,
  sparklineValues,
} from "@/lib/hostinger/metrics";

describe("hostinger metrics helpers", () => {
  it("builds a one-hour metrics window", () => {
    const now = Date.parse("2026-06-24T12:00:00.000Z");
    const { dateFrom, dateTo } = buildVpsMetricsWindow(now);

    expect(dateTo).toBe("2026-06-24T12:00:00.000Z");
    expect(dateFrom).toBe("2026-06-24T11:00:00.000Z");
  });

  it("formats percent and bytes", () => {
    expect(formatPercent(12.34)).toBe("12.3%");
    expect(formatPercent(undefined)).toBe("—");
    expect(formatBytes(1_500_000)).toBe("1.4 MB");
    expect(formatBytes(undefined)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("extracts sparkline values and latest point", () => {
    const series = {
      unit: "%",
      points: [
        { timestamp: "1", value: 1 },
        { timestamp: "2", value: 3 },
      ],
    };

    expect(sparklineValues(series)).toEqual([1, 3]);
    expect(sparklineValues(undefined)).toEqual([]);
    expect(seriesLatestValue(series)).toBe(3);
    expect(seriesLatestValue(undefined)).toBeUndefined();
    expect(seriesLatestValue({ unit: "%", points: [] })).toBeUndefined();
  });

  it("summarizes metric series for display", () => {
    expect(formatSeriesSummary(undefined, "cpu")).toBe("No data");
    expect(
      formatSeriesSummary(
        { unit: "%", points: [{ timestamp: "1", value: 4.5 }] },
        "cpu",
      ),
    ).toBe("Latest 4.5%");
    expect(
      formatSeriesSummary(
        { unit: "bytes", points: [{ timestamp: "1", value: 1_024 }] },
        "ram",
      ),
    ).toBe("Latest 1.0 KB");
  });
});
