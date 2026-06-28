import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldLabelProps {
  htmlFor: string;
  required?: boolean;
  help?: string;
  children: ReactNode;
  className?: string;
}

export function FieldLabel({
  htmlFor,
  required = false,
  help,
  children,
  className,
}: FieldLabelProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {children}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only">(required)</span> : null}
      </Label>
      {help ? (
        <span
          className="text-muted-foreground inline-flex cursor-help"
          title={help}
          aria-label={help}
          role="img"
        >
          <HelpCircle className="size-3.5 shrink-0" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );
}

interface FieldErrorProps {
  id?: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}
