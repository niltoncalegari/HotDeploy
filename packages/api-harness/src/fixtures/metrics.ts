import type { VpsMetrics } from "../schemas/hostinger";

export const sampleVpsMetrics: VpsMetrics = {
  cpuUsage: {
    unit: "%",
    points: [
      { timestamp: "1742269600", value: 1.2 },
      { timestamp: "1742269660", value: 2.4 },
      { timestamp: "1742269720", value: 1.8 },
    ],
  },
  ramUsage: {
    unit: "bytes",
    points: [
      { timestamp: "1742269600", value: 500_000_000 },
      { timestamp: "1742269660", value: 520_000_000 },
      { timestamp: "1742269720", value: 510_000_000 },
    ],
  },
};
