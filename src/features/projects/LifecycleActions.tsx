import { useMutation } from "@tanstack/react-query";
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
import {
  parseHostingerError,
  restartProject,
  startProject,
  stopProject,
  updateProject,
} from "@/lib/hostinger/client";
import type { ProviderId } from "@/lib/workspace/schemas";

interface LifecycleActionsProps {
  virtualMachineId: number;
  projectName: string;
  provider: ProviderId;
  onComplete: () => Promise<void>;
}

type PendingAction = "stop" | "update" | null;

export function LifecycleActions({
  virtualMachineId,
  projectName,
  provider,
  onComplete,
}: LifecycleActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const runMutation = useMutation({
    mutationFn: async (action: "start" | "stop" | "restart" | "update") => {
      switch (action) {
        case "start":
          return startProject(virtualMachineId, projectName, provider);
        case "stop":
          return stopProject(virtualMachineId, projectName, provider);
        case "restart":
          return restartProject(virtualMachineId, projectName, provider);
        case "update":
          return updateProject(virtualMachineId, projectName, provider);
      }
    },
    onSuccess: async (_result, action) => {
      toast.success(`${action} completed.`);
      setPendingAction(null);
      await onComplete();
    },
    onError: (error) => {
      toast.error(parseHostingerError(error));
    },
  });

  const confirmAction = () => {
    if (pendingAction) {
      runMutation.mutate(pendingAction);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={runMutation.isPending}
          onClick={() => runMutation.mutate("start")}
        >
          Start
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={runMutation.isPending}
          onClick={() => setPendingAction("stop")}
        >
          Stop
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={runMutation.isPending}
          onClick={() => runMutation.mutate("restart")}
        >
          Restart
        </Button>
        <Button
          size="sm"
          disabled={runMutation.isPending}
          onClick={() => setPendingAction("update")}
        >
          Update
        </Button>
      </div>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "stop" ? "Stop project" : "Update project"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "stop"
                ? `Stop all containers in ${projectName}?`
                : `Pull latest images and recreate containers for ${projectName}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              variant={pendingAction === "stop" ? "destructive" : "default"}
              disabled={runMutation.isPending}
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
