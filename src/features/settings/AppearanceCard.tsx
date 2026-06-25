import { Moon } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AppearanceCard() {
  const { theme, setTheme, isLoading } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Moon className="size-4" />
          Appearance
        </CardTitle>
        <CardDescription>
          Theme preference is saved in your local workspace file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="dark-mode">Dark mode</Label>
            <p className="text-muted-foreground text-sm">
              Switch between light and dark interface tokens.
            </p>
          </div>
          <Switch
            id="dark-mode"
            checked={theme === "dark"}
            disabled={isLoading}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Toggle dark mode"
          />
        </div>
      </CardContent>
    </Card>
  );
}
