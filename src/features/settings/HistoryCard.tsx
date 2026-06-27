import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearDeploymentHistory,
  getDeploymentHistory,
  parseHostingerError,
} from "@/lib/hostinger/client";

function formatTimestamp(timestamp: string): string {
  const asNumber = Number(timestamp);
  if (!Number.isNaN(asNumber)) {
    return new Date(asNumber).toLocaleString();
  }
  return timestamp;
}

export function HistoryCard() {
  const queryClient = useQueryClient();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["deployment-history"],
    queryFn: getDeploymentHistory,
  });

  const clearMutation = useMutation({
    mutationFn: clearDeploymentHistory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deployment-history"] });
      toast.success("Deployment history cleared.");
    },
    onError: (error) => {
      toast.error(parseHostingerError(error));
    },
  });

  return (
    <Card className="md:col-span-2" id="history">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Deployment history
          </CardTitle>
          <CardDescription>
            Local record of deploy and lifecycle actions (no secrets).
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={history.length === 0 || clearMutation.isPending}
          onClick={() => setConfirmClearOpen(true)}
        >
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No actions recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{entry.dockerProjectName}</p>
                  <p className="text-muted-foreground">
                    {entry.action} · VM {entry.virtualMachineId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="capitalize">{entry.outcome}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear deployment history?</DialogTitle>
            <DialogDescription>
              This removes all local history entries. Remote Docker Projects are
              not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClearOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearMutation.mutate();
                setConfirmClearOpen(false);
              }}
            >
              Clear history
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
