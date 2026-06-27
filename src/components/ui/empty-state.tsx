import type { ReactNode } from "react";
import { Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="items-center text-center">
        <div className="bg-flame-glow mb-2 flex size-12 items-center justify-center rounded-full">
          <Flame className="text-flame-500 size-6" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? (
        <CardContent className="flex justify-center pb-6">{action}</CardContent>
      ) : null}
    </Card>
  );
}

export function EmptyStateButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" {...props}>
      {children}
    </Button>
  );
}
