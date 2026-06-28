import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  dispatchGitHubWorkflow,
  parseGitHubError,
  type GitHubWorkflow,
} from "@/lib/github/client";

interface DispatchWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  repo: string;
  workflow: GitHubWorkflow;
  defaultBranch: string;
  onDispatched?: () => void;
}

export function DispatchWorkflowDialog({
  open,
  onOpenChange,
  owner,
  repo,
  workflow,
  defaultBranch,
  onDispatched,
}: DispatchWorkflowDialogProps) {
  const [branch, setBranch] = useState(defaultBranch);

  const dispatchMutation = useMutation({
    mutationFn: () =>
      dispatchGitHubWorkflow(owner, repo, workflow.id, branch.trim()),
    onSuccess: () => {
      toast.success(`Workflow "${workflow.name}" dispatched on ${branch}.`);
      onOpenChange(false);
      onDispatched?.();
    },
    onError: (error) => toast.error(parseGitHubError(error)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setBranch(defaultBranch);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run workflow</DialogTitle>
          <DialogDescription>
            Trigger <code className="text-xs">{workflow.path}</code> via{" "}
            <code className="text-xs">workflow_dispatch</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="dispatch-branch">Branch or tag</Label>
          <Input
            id="dispatch-branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            placeholder={defaultBranch}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={dispatchMutation.isPending || branch.trim().length === 0}
            onClick={() => dispatchMutation.mutate()}
          >
            {dispatchMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Run workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
