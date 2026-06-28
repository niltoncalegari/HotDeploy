import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { getCredentialsStatus } from "@/lib/hostinger/client";
import { saveWorkspace } from "@/lib/workspace/client";
import { useWorkspace } from "@/lib/workspace/hooks";
import { ensureConnectionProfileFromCredentials } from "@/lib/workspace/sync-profile";

/**
 * Persists a connection profile when credentials exist but workspace profiles are empty.
 * Projects already worked via resolveActiveProfile fallback; deploy config needs a saved profile.
 */
export function useEnsureConnectionProfileSynced() {
  const queryClient = useQueryClient();
  const syncedVmRef = useRef<number | null>(null);
  const { data: workspace, isFetched: workspaceFetched } = useWorkspace();
  const { data: credentials, isFetched: credentialsFetched } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  useEffect(() => {
    if (
      !workspaceFetched ||
      !credentialsFetched ||
      !workspace ||
      !credentials?.configured ||
      !credentials.virtualMachineId
    ) {
      return;
    }

    if (syncedVmRef.current === credentials.virtualMachineId) {
      return;
    }

    const nextWorkspace = ensureConnectionProfileFromCredentials(
      workspace,
      credentials.virtualMachineId,
    );

    if (!nextWorkspace) {
      syncedVmRef.current = credentials.virtualMachineId;
      return;
    }

    syncedVmRef.current = credentials.virtualMachineId;
    void saveWorkspace(nextWorkspace).then(() => {
      queryClient.setQueryData(["workspace"], nextWorkspace);
    });
  }, [workspace, workspaceFetched, credentials, credentialsFetched, queryClient]);
}
