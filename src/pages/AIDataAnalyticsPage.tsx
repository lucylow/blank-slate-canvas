// src/pages/AIDataAnalyticsPage.tsx
// AI Data Analytics Page

import { RouteLayout } from '@/components/layout/RouteLayout';
import { AIDataAnalytics } from '@/components/AIDataAnalytics';
import { Brain, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TrackId } from '@/lib/grCarTypes';

export default function AIDataAnalyticsPage() {
  const [selectedTrack, setSelectedTrack] = useState<TrackId | undefined>(undefined);
  const [selectedRace, setSelectedRace] = useState<number>(1);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-4 shadow-xl shadow-primary/20">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI-Powered Data Analytics
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Leverage advanced A.I. for race data analysis, predictive insights, and strategic recommendations
          </p>
        </div>

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
      </div>
    </RouteLayout>
  );
}

