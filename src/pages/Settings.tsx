import React, { useState } from "react";
import { PageWithMiniTabs, type MiniTab } from "@/components/PageWithMiniTabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Wifi, Bell, Palette, Database, Key, Server, Globe, User, Mail, Phone, MapPin, Calendar, Edit, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/featureFlags/featureRegistry";
import { useFeatureManager } from "@/featureFlags/FeatureProvider";

const Settings = () => {
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [apiUrl, setApiUrl] = useState("http://localhost:8000");

  const tabs: MiniTab[] = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'features', label: 'Feature Flags', icon: <Flag className="h-4 w-4" /> },
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
      initial="profile"
    >
      {(active) => (
        <div className="space-y-6">
          {active === 'profile' && (
            <>
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <User className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Manage your personal information and account settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 pb-6 border-b border-border/50">
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                      <AvatarImage src="" alt="Profile" />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">John Doe</h3>
                      <p className="text-sm text-muted-foreground mb-4">john.doe@example.com</p>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Personal Information
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="profile-name"
                            type="text"
                            defaultValue="John Doe"
                            className="pl-10 bg-background/50 border-border/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="profile-email"
                            type="email"
                            defaultValue="john.doe@example.com"
                            className="pl-10 bg-background/50 border-border/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-phone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="profile-phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="pl-10 bg-background/50 border-border/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-location">Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="profile-location"
                            type="text"
                            placeholder="City, State"
                            className="pl-10 bg-background/50 border-border/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Account Information
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Member Since</span>
                        </div>
                        <p className="text-sm text-muted-foreground">January 2024</p>
                      </div>
                      <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Account Type</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Premium</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                    <Button variant="outline">Cancel</Button>
                    <Button className="bg-primary hover:bg-primary/90">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {active === 'features' && (
            <>
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Flag className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Impact Feature Flags</CardTitle>
                      <CardDescription>
                        Enable or disable impact features for testing and rollout
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FeatureFlagToggles />
                </CardContent>
              </Card>
            </>
          )}

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

// Feature Flag Toggles Component
function FeatureFlagToggles() {
  const { flags, setFlag } = useFeatureManager();

  return (
    <div className="space-y-4">
      {Object.entries(FEATURE_FLAGS).map(([key, meta]) => {
        const flagKey = key as FeatureFlagKey;
        const isEnabled = flags[flagKey] ?? meta.default;

        return (
          <div
            key={key}
            className="border border-border/50 rounded-lg p-4 bg-background/50"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{meta.name}</h3>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </div>
              <div className="ml-4">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => setFlag(flagKey, checked)}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div className="pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Feature flags control which impact features are active. Changes are saved locally and synced with the backend when available.
        </p>
      </div>
    </div>
  );
}

export default Settings;
