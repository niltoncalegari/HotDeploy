// As a developer, I want deploy configs filtered by VPS so that I only see relevant projects.
import { describe, expect, it } from "vitest";

import {
  filterDeployProjectsForProfile,
  githubRepoLabel,
  githubRepoUrl,
  parseGithubRepoFromUrl,
  resolveGithubLinkFromDeployProject,
} from "@/lib/github/repo";

describe("parseGithubRepoFromUrl", () => {
  it("parses standard GitHub URLs", () => {
    expect(parseGithubRepoFromUrl("https://github.com/acme/widget")).toEqual({
      owner: "acme",
      repo: "widget",
    });
  });

  it("returns null for invalid URLs", () => {
    expect(parseGithubRepoFromUrl("not-a-url")).toBeNull();
  });
});

describe("githubRepoLabel", () => {
  it("formats owner/repo", () => {
    expect(githubRepoLabel({ owner: "acme", repo: "api" })).toBe("acme/api");
  });
});

describe("githubRepoUrl", () => {
  it("builds canonical GitHub URL", () => {
    expect(githubRepoUrl({ owner: "acme", repo: "api" })).toBe(
      "https://github.com/acme/api",
    );
  });
});

describe("filterDeployProjectsForProfile", () => {
  it("returns empty list without profile id", () => {
    expect(filterDeployProjectsForProfile([], undefined)).toEqual([]);
  });

  it("filters by connection profile id", () => {
    const projects = [
      { id: "1", connectionProfileId: "a" },
      { id: "2", connectionProfileId: "b" },
    ];
    expect(filterDeployProjectsForProfile(projects, "a")).toHaveLength(1);
  });
});

describe("resolveGithubLinkFromDeployProject", () => {
  it("prefers explicit githubLink", () => {
    expect(
      resolveGithubLinkFromDeployProject({
        githubLink: { owner: "acme", repo: "api" },
        deploySource: { type: "github", repositoryUrl: "https://github.com/other/repo" },
      }),
    ).toEqual({ owner: "acme", repo: "api" });
  });

  it("derives link from github deploy source URL", () => {
    expect(
      resolveGithubLinkFromDeployProject({
        deploySource: {
          type: "github",
          repositoryUrl: "https://github.com/acme/widget",
        },
      }),
    ).toEqual({ owner: "acme", repo: "widget" });
  });

  it("returns null for local deploy sources", () => {
    expect(
      resolveGithubLinkFromDeployProject({
        deploySource: { type: "local" },
      }),
    ).toBeNull();
  });
});
