import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Info, Loader2, PlugZap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
  clearGitHubPat,
  connectGitHubFromGhCli,
  getGitHubAppConfig,
  getGitHubAuthMethod,
  getGitHubStatus,
  isGitHubAppMisconfiguredError,
  parseGitHubError,
  pollGitHubDeviceToken,
  registerGitHubApp,
  saveGitHubPat,
  startGitHubDeviceFlow,
  testGitHubConnection,
} from "@/lib/github/client";
import { cn } from "@/lib/utils";

function GitHubAppSetupHint({ emphasized = false }: { emphasized?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-md border p-2",
        emphasized
          ? "border-destructive/40 bg-destructive/5"
          : "border-border/60 bg-muted/40",
      )}
      role="note"
    >
      <Info
        className="text-muted-foreground mt-0.5 size-4 shrink-0"
        aria-hidden
      />
      <span className="text-muted-foreground text-xs leading-relaxed">
        <strong className="text-foreground font-medium">First-time setup:</strong>{" "}
        click <strong className="text-foreground font-medium">Register GitHub App</strong>{" "}
        below, confirm creation in your browser, turn on{" "}
        <strong className="text-foreground font-medium">Enable Device Flow</strong>{" "}
        and grant{" "}
        <strong className="text-foreground font-medium">Actions variables</strong>{" "}
        under Repository permissions, then use{" "}
        <strong className="text-foreground font-medium">Connect with GitHub App</strong>.
      </span>
    </div>
  );
}

export function GitHubCredentialsCard() {
  const queryClient = useQueryClient();
  const [pat, setPat] = useState("");
  const [testLogin, setTestLogin] = useState<string | null>(null);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [pollIntervalMs, setPollIntervalMs] = useState(5000);

  const { data: status, isLoading } = useQuery({
    queryKey: ["github-status"],
    queryFn: getGitHubStatus,
  });

  const { data: authMethod } = useQuery({
    queryKey: ["github-auth-method"],
    queryFn: getGitHubAuthMethod,
  });

  const { data: appConfig } = useQuery({
    queryKey: ["github-app-config"],
    queryFn: getGitHubAppConfig,
  });

  const saveMutation = useMutation({
    mutationFn: () => saveGitHubPat(pat.trim()),
    onSuccess: async () => {
      setPat("");
      await queryClient.invalidateQueries({ queryKey: ["github-status"] });
      await queryClient.invalidateQueries({ queryKey: ["github-auth-method"] });
      toast.success("GitHub PAT saved.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const clearMutation = useMutation({
    mutationFn: clearGitHubPat,
    onSuccess: async () => {
      setTestLogin(null);
      setDeviceCode(null);
      setUserCode(null);
      await queryClient.invalidateQueries({ queryKey: ["github-status"] });
      await queryClient.invalidateQueries({ queryKey: ["github-auth-method"] });
      toast.success("GitHub credentials cleared.");
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const testMutation = useMutation({
    mutationFn: testGitHubConnection,
    onSuccess: (result) => {
      setTestLogin(result.login);
      toast.success(`Connected as ${result.login}`);
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const registerMutation = useMutation({
    mutationFn: registerGitHubApp,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["github-app-config"] });
      if (result.deviceFlowReady) {
        toast.success("GitHub App registered. You can connect now.");
        return;
      }
      toast.message(
        "GitHub App registered. Enable Device Flow in the browser tab, then connect.",
      );
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const deviceFlowMutation = useMutation({
    mutationFn: async () => {
      try {
        const device = await startGitHubDeviceFlow();
        return { mode: "device" as const, device };
      } catch (error) {
        if (!isGitHubAppMisconfiguredError(error)) {
          throw error;
        }
        const status = await connectGitHubFromGhCli();
        return { mode: "ghCli" as const, status };
      }
    },
    onSuccess: (result) => {
      if (result.mode === "ghCli") {
        void queryClient.invalidateQueries({ queryKey: ["github-status"] });
        void queryClient.invalidateQueries({ queryKey: ["github-auth-method"] });
        toast.success(
          result.status.login
            ? `Connected via GitHub CLI as ${result.status.login}`
            : "Connected via GitHub CLI",
        );
        return;
      }

      setDeviceCode(result.device.deviceCode);
      setUserCode(result.device.userCode);
      setVerificationUri(result.device.verificationUri);
      setPollIntervalMs(result.device.interval * 1000);
      toast.message(`Enter code ${result.device.userCode} at github.com/login/device`);
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  useEffect(() => {
    if (!deviceCode) {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const result = await pollGitHubDeviceToken(deviceCode);
          if (result.connected) {
            setDeviceCode(null);
            setUserCode(null);
            await queryClient.invalidateQueries({ queryKey: ["github-status"] });
            await queryClient.invalidateQueries({
              queryKey: ["github-auth-method"],
            });
            toast.success(
              result.login
                ? `Connected via GitHub App as ${result.login}`
                : "Connected via GitHub App",
            );
          }
        } catch (error) {
          toast.error(parseGitHubError(error));
          setDeviceCode(null);
        }
      })();
    }, pollIntervalMs);

    return () => window.clearInterval(timer);
  }, [deviceCode, pollIntervalMs, queryClient]);

  const registrationBusy = registerMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="size-4" />
          GitHub
        </CardTitle>
        <CardDescription>
          Connect via GitHub App device flow (recommended) or paste a Personal
          Access Token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Checking status…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Badge variant={status?.connected ? "default" : "outline"}>
              {status?.connected ? "Connected" : "Not configured"}
            </Badge>
            {status?.login ? (
              <Badge variant="secondary">@{status.login}</Badge>
            ) : null}
            {authMethod?.method && authMethod.method !== "none" ? (
              <Badge variant="outline">{authMethod.method}</Badge>
            ) : null}
            {appConfig?.configured ? (
              <Badge variant={appConfig.deviceFlowReady ? "secondary" : "outline"}>
                {appConfig.deviceFlowReady ? "App ready" : "App needs Device Flow"}
              </Badge>
            ) : null}
            {testLogin ? (
              <Badge variant="secondary">Tested: @{testLogin}</Badge>
            ) : null}
          </div>
        )}

        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">GitHub App (device flow)</p>
          <GitHubAppSetupHint
            emphasized={
              deviceFlowMutation.isError &&
              isGitHubAppMisconfiguredError(deviceFlowMutation.error)
            }
          />
          {userCode ? (
            <p className="text-muted-foreground text-sm">
              Visit{" "}
              <a
                href={verificationUri ?? "https://github.com/login/device"}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                github.com/login/device
              </a>{" "}
              and enter <strong>{userCode}</strong>
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Opens a one-time code — no PAT copy/paste required.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={registrationBusy}
              onClick={() => registerMutation.mutate()}
            >
              {registrationBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              Register GitHub App
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                deviceFlowMutation.isPending || Boolean(deviceCode) || registrationBusy
              }
              onClick={() => deviceFlowMutation.mutate()}
            >
              {deviceFlowMutation.isPending || deviceCode ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Connect with GitHub App
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="github-pat">Or paste PAT</Label>
          <Input
            id="github-pat"
            type="password"
            value={pat}
            onChange={(event) => setPat(event.target.value)}
            placeholder={status?.connected ? "••••••••" : "ghp_…"}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveMutation.isPending || (!pat.trim() && !status?.connected)}
            onClick={() => saveMutation.mutate()}
          >
            Save PAT
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending || !status?.connected}
            onClick={() => testMutation.mutate()}
          >
            <PlugZap className="size-4" />
            Test connection
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={clearMutation.isPending || !status?.connected}
            onClick={() => clearMutation.mutate()}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
