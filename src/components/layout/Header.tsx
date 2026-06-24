import type { ReactNode } from "react";

import { Flame } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b bg-background px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="bg-flame-glow flex size-10 items-center justify-center rounded-lg border">
          <Flame className="text-flame-500 size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
