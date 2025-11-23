import React, { useState } from 'react';
import { PageWithMiniTabs, type MiniTab } from '@/components/PageWithMiniTabs';
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

  const tabs: MiniTab[] = [
    { id: 'kpis', label: 'KPIs', icon: <Activity className="h-4 w-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'tire-pit', label: 'Tire & Pit', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'stress', label: 'Stress', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'highlights', label: 'Highlights', icon: <Video className="h-4 w-4" /> },
    { id: 'playbook', label: 'Playbook', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'communication', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'multi-driver', label: 'Team', icon: <Users className="h-4 w-4" /> },
    { id: 'predictive', label: 'AI Alerts', icon: <Brain className="h-4 w-4" /> },
    { id: 'visualization', label: 'Visualize', icon: <Eye className="h-4 w-4" /> },
  ];

  return (
    <PageWithMiniTabs
      pageTitle="Coaching Dashboard"
      pageSubtitle="Real-time performance analytics and coaching insights for racing teams"
      tabs={tabs}
      initial="highlights"
    >
      {(active) => (
        <div className="space-y-4">
          {active === 'kpis' && <RealTimeKPIs selectedDriver={selectedDriver} />}
          {active === 'behavior' && <DriverBehaviorAnalytics selectedDriver={selectedDriver} />}
          {active === 'tire-pit' && <TirePitStrategyAdvisor selectedDriver={selectedDriver} />}
          {active === 'stress' && <StressFatigueMonitoring selectedDriver={selectedDriver} />}
          {active === 'highlights' && <HighlightVideoIntegration selectedDriver={selectedDriver} />}
          {active === 'playbook' && <CoachingTipsPlaybook selectedDriver={selectedDriver} />}
          {active === 'communication' && <CommunicationHub selectedDriver={selectedDriver} />}
          {active === 'multi-driver' && <MultiDriverOverview onSelectDriver={setSelectedDriver} />}
          {active === 'predictive' && <PredictiveAlerts selectedDriver={selectedDriver} />}
          {active === 'visualization' && <VisualizationControls selectedDriver={selectedDriver} />}
        </div>
      )}
    </PageWithMiniTabs>
  );
}


