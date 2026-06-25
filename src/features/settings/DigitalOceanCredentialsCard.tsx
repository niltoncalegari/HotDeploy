import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cloud } from "lucide-react";
import { useState } from "react";
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
  clearProviderCredentials,
  getProviderCredentialsStatus,
  parseHostingerError,
  saveProviderCredentials,
} from "@/lib/hostinger/client";

export function DigitalOceanCredentialsCard() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");

  const { data: credentials, isLoading } = useQuery({
    queryKey: ["provider-credentials", "digitalocean"],
    queryFn: () => getProviderCredentialsStatus("digitalocean"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey.trim()) {
        throw new Error("API token is required.");
      }
      await saveProviderCredentials("digitalocean", apiKey.trim());
    },
    onSuccess: async () => {
      setApiKey("");
      await queryClient.invalidateQueries({
        queryKey: ["provider-credentials", "digitalocean"],
      });
      toast.success("DigitalOcean token saved.");
    },
    onError: (error) => {
      toast.error(parseHostingerError(error));
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearProviderCredentials("digitalocean"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["provider-credentials", "digitalocean"],
      });
      toast.success("DigitalOcean token cleared.");
    },
    onError: (error) => {
      toast.error(parseHostingerError(error));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="size-4" />
          DigitalOcean API token
        </CardTitle>
        <CardDescription>
          Required to list droplets as VPS targets. Docker Compose operations
          remain Hostinger-only in this release.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Checking status…</p>
        ) : (
          <Badge variant={credentials?.configured ? "default" : "outline"}>
            {credentials?.configured ? "Configured" : "Not configured"}
          </Badge>
        )}
        <div className="space-y-2">
          <Label htmlFor="do-api-key">Personal access token</Label>
          <Input
            id="do-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={credentials?.configured ? "••••••••" : "Paste token"}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            Save token
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || !credentials?.configured}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
