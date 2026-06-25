import { z } from "zod";

export const themeModeSchema = z.enum(["light", "dark"]);

export const providerIdSchema = z.enum(["hostinger", "digitalocean"]);

export const workspacePreferencesSchema = z.object({
  theme: themeModeSchema,
});

export const connectionProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  provider: providerIdSchema,
  virtualMachineId: z.number().int().positive(),
});

export const deploySourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("local"),
    composeFilePath: z.string().min(1),
  }),
  z.object({
    type: z.literal("github"),
    repositoryUrl: z.string().url(),
  }),
]);

export const deployProjectConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  connectionProfileId: z.string().min(1),
  dockerProjectName: z.string().min(1),
  deploySource: deploySourceSchema,
  environmentProfile: z.string().optional(),
});

export const workspaceConfigSchema = z.object({
  version: z.number().int().positive(),
  preferences: workspacePreferencesSchema,
  connectionProfiles: z.array(connectionProfileSchema),
  activeConnectionProfileId: z.string().optional(),
  deployProjects: z.array(deployProjectConfigSchema),
});

export type ProviderId = z.infer<typeof providerIdSchema>;
export type ThemeMode = z.infer<typeof themeModeSchema>;
export type WorkspacePreferences = z.infer<typeof workspacePreferencesSchema>;
export type ConnectionProfile = z.infer<typeof connectionProfileSchema>;
export type DeploySource = z.infer<typeof deploySourceSchema>;
export type DeployProjectConfig = z.infer<typeof deployProjectConfigSchema>;
export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;

export const defaultWorkspaceConfig: WorkspaceConfig = {
  version: 1,
  preferences: { theme: "light" },
  connectionProfiles: [],
  deployProjects: [],
};

export function createConnectionProfile(
  label: string,
  virtualMachineId: number,
  provider: ProviderId = "hostinger",
): ConnectionProfile {
  return {
    id: crypto.randomUUID(),
    label,
    provider,
    virtualMachineId,
  };
}

export function createDeployProjectConfig(
  input: Omit<DeployProjectConfig, "id">,
): DeployProjectConfig {
  return {
    id: crypto.randomUUID(),
    ...input,
  };
}
