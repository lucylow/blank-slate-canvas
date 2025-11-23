import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Video, 
  BookOpen, 
  MessageSquare, 
  BarChart3,
  Brain,
  Eye
} from 'lucide-react';
import { RealTimeKPIs } from '@/components/coaching/RealTimeKPIs';
import { DriverBehaviorAnalytics } from '@/components/coaching/DriverBehaviorAnalytics';
import { TirePitStrategyAdvisor } from '@/components/coaching/TirePitStrategyAdvisor';
import { StressFatigueMonitoring } from '@/components/coaching/StressFatigueMonitoring';
import { HighlightVideoIntegration } from '@/components/coaching/HighlightVideoIntegration';
import { CoachingTipsPlaybook } from '@/components/coaching/CoachingTipsPlaybook';
import { CommunicationHub } from '@/components/coaching/CommunicationHub';
import { MultiDriverOverview } from '@/components/coaching/MultiDriverOverview';
import { PredictiveAlerts } from '@/components/coaching/PredictiveAlerts';
import { VisualizationControls } from '@/components/coaching/VisualizationControls';

export default function CoachingPage() {
  const [selectedDriver, setSelectedDriver] = useState<string>('driver-1');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Coaching Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance analytics and coaching insights for racing teams
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="kpis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="kpis" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">KPIs</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Behavior</span>
            </TabsTrigger>
            <TabsTrigger value="tire-pit" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Tire & Pit</span>
            </TabsTrigger>
            <TabsTrigger value="stress" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Stress</span>
            </TabsTrigger>
            <TabsTrigger value="highlights" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Highlights</span>
            </TabsTrigger>
            <TabsTrigger value="playbook" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Playbook</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="multi-driver" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Visualize</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kpis" className="space-y-4">
            <RealTimeKPIs selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <DriverBehaviorAnalytics selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="tire-pit" className="space-y-4">
            <TirePitStrategyAdvisor selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="stress" className="space-y-4">
            <StressFatigueMonitoring selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="highlights" className="space-y-4">
            <HighlightVideoIntegration selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="playbook" className="space-y-4">
            <CoachingTipsPlaybook selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <CommunicationHub selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="multi-driver" className="space-y-4">
            <MultiDriverOverview onSelectDriver={setSelectedDriver} />
          </TabsContent>

          <TabsContent value="predictive" className="space-y-4">
            <PredictiveAlerts selectedDriver={selectedDriver} />
          </TabsContent>

          <TabsContent value="visualization" className="space-y-4">
            <VisualizationControls selectedDriver={selectedDriver} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

