import { Flame, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/layout/Header";

export function ProjectsPage() {
  return (
    <>
      <Header
        title="Projects"
        description="Docker Compose projects running on your connected VPS."
        actions={
          <Button disabled>
            <Rocket className="size-4" />
            Deploy project
          </Button>
        }
      />
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="items-center text-center">
            <div className="bg-flame-glow mb-2 flex size-14 items-center justify-center rounded-full">
              <Flame className="text-flame-500 size-7" aria-hidden />
            </div>
            <CardTitle>No VPS connected yet</CardTitle>
            <CardDescription>
              Connect your Hostinger API key and select a virtual machine in
              Settings to list and deploy Docker projects from this panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Badge variant="secondary">Phase 1 — Connection</Badge>
            <p className="text-muted-foreground text-center text-sm">
              HotDeploy is Hostinger-first. Additional VPS providers are planned
              for a future release.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
