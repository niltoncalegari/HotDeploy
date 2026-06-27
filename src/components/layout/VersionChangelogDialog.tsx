import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { APP_VERSION } from "@/lib/app-version";
import { getReleaseNotesNewestFirst } from "@/lib/changelog";
import { cn } from "@/lib/utils";

export function VersionChangelogDialog() {
  const releaseNotes = getReleaseNotesNewestFirst();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-primary font-medium underline-offset-2 transition-colors hover:underline"
        >
          v{APP_VERSION}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Release notes</DialogTitle>
          <DialogDescription>
            What shipped in each HotDeploy version.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[min(60vh,28rem)] px-6 py-4">
          <ul className="space-y-4">
            {releaseNotes.map((entry) => {
              const isCurrent = entry.version === APP_VERSION;

              return (
                <li
                  key={entry.version}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    isCurrent
                      ? "border-primary/50 bg-primary/10 shadow-sm"
                      : "border-border bg-transparent",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isCurrent ? "text-primary" : "text-foreground",
                      )}
                    >
                      v{entry.version}
                    </p>
                    {isCurrent ? (
                      <Badge variant="default">Current</Badge>
                    ) : null}
                  </div>
                  {entry.features && entry.features.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        Features
                      </p>
                      <ul className="text-muted-foreground mt-1 list-disc space-y-1 pl-4 text-sm">
                        {entry.features.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {entry.fixes && entry.fixes.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        Fixes
                      </p>
                      <ul className="text-muted-foreground mt-1 list-disc space-y-1 pl-4 text-sm">
                        {entry.fixes.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
