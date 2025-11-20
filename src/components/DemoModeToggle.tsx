// src/components/DemoModeToggle.tsx
// Toggle component for enabling/disabling demo mode

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Play, Wifi } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch
                id="demo-mode"
                checked={isDemoMode}
                onCheckedChange={toggleDemoMode}
                aria-label="Toggle demo mode"
              />
              <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
                Demo Mode
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isDemoMode 
                ? "Using mock API responses. Disable to connect to real backend."
                : "Enable to use mock API responses (works offline)"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Badge 
        variant={isDemoMode ? "default" : "outline"}
        className="text-xs"
      >
        {isDemoMode ? (
          <>
            <Play className="w-3 h-3 mr-1" />
            Mock API
          </>
        ) : (
          <>
            <Wifi className="w-3 h-3 mr-1" />
            Live API
          </>
        )}
      </Badge>
    </div>
  );
}

