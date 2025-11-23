import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, ArrowLeft, Wifi, Bell, Palette, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [apiUrl, setApiUrl] = useState("http://localhost:8000");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-all duration-300">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <SettingsIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>
          <Link to="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
              View Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <SettingsIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Configuration</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Settings
            </h2>
            <p className="text-lg text-muted-foreground">
              Configure your PitWall AI experience
            </p>
          </motion.div>

          {/* Connection Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.01]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Wifi className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Connection Settings
                    </CardTitle>
                    <CardDescription>
                      Configure backend API connection
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
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL for the PitWall AI backend API
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 p-4 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 transition-colors">
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
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
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
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
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
          </motion.div>

          {/* Data Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Manage cached data and storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
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
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end gap-4"
          >
            <Button variant="outline">Reset to Defaults</Button>
            <Button className="bg-primary hover:bg-primary/90">
              Save Settings
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Settings;


