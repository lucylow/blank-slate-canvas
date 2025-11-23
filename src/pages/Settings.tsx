import React, { useState } from "react";
import { PageWithMiniTabs, type MiniTab } from "@/components/PageWithMiniTabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Wifi, Bell, Palette, Database, Key, Server, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [apiUrl, setApiUrl] = useState("http://localhost:8000");

  const tabs: MiniTab[] = [
    { id: 'external', label: 'External APIs', icon: <Globe className="h-4 w-4" /> },
    { id: 'keys', label: 'Keys & Secrets', icon: <Key className="h-4 w-4" /> },
    { id: 'demo', label: 'Demo Server', icon: <Server className="h-4 w-4" /> },
    { id: 'prefs', label: 'Preferences', icon: <Palette className="h-4 w-4" /> },
  ];

  return (
    <PageWithMiniTabs
      pageTitle="Settings"
      pageSubtitle="Configure your PitWall AI experience"
      tabs={tabs}
      initial="external"
    >
      {(active) => (
        <div className="space-y-6">
          {active === 'external' && (
            <>
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Globe className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>External APIs</CardTitle>
                      <CardDescription>
                        Configure external API integrations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg border border-border/30">
                    <p className="text-sm text-muted-foreground mb-2">
                      External APIs require configuration in Keys & Secrets tab.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Configure API keys for Gemini AI, Google Maps, and other external services.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {active === 'keys' && (
            <>
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Key className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Keys & Secrets</CardTitle>
                      <CardDescription>
                        Manage API keys and authentication credentials
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                    <Input
                      id="gemini-key"
                      type="password"
                      placeholder="AIza..."
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maps-key">Google Maps API Key</Label>
                    <Input
                      id="maps-key"
                      type="password"
                      placeholder="AIza..."
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full">
                      Test API Keys
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {active === 'demo' && (
            <>
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Server className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Demo Server</CardTitle>
                      <CardDescription>
                        Configure demo server connection
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-url">API Base URL</Label>
                    <Input
                      id="api-url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="http://localhost:8000"
                      className="bg-background/50 border-border/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      The base URL for the PitWall AI backend API
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="live-updates">Live Data Updates</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable real-time data streaming
                      </p>
                    </div>
                    <Switch
                      id="live-updates"
                      checked={liveUpdates}
                      onCheckedChange={setLiveUpdates}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {active === 'prefs' && (
            <>
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Bell className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>
                        Manage notification preferences
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Enable Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive alerts for critical race events
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Palette className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>
                        Customize the look and feel
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Use dark theme (always enabled)
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Database className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Data Management</CardTitle>
                      <CardDescription>
                        Manage cached data and storage
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div>
                      <Label>Cached Telemetry Data</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        ~245 MB cached locally
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Clear Cache
                    </Button>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <Button variant="outline" className="w-full">
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline">
                  Reset to Defaults
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Save Settings
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </PageWithMiniTabs>
  );
};

export default Settings;
