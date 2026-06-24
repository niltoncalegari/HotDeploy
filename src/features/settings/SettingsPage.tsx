import { useQuery } from "@tanstack/react-query";
import { KeyRound, Server } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCredentialsStatus } from "@/lib/hostinger/client";

export function SettingsPage() {
  const { data: credentials, isLoading } = useQuery({
    queryKey: ["credentials-status"],
    queryFn: getCredentialsStatus,
  });

  return (
    <>
      <Header
        title="Settings"
        description="Manage Hostinger credentials and default VPS selection."
      />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" />
              API credentials
            </CardTitle>
            <CardDescription>
              Stored securely in your operating system keychain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Checking status…</p>
            ) : (
              <Badge variant={credentials?.configured ? "default" : "outline"}>
                {credentials?.configured ? "Configured" : "Not configured"}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="size-4" />
              Default VPS
            </CardTitle>
            <CardDescription>
              Virtual machine used for deploy and lifecycle actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              VM picker ships in Phase 1. Provider expansion is planned after
              Hostinger support is stable.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
