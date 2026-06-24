import { z } from "zod";

export const containerHealthSchema = z.enum([
  "healthy",
  "unhealthy",
  "starting",
  "none",
]);

export const containerSchema = z.object({
  name: z.string(),
  image: z.string(),
  health: containerHealthSchema,
  ports: z.array(z.string()),
});

export const dockerProjectSchema = z.object({
  name: z.string(),
  state: z.string(),
  filePath: z.string(),
  containers: z.array(containerSchema),
});

export const dockerProjectListSchema = z.array(dockerProjectSchema);

export const deployProjectResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  state: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const virtualMachineSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  state: z.string(),
});

export const virtualMachineListSchema = z.array(virtualMachineSchema);

export type Container = z.infer<typeof containerSchema>;
export type DockerProject = z.infer<typeof dockerProjectSchema>;
export type DeployProjectResponse = z.infer<typeof deployProjectResponseSchema>;
export type VirtualMachine = z.infer<typeof virtualMachineSchema>;
