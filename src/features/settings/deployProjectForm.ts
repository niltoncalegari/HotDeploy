export interface DeployProjectFormValues {
  name: string;
  connectionProfileId: string;
  dockerProjectName: string;
  deploySourceType: "local" | "github";
  composeFilePath: string;
  repositoryUrl: string;
  selectedRepoFullName: string;
}

export type DeployProjectFieldErrors = Partial<
  Record<
    | "name"
    | "connectionProfileId"
    | "dockerProjectName"
    | "composeFilePath"
    | "repositoryUrl"
    | "form",
    string
  >
>;

export function validateDeployProjectForm(
  values: DeployProjectFormValues,
  hasConnectionProfiles: boolean,
): DeployProjectFieldErrors {
  const errors: DeployProjectFieldErrors = {};

  if (!hasConnectionProfiles) {
    errors.form =
      "Add a connection profile under Settings → Providers before registering deploy projects.";
    errors.connectionProfileId = "Select a VPS connection profile.";
    return errors;
  }

  if (!values.name.trim()) {
    errors.name = "Enter a display name (e.g. MFlow Staging).";
  }

  if (!values.connectionProfileId.trim()) {
    errors.connectionProfileId = "Select the VPS where this project runs.";
  }

  if (!values.dockerProjectName.trim()) {
    errors.dockerProjectName =
      "Select a Docker project from the VPS or enter its name manually.";
  }

  if (values.deploySourceType === "local" && !values.composeFilePath.trim()) {
    errors.composeFilePath = "Choose or paste the path to your docker-compose file.";
  }

  if (
    values.deploySourceType === "github" &&
    !values.repositoryUrl.trim() &&
    !values.selectedRepoFullName.trim()
  ) {
    errors.repositoryUrl =
      "Pick a repository from the list or paste a GitHub URL (https://github.com/owner/repo).";
  }

  return errors;
}

export function hasDeployProjectFormErrors(errors: DeployProjectFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export const DEPLOY_PROJECT_FIELD_HELP = {
  name: "Friendly label shown in HotDeploy. It does not need to match the VPS folder name.",
  connectionProfileId:
    "The VPS target for deploys. Create one in Settings → Providers if the list is empty.",
  dockerProjectName:
    "Pick a Docker project from the selected VPS, or enter the name manually if it is not listed yet.",
  deploySourceType:
    "Local deploys from a compose file on this machine. GitHub deploys from a linked repository.",
  composeFilePath:
    "Absolute path to docker-compose.yaml or docker-compose.yml on this computer.",
  githubRepoPicker:
    "Repositories visible to your connected GitHub account. Connect GitHub under Settings → GitHub & CI first.",
  repositoryUrl:
    "Use when the repo is not in the picker. Format: https://github.com/owner/repo",
  environmentProfile:
    "Optional KEY=value lines used for deploy environment variables or GitHub secrets sync.",
} as const;
