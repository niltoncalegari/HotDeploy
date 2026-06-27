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
import { RELEASE_NOTES } from "@/lib/changelog";

export function VersionChangelogDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground underline-offset-2 transition-colors hover:underline"
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
          <ul className="space-y-6">
            {RELEASE_NOTES.map((entry) => (
              <li key={entry.version}>
                <p className="text-foreground text-sm font-semibold">
                  v{entry.version}
                  {entry.version === APP_VERSION ? (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      (current)
                    </span>
                  ) : null}
                </p>
                {entry.features.length > 0 ? (
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
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
