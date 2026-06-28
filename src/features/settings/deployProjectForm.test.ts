import { describe, expect, it } from "vitest";

import {
  hasDeployProjectFormErrors,
  validateDeployProjectForm,
} from "@/features/settings/deployProjectForm";

describe("validateDeployProjectForm", () => {
  const baseValues = {
    name: "MFlow Staging",
    connectionProfileId: "profile-1",
    dockerProjectName: "mflow-staging",
    deploySourceType: "github" as const,
    composeFilePath: "",
    repositoryUrl: "https://github.com/acme/mflow",
    selectedRepoFullName: "",
  };

  it("returns no errors for a valid GitHub deploy project", () => {
    expect(validateDeployProjectForm(baseValues, true)).toEqual({});
    expect(hasDeployProjectFormErrors(validateDeployProjectForm(baseValues, true))).toBe(
      false,
    );
  });

  it("requires a connection profile when none exist", () => {
    const errors = validateDeployProjectForm(baseValues, false);
    expect(errors.form).toMatch(/connection profile/i);
    expect(errors.connectionProfileId).toBeTruthy();
  });

  it("requires display name and docker project name", () => {
    const errors = validateDeployProjectForm(
      {
        ...baseValues,
        name: "  ",
        dockerProjectName: "",
      },
      true,
    );

    expect(errors.name).toBeTruthy();
    expect(errors.dockerProjectName).toBeTruthy();
  });

  it("requires a GitHub repository when source is github", () => {
    const errors = validateDeployProjectForm(
      {
        ...baseValues,
        repositoryUrl: "",
        selectedRepoFullName: "",
      },
      true,
    );

    expect(errors.repositoryUrl).toMatch(/repository/i);
  });

  it("accepts a selected repository without URL text", () => {
    const errors = validateDeployProjectForm(
      {
        ...baseValues,
        repositoryUrl: "",
        selectedRepoFullName: "acme/mflow",
      },
      true,
    );

    expect(errors).toEqual({});
  });

  it("requires a compose file for local deploy source", () => {
    const errors = validateDeployProjectForm(
      {
        ...baseValues,
        deploySourceType: "local",
        composeFilePath: "",
      },
      true,
    );

    expect(errors.composeFilePath).toBeTruthy();
  });
});
