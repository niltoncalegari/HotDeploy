import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground inline-flex shrink-0 cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={help}
            >
              <HelpCircle className="size-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">{help}</TooltipContent>
        </Tooltip>
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
