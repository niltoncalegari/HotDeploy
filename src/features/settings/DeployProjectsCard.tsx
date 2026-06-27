import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listGitHubRepos } from "@/lib/github/client";
import { githubRepoLabel, parseGithubRepoFromUrl } from "@/lib/github/repo";
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
  const [name, setName] = useState("");
  const [connectionProfileId, setConnectionProfileId] = useState("");
  const [dockerProjectName, setDockerProjectName] = useState("");
  const [deploySourceType, setDeploySourceType] = useState<"local" | "github">(
    "local",
  );
  const [composeFilePath, setComposeFilePath] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");
  const [environmentProfile, setEnvironmentProfile] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: githubRepos = [] } = useQuery({
    queryKey: ["github-repos"],
    queryFn: () => listGitHubRepos(1),
    enabled: deploySourceType === "github",
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: saveWorkspace,
    onError: () => {
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
    }
  };

  const handleAdd = () => {
    if (workspace.connectionProfiles.length === 0) {
      toast.error("Add a connection profile before creating deploy projects.");
      return;
    }

    const profileId =
      connectionProfileId || workspace.connectionProfiles[0]?.id || "";

    if (!name.trim() || !profileId || !dockerProjectName.trim()) {
      toast.error("Fill in name, VPS profile, and Docker project name.");
      return;
    }

    if (deploySourceType === "local" && !composeFilePath.trim()) {
      toast.error("Select a local compose file.");
      return;
    }

    if (deploySourceType === "github" && !repositoryUrl.trim() && !selectedRepoFullName) {
      toast.error("Select or enter a GitHub repository.");
      return;
    }

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
      connectionProfileId: profileId,
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
    setDockerProjectName("");
    setComposeFilePath("");
    setRepositoryUrl("");
    setSelectedRepoFullName("");
    setEnvironmentProfile("");
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

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="size-4" />
          Deploy projects
        </CardTitle>
        <CardDescription>
          Register Compose files or GitHub repos to deploy on a configured VPS
          target.
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Display name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My API"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-profile">Connection profile</Label>
            <select
              id="project-profile"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={connectionProfileId || workspace.connectionProfiles[0]?.id || ""}
              onChange={(event) => setConnectionProfileId(event.target.value)}
              disabled={workspace.connectionProfiles.length === 0}
            >
              {workspace.connectionProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="docker-project-name">Docker project name</Label>
            <Input
              id="docker-project-name"
              value={dockerProjectName}
              onChange={(event) => setDockerProjectName(event.target.value)}
              placeholder="my-api"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deploy-source-type">Deploy source</Label>
            <select
              id="deploy-source-type"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={deploySourceType}
              onChange={(event) =>
                setDeploySourceType(event.target.value as "local" | "github")
              }
            >
              <option value="local">Local compose file</option>
              <option value="github">GitHub repository</option>
            </select>
          </div>
          {deploySourceType === "local" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="compose-file-path">Compose file path</Label>
              <div className="flex gap-2">
                <Input
                  id="compose-file-path"
                  value={composeFilePath}
                  onChange={(event) => setComposeFilePath(event.target.value)}
                  placeholder="/Users/me/app/docker-compose.yaml"
                />
                <Button type="button" variant="outline" onClick={handlePickComposeFile}>
                  Browse
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 md:col-span-2">
              {githubRepos.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="github-repo-picker">Repository from GitHub</Label>
                  <select
                    id="github-repo-picker"
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                    value={selectedRepoFullName}
                    onChange={(event) => {
                      setSelectedRepoFullName(event.target.value);
                      if (event.target.value) {
                        setRepositoryUrl(
                          `https://github.com/${event.target.value}`,
                        );
                      }
                    }}
                  >
                    <option value="">Select repository…</option>
                    {githubRepos.map((repo) => (
                      <option key={repo.id} value={repo.fullName}>
                        {repo.fullName}
                        {repo.private ? " (private)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <Label htmlFor="repository-url">Or GitHub repository URL</Label>
              <Input
                id="repository-url"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/user/repo"
              />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="environment-profile">
              Environment profile (optional)
            </Label>
            <Textarea
              id="environment-profile"
              value={environmentProfile}
              onChange={(event) => setEnvironmentProfile(event.target.value)}
              placeholder={"NODE_ENV=production\nPORT=3000"}
              rows={3}
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAdd}
          disabled={
            saveMutation.isPending || workspace.connectionProfiles.length === 0
          }
        >
          <Plus className="size-4" />
          Add deploy project
        </Button>
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
