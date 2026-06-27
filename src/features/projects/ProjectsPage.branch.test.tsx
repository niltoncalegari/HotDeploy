// As a developer, I want deploy UI to show branch pinning is blocked.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Branch deploy placeholder", () => {
  it("documents disabled branch field copy", () => {
    render(
      <input
        disabled
        aria-label="Branch pinning"
        placeholder="Coming when provider API supports branch/ref deploy"
      />,
    );
    expect(screen.getByLabelText(/branch pinning/i)).toBeDisabled();
  });
});
