import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCredentialsStatus,
  saveCredentials,
} from "@/lib/hostinger/client";
import {
  getGitHubStatus,
  parseGitHubError,
  saveGitHubPat,
} from "@/lib/github/client";
import { saveWorkspace } from "@/lib/workspace/client";
import { useWorkspace } from "@/lib/workspace/hooks";
import type { WorkspaceConfig } from "@/lib/workspace/schemas";

const STEPS = [
  "Welcome",
  "Provider API key",
  "GitHub (optional)",
  "SSH (optional)",
  "Done",
] as const;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: workspace } = useWorkspace();
  const [step, setStep] = useState(0);
  const [skipSetup, setSkipSetup] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [vmId, setVmId] = useState("");
  const [pat, setPat] = useState("");

  const { data: credentials } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  const { data: githubStatus } = useQuery({
    queryKey: ["github-status"],
    queryFn: getGitHubStatus,
  });

  const completeMutation = useMutation({
    mutationFn: async (config: WorkspaceConfig) => {
      await saveWorkspace(config);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      navigate("/", { replace: true });
      toast.success("Setup complete. Welcome to HotDeploy!");
    },
  });

  const saveProviderMutation = useMutation({
    mutationFn: async () => {
      const parsedVm = Number(vmId);
      if (!apiKey.trim() || !Number.isFinite(parsedVm) || parsedVm <= 0) {
        throw new Error("API key and VM ID are required.");
      }
      await saveCredentials(apiKey.trim(), parsedVm);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["credentials-status"] });
      toast.success("Provider credentials saved.");
      setStep(2);
    },
    onError: (error) => toast.error(String(error)),
  });

  const saveGitHubMutation = useMutation({
    mutationFn: async () => {
      if (!pat.trim()) {
        return;
      }
      await saveGitHubPat(pat.trim());
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["github-status"] });
      setPat("");
      setStep(3);
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const finish = () => {
    if (!workspace) {
      return;
    }
    completeMutation.mutate({
      ...workspace,
      onboardingCompleted: true,
    });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
            <Flame className="text-primary size-6" />
          </div>
          <CardTitle>HotDeploy setup</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Connect your VPS provider, optionally link GitHub for CI/CD, and
                start deploying Docker Compose projects from your desktop.
              </p>
              <div className="flex items-start gap-2">
                <input
                  id="onboard-skip-setup"
                  type="checkbox"
                  className="border-input mt-0.5 size-4 rounded border"
                  checked={skipSetup}
                  onChange={(event) => setSkipSetup(event.target.checked)}
                />
                <Label
                  htmlFor="onboard-skip-setup"
                  className="text-muted-foreground cursor-pointer text-sm leading-snug font-normal"
                >
                  Don&apos;t show setup again — skip and configure later in
                  Settings
                </Label>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="onboard-api-key">Hostinger API key</Label>
                <Input
                  id="onboard-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Paste API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboard-vm-id">Default VM ID</Label>
                <Input
                  id="onboard-vm-id"
                  inputMode="numeric"
                  value={vmId}
                  onChange={(event) => setVmId(event.target.value)}
                  placeholder="123456"
                />
              </div>
              {credentials?.configured ? (
                <p className="text-muted-foreground text-xs">
                  Credentials already configured — you can continue.
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Add a GitHub PAT to list repos, manage secrets, and install
                runners. You can skip and configure later in Settings.
              </p>
              <div className="space-y-2">
                <Label htmlFor="onboard-pat">GitHub PAT</Label>
                <Input
                  id="onboard-pat"
                  type="password"
                  value={pat}
                  onChange={(event) => setPat(event.target.value)}
                  placeholder={githubStatus?.connected ? "••••••••" : "ghp_…"}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <p className="text-muted-foreground text-sm">
              SSH credentials (Settings → SSH) are needed for self-hosted runner
              install. Configure them later if you prefer.
            </p>
          ) : null}

          {step === 4 ? (
            <p className="text-muted-foreground text-sm">
              You are ready to open the Deployment Panel. Add Connection
              Profiles and Deploy Projects in Settings anytime.
            </p>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            {step > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            {step === 1 ? (
              <Button
                disabled={saveProviderMutation.isPending}
                onClick={() => {
                  if (credentials?.configured && !apiKey.trim()) {
                    setStep(2);
                    return;
                  }
                  saveProviderMutation.mutate();
                }}
              >
                {saveProviderMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Continue
              </Button>
            ) : step === 2 ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Skip
                </Button>
                <Button
                  disabled={saveGitHubMutation.isPending}
                  onClick={() => {
                    if (!pat.trim()) {
                      setStep(3);
                      return;
                    }
                    saveGitHubMutation.mutate();
                  }}
                >
                  {saveGitHubMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Continue
                </Button>
              </div>
            ) : step === 3 ? (
              <Button onClick={() => setStep(4)}>Continue</Button>
            ) : step === 4 ? (
              <Button
                disabled={completeMutation.isPending}
                onClick={finish}
              >
                {completeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Open Deployment Panel
              </Button>
            ) : skipSetup ? (
              <Button
                disabled={completeMutation.isPending}
                onClick={finish}
              >
                {completeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Open Deployment Panel
              </Button>
            ) : (
              <Button onClick={() => setStep(1)}>Get started</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
