// src/pages/AIDataAnalyticsPage.tsx
// AI Data Analytics Page

import { PageWithMiniTabs, type MiniTab } from '@/components/PageWithMiniTabs';
import { AIDataAnalytics } from '@/components/AIDataAnalytics';
import { Brain, BarChart3, Activity, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TrackId } from '@/lib/grCarTypes';

export default function AIDataAnalyticsPage() {
  const [selectedTrack, setSelectedTrack] = useState<TrackId | undefined>(undefined);
  const [selectedRace, setSelectedRace] = useState<number>(1);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  const tabs: MiniTab[] = [
    { id: 'overview', label: 'Overview', icon: <Brain className="h-4 w-4" /> },
    { id: 'ai-features', label: 'AI Features', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'edge', label: 'Edge Functions', icon: <Activity className="h-4 w-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <PageWithMiniTabs
      pageTitle="AI-Powered Data Analytics"
      pageSubtitle="Leverage advanced A.I. for race data analysis, predictive insights, and strategic recommendations"
      tabs={tabs}
      initial="overview"
    >
      {(active) => (
        <div className="space-y-6">
          {active === 'overview' && (
            <>
              {/* Controls */}
              <Card className="border-primary/30">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Track</label>
                      <Select
                        value={selectedTrack || 'all'}
                        onValueChange={(value) => setSelectedTrack(value === 'all' ? undefined : value as TrackId)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select track" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tracks</SelectItem>
                          <SelectItem value="barber">Barber Motorsports Park</SelectItem>
                          <SelectItem value="sebring">Sebring International Raceway</SelectItem>
                          <SelectItem value="sonoma">Sonoma Raceway</SelectItem>
                          <SelectItem value="indianapolis">Indianapolis Motor Speedway</SelectItem>
                          <SelectItem value="road-america">Road America</SelectItem>
                          <SelectItem value="watkins-glen">Watkins Glen International</SelectItem>
                          <SelectItem value="virginia">Virginia International Raceway</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Race</label>
                      <Select
                        value={selectedRace.toString()}
                        onValueChange={(value) => setSelectedRace(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Race 1</SelectItem>
                          <SelectItem value="2">Race 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Auto Refresh</label>
                      <Select
                        value={autoRefresh ? 'true' : 'false'}
                        onValueChange={(value) => setAutoRefresh(value === 'true')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Off</SelectItem>
                          <SelectItem value="true">On</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Data Analytics Component */}
              <Card className="border-primary/30">
                <CardContent className="p-6">
                  <AIDataAnalytics
                    track={selectedTrack}
                    race={selectedRace}
                    autoRefresh={autoRefresh}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {active === 'ai-features' && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">AI Features</h2>
                  <p className="text-muted-foreground">
                    Advanced AI-powered analytics features for race data analysis.
                  </p>
                  <AIDataAnalytics
                    track={selectedTrack}
                    race={selectedRace}
                    autoRefresh={autoRefresh}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {active === 'edge' && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Edge Functions</h2>
                  <p className="text-muted-foreground">
                    Edge computing functions for real-time data processing and analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {active === 'integrations' && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Integrations</h2>
                  <p className="text-muted-foreground">
                    Connect with external services and APIs for enhanced analytics capabilities.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageWithMiniTabs>
  );
}

