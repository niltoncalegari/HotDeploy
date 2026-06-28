export interface GitHubLink {
  owner: string;
  repo: string;
  defaultBranch?: string;
}

const GITHUB_URL_PATTERN =
  /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i;

export function parseGithubRepoFromUrl(url: string): GitHubLink | null {
  const match = GITHUB_URL_PATTERN.exec(url.trim());
  if (!match?.[1] || !match[2]) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

export function githubRepoLabel(link: GitHubLink): string {
  return `${link.owner}/${link.repo}`;
}

export function githubRepoUrl(link: GitHubLink): string {
  return `https://github.com/${link.owner}/${link.repo}`;
}

export function filterDeployProjectsForProfile<T extends { connectionProfileId: string }>(
  projects: T[],
  profileId: string | undefined,
): T[] {
  if (!profileId) {
    return [];
  }
  return projects.filter((project) => project.connectionProfileId === profileId);
}

export function resolveGithubLinkFromDeployProject(project: {
  githubLink?: GitHubLink;
  deploySource: { type: string; repositoryUrl?: string };
}): GitHubLink | null {
  if (project.githubLink) {
    return project.githubLink;
  }

  if (project.deploySource.type === "github" && project.deploySource.repositoryUrl) {
    return parseGithubRepoFromUrl(project.deploySource.repositoryUrl);
  }

  return null;
}
