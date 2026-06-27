import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  commitWorkflowFile,
  generateWorkflowYaml,
  parseGitHubError,
} from "@/lib/github/client";
import type { GitHubLink } from "@/lib/workspace/schemas";

interface WorkflowGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  githubLink: GitHubLink;
  dockerProjectName: string;
  vmId: number;
}

export function WorkflowGeneratorDialog({
  open,
  onOpenChange,
  githubLink,
  dockerProjectName,
  vmId,
}: WorkflowGeneratorDialogProps) {
  const [trigger, setTrigger] = useState("push");
  const [runnerType, setRunnerType] = useState("self-hosted");
  const [includeTestStep, setIncludeTestStep] = useState(true);

  const previewQuery = useQuery({
    queryKey: [
      "workflow-preview",
      dockerProjectName,
      vmId,
      trigger,
      runnerType,
      includeTestStep,
    ],
    queryFn: () =>
      generateWorkflowYaml({
        dockerProjectName,
        vmId,
        trigger,
        runnerType,
        includeTestStep,
      }),
    enabled: open,
  });

  const yaml = previewQuery.data ?? "";

  const commitMutation = useMutation({
    mutationFn: () =>
      commitWorkflowFile(
        githubLink.owner,
        githubLink.repo,
        yaml,
        "chore(ci): add HotDeploy workflow",
      ),
    onSuccess: () => {
      toast.success("Workflow committed to GitHub.");
      onOpenChange(false);
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  const downloadYaml = () => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hotdeploy.yml";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow downloaded.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate CI/CD workflow</DialogTitle>
          <DialogDescription>
            Creates <code className="text-xs">.github/workflows/hotdeploy.yml</code>{" "}
            for {githubLink.owner}/{githubLink.repo}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wf-trigger">Trigger</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger id="wf-trigger" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push to main</SelectItem>
                <SelectItem value="pull_request">Pull request</SelectItem>
                <SelectItem value="manual">Manual (workflow_dispatch)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wf-runner">Runner</Label>
            <Select value={runnerType} onValueChange={setRunnerType}>
              <SelectTrigger id="wf-runner" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self-hosted">Self-hosted (VPS)</SelectItem>
                <SelectItem value="github-hosted">
                  GitHub-hosted + deploy-on-vps
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="wf-test"
            checked={includeTestStep}
            onCheckedChange={setIncludeTestStep}
          />
          <Label htmlFor="wf-test">Include test step</Label>
        </div>

        <ScrollArea className="bg-muted h-48 rounded-md p-3">
          <pre className="text-xs">
            {previewQuery.isLoading ? "Generating preview…" : yaml}
          </pre>
        </ScrollArea>

        <p className="text-muted-foreground text-xs">
          Suggested secrets: HOSTINGER_API_KEY, HOSTINGER_VM_ID (manage in GitHub
          tab).
        </p>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={downloadYaml}>
            Download YAML
          </Button>
          <Button
            type="button"
            disabled={commitMutation.isPending || !yaml}
            onClick={() => commitMutation.mutate()}
          >
            {commitMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            Commit to GitHub
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
