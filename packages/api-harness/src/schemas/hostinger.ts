import { z } from "zod";

export const containerHealthSchema = z.enum([
  "healthy",
  "unhealthy",
  "starting",
  "none",
]);

export const containerStatsSchema = z.object({
  cpuPercentage: z.number().optional(),
  memoryPercentage: z.number().optional(),
  memoryUsed: z.number().optional(),
  memoryTotal: z.number().optional(),
  netIn: z.number().optional(),
  netOut: z.number().optional(),
});

export const containerSchema = z.object({
  name: z.string(),
  image: z.string(),
  health: z.string(),
  ports: z.array(z.string()),
  state: z.string().optional(),
  stats: containerStatsSchema.optional(),
});

export const dockerProjectSchema = z.object({
  name: z.string(),
  state: z.string(),
  filePath: z.string(),
  containers: z.array(containerSchema),
});

export const dockerProjectListSchema = z.array(dockerProjectSchema);

export const deployProjectRequestSchema = z.object({
  projectName: z.string(),
  content: z.string(),
  environment: z.string().optional(),
});

export const deployProjectResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  state: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const actionResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  state: z.string(),
});

export const virtualMachineSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  state: z.string(),
});

export const virtualMachineListSchema = z.array(virtualMachineSchema);

export const connectionTestResultSchema = z.object({
  connected: z.boolean(),
  message: z.string(),
  projectCount: z.number(),
});

export const projectContentSchema = z.object({
  content: z.string(),
  environment: z.string().optional(),
});

export const logEntrySchema = z.object({
  service: z.string(),
  timestamp: z.string(),
  message: z.string(),
});

export const logEntryListSchema = z.array(logEntrySchema);

export const metricPointSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
});

export const metricSeriesSchema = z.object({
  unit: z.string(),
  points: z.array(metricPointSchema),
});

export const vpsMetricsSchema = z.object({
  cpuUsage: metricSeriesSchema.optional(),
  ramUsage: metricSeriesSchema.optional(),
  diskSpace: metricSeriesSchema.optional(),
  incomingTraffic: metricSeriesSchema.optional(),
  outgoingTraffic: metricSeriesSchema.optional(),
  uptime: metricSeriesSchema.optional(),
});

export type ContainerStats = z.infer<typeof containerStatsSchema>;
export type Container = z.infer<typeof containerSchema>;
export type DockerProject = z.infer<typeof dockerProjectSchema>;
export type DeployProjectResponse = z.infer<typeof deployProjectResponseSchema>;
export type ActionResult = z.infer<typeof actionResultSchema>;
export type VirtualMachine = z.infer<typeof virtualMachineSchema>;
export type ConnectionTestResult = z.infer<typeof connectionTestResultSchema>;
export type ProjectContent = z.infer<typeof projectContentSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type MetricPoint = z.infer<typeof metricPointSchema>;
export type MetricSeries = z.infer<typeof metricSeriesSchema>;
export type VpsMetrics = z.infer<typeof vpsMetricsSchema>;
