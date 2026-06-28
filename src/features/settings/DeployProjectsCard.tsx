import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { FieldError, FieldLabel } from "@/components/form/FieldLabel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DEPLOY_PROJECT_FIELD_HELP,
  hasDeployProjectFormErrors,
  validateDeployProjectForm,
  type DeployProjectFieldErrors,
} from "@/features/settings/deployProjectForm";
import { listGitHubRepos } from "@/lib/github/client";
import { logDiagnosticError } from "@/lib/diagnostics/client";
import { githubRepoLabel, parseGithubRepoFromUrl } from "@/lib/github/repo";
import {
  getCredentialsStatus,
  listProjects,
  parseHostingerError,
} from "@/lib/hostinger/client";
import { saveWorkspace } from "@/lib/workspace/client";
import {
  createDeployProjectConfig,
  type DeployProjectConfig,
  type WorkspaceConfig,
} from "@/lib/workspace/schemas";

interface DeployProjectsCardProps {
  workspace: WorkspaceConfig;
}

export function DeployProjectsCard({ workspace }: DeployProjectsCardProps) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const dockerProjectHint = searchParams.get("dockerProject")
    ? decodeURIComponent(searchParams.get("dockerProject")!)
    : "";
  const [name, setName] = useState("");
  const [connectionProfileId, setConnectionProfileId] = useState(
    () => workspace.connectionProfiles[0]?.id ?? "",
  );
  const [dockerProjectName, setDockerProjectName] = useState(dockerProjectHint);
  const [dockerProjectManualEntry, setDockerProjectManualEntry] = useState(false);
  const [deploySourceType, setDeploySourceType] = useState<"local" | "github">(
    dockerProjectHint ? "github" : "local",
  );
  const [composeFilePath, setComposeFilePath] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");
  const [environmentProfile, setEnvironmentProfile] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<DeployProjectFieldErrors>({});

  const selectedProfileId =
    connectionProfileId || workspace.connectionProfiles[0]?.id || "";

  const selectedProfile = workspace.connectionProfiles.find(
    (profile) => profile.id === selectedProfileId,
  );

  const { data: credentials } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  const {
    data: remoteDockerProjects = [],
    isLoading: remoteProjectsLoading,
    isError: remoteProjectsError,
    error: remoteProjectsQueryError,
    refetch: refetchRemoteProjects,
  } = useQuery({
    queryKey: [
      "projects",
      selectedProfile?.virtualMachineId,
      selectedProfile?.provider,
    ],
    queryFn: () =>
      listProjects(
        selectedProfile!.virtualMachineId,
        selectedProfile!.provider ?? "hostinger",
      ),
    enabled: Boolean(selectedProfile && credentials?.configured),
    retry: false,
  });

  const dockerProjectInRemoteList = remoteDockerProjects.some(
    (project) => project.name === dockerProjectName,
  );
  const showDockerProjectPicker =
    Boolean(selectedProfile && credentials?.configured) &&
    !dockerProjectManualEntry &&
    (remoteProjectsLoading ||
      (remoteDockerProjects.length > 0 &&
        (!dockerProjectName || dockerProjectInRemoteList)));

  const { data: githubRepos = [] } = useQuery({
    queryKey: ["github-repos"],
    queryFn: () => listGitHubRepos(1),
    enabled: deploySourceType === "github",
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: saveWorkspace,
    onError: (error, config) => {
      const lastProject =
        config.deployProjects[config.deployProjects.length - 1];
      void logDiagnosticError("DeployProjectsCard.save", error, {
        deployProjectName: lastProject?.name,
        dockerProjectName: lastProject?.dockerProjectName,
      });
      toast.error("Failed to save deploy project.");
    },
  });

  const persist = (nextProjects: DeployProjectConfig[]) => {
    const nextConfig: WorkspaceConfig = {
      ...workspace,
      deployProjects: nextProjects,
    };

    queryClient.setQueryData(["workspace"], nextConfig);
    saveMutation.mutate(nextConfig);
  };

  const clearFieldError = (field: keyof DeployProjectFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      if (field !== "form") {
        delete next.form;
      }
      return next;
    });
  };

  const handlePickComposeFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Docker Compose",
          extensions: ["yaml", "yml"],
        },
      ],
    });

    if (typeof selected === "string") {
      setComposeFilePath(selected);
      clearFieldError("composeFilePath");
    }
  };

  const handleDockerProjectPick = (value: string) => {
    if (value === "__none__") {
      setDockerProjectName("");
      setDockerProjectManualEntry(false);
      clearFieldError("dockerProjectName");
      return;
    }

    if (value === "__custom__") {
      setDockerProjectManualEntry(true);
      setDockerProjectName("");
      clearFieldError("dockerProjectName");
      return;
    }

    setDockerProjectManualEntry(false);
    setDockerProjectName(value);
    if (!name.trim()) {
      setName(value);
    }
    clearFieldError("dockerProjectName");
  };

  const handleAdd = () => {
    const errors = validateDeployProjectForm(
      {
        name,
        connectionProfileId: selectedProfileId,
        dockerProjectName,
        deploySourceType,
        composeFilePath,
        repositoryUrl,
        selectedRepoFullName,
      },
      workspace.connectionProfiles.length > 0,
    );

    if (hasDeployProjectFormErrors(errors)) {
      setFieldErrors(errors);
      toast.error(
        errors.form ?? "Fill in all required fields marked with * before saving.",
      );
      return;
    }

    setFieldErrors({});

    const resolvedUrl =
      repositoryUrl.trim() ||
      (selectedRepoFullName
        ? `https://github.com/${selectedRepoFullName}`
        : "");

    const githubLink = parseGithubRepoFromUrl(resolvedUrl) ?? undefined;
    const selectedRepo = githubRepos.find(
      (repo) => repo.fullName === selectedRepoFullName,
    );

    const project = createDeployProjectConfig({
      name: name.trim(),
      connectionProfileId: selectedProfileId,
      dockerProjectName: dockerProjectName.trim(),
      deploySource:
        deploySourceType === "local"
          ? { type: "local", composeFilePath: composeFilePath.trim() }
          : { type: "github", repositoryUrl: resolvedUrl },
      environmentProfile: environmentProfile.trim() || undefined,
      githubLink: githubLink
        ? {
            ...githubLink,
            defaultBranch: selectedRepo?.defaultBranch,
          }
        : undefined,
    });

    persist([...workspace.deployProjects, project]);
    setName("");
    setDockerProjectName(dockerProjectHint);
    setComposeFilePath("");
    setRepositoryUrl("");
    setSelectedRepoFullName("");
    setEnvironmentProfile("");
    setDockerProjectManualEntry(false);
    toast.success("Deploy project saved.");
  };

  const confirmRemove = () => {
    if (!pendingDeleteId) {
      return;
    }
    persist(
      workspace.deployProjects.filter((project) => project.id !== pendingDeleteId),
    );
    setPendingDeleteId(null);
    toast.success("Deploy project removed.");
  };

  const noConnectionProfiles = workspace.connectionProfiles.length === 0;

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="size-4" />
          Deploy projects
        </CardTitle>
        <CardDescription>
          Register Compose files or GitHub repos to deploy on a configured VPS
          target. Fields marked with{" "}
          <span className="text-destructive font-medium">*</span> are required.
          Hover the{" "}
          <span className="text-muted-foreground inline-flex align-middle">
            ?
          </span>{" "}
          icon next to each label for guidance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {workspace.deployProjects.length === 0 ? (
          <EmptyState
            title="No deploy projects"
            description="Register a Compose file or GitHub repo to deploy from the Projects page."
          />
        ) : (
          <ul className="space-y-3">
            {workspace.deployProjects.map((project) => {
              const profile = workspace.connectionProfiles.find(
                (item) => item.id === project.connectionProfileId,
              );

              return (
                <li
                  key={project.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Docker project: {project.dockerProjectName}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      VPS: {profile?.label ?? "Unknown profile"}
                    </p>
                    <p className="text-muted-foreground text-sm break-all">
                      {project.deploySource.type === "local"
                        ? project.deploySource.composeFilePath
                        : project.deploySource.repositoryUrl}
                    </p>
                    {project.githubLink ? (
                      <p className="text-muted-foreground text-sm">
                        GitHub: {githubRepoLabel(project.githubLink)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPendingDeleteId(project.id)}
                    aria-label={`Remove ${project.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {noConnectionProfiles ? (
          <div
            className="border-destructive/30 bg-destructive/5 rounded-md border p-3 text-sm"
            role="alert"
          >
            <p className="font-medium">Connection profile required</p>
            <p className="text-muted-foreground mt-1">
              {credentials?.configured
                ? "Your API key is connected, but no VPS profile is saved in the workspace yet. Reload the app or open Settings → Providers — HotDeploy will sync one automatically from your saved VM ID."
                : "Save your provider API key and create a VPS connection profile before adding deploy projects."}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/settings?tab=providers">Open Providers settings</Link>
            </Button>
          </div>
        ) : null}

        {fieldErrors.form ? (
          <p className="text-destructive text-sm" role="alert">
            {fieldErrors.form}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel
              htmlFor="deploy-source-type"
              required
              help={DEPLOY_PROJECT_FIELD_HELP.deploySourceType}
            >
              Deploy source
            </FieldLabel>
            <Select
              value={deploySourceType}
              onValueChange={(value) => {
                setDeploySourceType(value as "local" | "github");
                clearFieldError("composeFilePath");
                clearFieldError("repositoryUrl");
              }}
            >
              <SelectTrigger id="deploy-source-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local compose file</SelectItem>
                <SelectItem value="github">GitHub repository</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="project-profile"
              required
              help={DEPLOY_PROJECT_FIELD_HELP.connectionProfileId}
            >
              Connection profile
            </FieldLabel>
            <Select
              value={selectedProfileId}
              onValueChange={(value) => {
                setConnectionProfileId(value);
                setDockerProjectName("");
                setDockerProjectManualEntry(false);
                clearFieldError("connectionProfileId");
                clearFieldError("dockerProjectName");
              }}
              disabled={noConnectionProfiles}
            >
              <SelectTrigger
                id="project-profile"
                className="w-full"
                aria-invalid={Boolean(fieldErrors.connectionProfileId)}
                aria-describedby={
                  fieldErrors.connectionProfileId ? "project-profile-error" : undefined
                }
              >
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {workspace.connectionProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.label} · VM {profile.virtualMachineId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              id="project-profile-error"
              message={fieldErrors.connectionProfileId}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="docker-project-name"
              required
              help={DEPLOY_PROJECT_FIELD_HELP.dockerProjectName}
            >
              Docker project
            </FieldLabel>
            {showDockerProjectPicker ? (
              <div className="space-y-2">
                <Select
                  value={
                    dockerProjectName && dockerProjectInRemoteList
                      ? dockerProjectName
                      : dockerProjectManualEntry
                        ? "__custom__"
                        : "__none__"
                  }
                  onValueChange={handleDockerProjectPick}
                  disabled={remoteProjectsLoading}
                >
                  <SelectTrigger
                    id="docker-project-name"
                    className="w-full"
                    aria-invalid={Boolean(fieldErrors.dockerProjectName)}
                    aria-describedby={
                      fieldErrors.dockerProjectName
                        ? "docker-project-name-error"
                        : undefined
                    }
                  >
                    <SelectValue
                      placeholder={
                        remoteProjectsLoading
                          ? "Loading Docker projects…"
                          : "Select Docker project…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select Docker project…</SelectItem>
                    {remoteDockerProjects.map((project) => (
                      <SelectItem key={project.name} value={project.name}>
                        {project.name} · {project.state}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Enter name manually…</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={remoteProjectsLoading}
                    onClick={() => {
                      void refetchRemoteProjects();
                    }}
                  >
                    {remoteProjectsLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Refresh list
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  id="docker-project-name"
                  value={dockerProjectName}
                  onChange={(event) => {
                    setDockerProjectName(event.target.value);
                    clearFieldError("dockerProjectName");
                  }}
                  placeholder="mflow-staging"
                  aria-invalid={Boolean(fieldErrors.dockerProjectName)}
                  aria-describedby={
                    fieldErrors.dockerProjectName
                      ? "docker-project-name-error"
                      : undefined
                  }
                />
                {!credentials?.configured ? (
                  <p className="text-muted-foreground text-xs">
                    Save your provider API key under Settings → Providers to
                    load Docker projects from the VPS.
                  </p>
                ) : remoteProjectsError ? (
                  <p className="text-destructive text-xs">
                    {parseHostingerError(remoteProjectsQueryError)}
                  </p>
                ) : remoteDockerProjects.length === 0 && selectedProfile ? (
                  <p className="text-muted-foreground text-xs">
                    No Docker projects found on this VPS yet. Enter the name
                    manually or deploy from the Projects page first.
                  </p>
                ) : null}
                {remoteDockerProjects.length > 0 ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0"
                    onClick={() => {
                      setDockerProjectManualEntry(false);
                      setDockerProjectName("");
                      clearFieldError("dockerProjectName");
                    }}
                  >
                    Pick from VPS list
                  </Button>
                ) : null}
              </div>
            )}
            <FieldError
              id="docker-project-name-error"
              message={fieldErrors.dockerProjectName}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="project-name"
              required
              help={DEPLOY_PROJECT_FIELD_HELP.name}
            >
              Display name
            </FieldLabel>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearFieldError("name");
              }}
              placeholder="MFlow Staging"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "project-name-error" : undefined}
            />
            <FieldError id="project-name-error" message={fieldErrors.name} />
          </div>
          {deploySourceType === "local" ? (
            <div className="space-y-2 md:col-span-2">
              <FieldLabel
                htmlFor="compose-file-path"
                required
                help={DEPLOY_PROJECT_FIELD_HELP.composeFilePath}
              >
                Compose file path
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="compose-file-path"
                  value={composeFilePath}
                  onChange={(event) => {
                    setComposeFilePath(event.target.value);
                    clearFieldError("composeFilePath");
                  }}
                  placeholder="/Users/me/app/docker-compose.yaml"
                  aria-invalid={Boolean(fieldErrors.composeFilePath)}
                  aria-describedby={
                    fieldErrors.composeFilePath ? "compose-file-path-error" : undefined
                  }
                />
                <Button type="button" variant="outline" onClick={handlePickComposeFile}>
                  Browse
                </Button>
              </div>
              <FieldError
                id="compose-file-path-error"
                message={fieldErrors.composeFilePath}
              />
            </div>
          ) : (
            <div className="space-y-4 md:col-span-2">
              {githubRepos.length > 0 ? (
                <div className="space-y-2">
                  <FieldLabel
                    htmlFor="github-repo-picker"
                    required
                    help={DEPLOY_PROJECT_FIELD_HELP.githubRepoPicker}
                  >
                    Repository from GitHub
                  </FieldLabel>
                  <Select
                    value={selectedRepoFullName || "__none__"}
                    onValueChange={(value) => {
                      const next = value === "__none__" ? "" : value;
                      setSelectedRepoFullName(next);
                      if (next) {
                        setRepositoryUrl(`https://github.com/${next}`);
                      }
                      clearFieldError("repositoryUrl");
                    }}
                  >
                    <SelectTrigger id="github-repo-picker" className="w-full">
                      <SelectValue placeholder="Select repository…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select repository…</SelectItem>
                      {githubRepos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.fullName}>
                          {repo.fullName}
                          {repo.private ? " (private)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Connect GitHub under Settings → GitHub & CI to load your
                  repository list, or paste a URL below.
                </p>
              )}
              <div className="space-y-2">
                <FieldLabel
                  htmlFor="repository-url"
                  required={githubRepos.length === 0}
                  help={DEPLOY_PROJECT_FIELD_HELP.repositoryUrl}
                >
                  {githubRepos.length > 0
                    ? "Or GitHub repository URL"
                    : "GitHub repository URL"}
                </FieldLabel>
                <Input
                  id="repository-url"
                  value={repositoryUrl}
                  onChange={(event) => {
                    setRepositoryUrl(event.target.value);
                    clearFieldError("repositoryUrl");
                  }}
                  placeholder="https://github.com/user/repo"
                  aria-invalid={Boolean(fieldErrors.repositoryUrl)}
                  aria-describedby={
                    fieldErrors.repositoryUrl ? "repository-url-error" : undefined
                  }
                />
                <FieldError
                  id="repository-url-error"
                  message={fieldErrors.repositoryUrl}
                />
              </div>
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <FieldLabel
              htmlFor="environment-profile"
              help={DEPLOY_PROJECT_FIELD_HELP.environmentProfile}
            >
              Environment profile (optional)
            </FieldLabel>
            <Textarea
              id="environment-profile"
              value={environmentProfile}
              onChange={(event) => setEnvironmentProfile(event.target.value)}
              placeholder={"NODE_ENV=production\nPORT=3000"}
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={handleAdd}
            disabled={saveMutation.isPending || noConnectionProfiles}
          >
            <Plus className="size-4" />
            Add deploy project
          </Button>
          {noConnectionProfiles ? (
            <p className="text-muted-foreground text-xs">
              Add a connection profile in Settings → Providers to enable this
              button.
            </p>
          ) : null}
        </div>
      </CardContent>

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove deploy project?</DialogTitle>
            <DialogDescription>
              This removes the local deploy configuration only. Remote Docker
              Projects on the VPS are not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
