// As a developer, I want a consistent VPS switcher so that I can change the active profile easily.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VpsSwitcher } from "@/components/layout/VpsSwitcher";

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/lib/workspace/hooks", () => ({
  useWorkspace: () => ({
    data: {
      connectionProfiles: [
        { id: "p1", label: "Prod", virtualMachineId: 1, provider: "hostinger" },
        { id: "p2", label: "Staging", virtualMachineId: 2, provider: "hostinger" },
      ],
      activeConnectionProfileId: "p1",
    },
  }),
}));

describe("VpsSwitcher", () => {
  it("renders shadcn select trigger", () => {
    render(<VpsSwitcher />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText(/prod/i)).toBeInTheDocument();
  });
});
