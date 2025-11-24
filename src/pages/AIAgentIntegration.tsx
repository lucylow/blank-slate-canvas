import React from 'react';
import { PageWithMiniTabs, type MiniTab } from '@/components/PageWithMiniTabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RealTimeAgentDashboard } from '@/components/RealTimeAgentDashboard';
import { StrategyCanvas } from '@/components/StrategyCanvas';
import { PitwallCollaboration } from '@/components/PitwallCollaboration';
import { Activity, Workflow, Users, List, Play, Bot, Layers } from 'lucide-react';
import { CreateAgentPageContent } from './CreateAgentPage';
import { StrategyProvider } from '@/hooks/useStrategy';
import InteractiveAgentCanvas from './InteractiveAgentCanvas';

const AIAgentIntegration = () => {
  const tabs: MiniTab[] = [
    { id: 'all', label: 'All Agents', icon: <List className="h-4 w-4" /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Workflow className="h-4 w-4" /> },
    { id: 'create-agent', label: 'Create Agent', icon: <Bot className="h-4 w-4" /> },
    { id: 'create-canvas', label: 'Create Canvas', icon: <Layers className="h-4 w-4" /> },
    { id: 'logs', label: 'Logs', icon: <Activity className="h-4 w-4" /> },
    { id: 'run-demo', label: 'Run Demo', icon: <Play className="h-4 w-4" /> },
  ];

  return (
    <PageWithMiniTabs
      pageTitle="AI Agent Integration Dashboard"
      pageSubtitle="Three powerful patterns for integrating AI agents into your racing analytics"
      tabs={tabs}
      initial="all"
    >
      {(active) => (
        <div className="space-y-6">
          {active === 'all' && (
            <>
              {/* Pattern Overview Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Real-Time Dashboard</CardTitle>
                    </div>
                    <CardDescription>
                      Live agent status & insights with Mastra-style streaming
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Workflow className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Strategy Canvas</CardTitle>
                    </div>
                    <CardDescription>
                      Visual workflow designer with drag-and-drop interface
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Pitwall Collaboration</CardTitle>
                    </div>
                    <CardDescription>
                      Multi-agent collaboration for pit crew teams
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Real-Time Agent Dashboard</CardTitle>
                  <CardDescription>
                    Monitor AI agents in real-time with streaming insights. This pattern uses a Mastra-style
                    approach for TypeScript-first agent integration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RealTimeAgentDashboard 
                    agentId="tire-wear-predictor"
                    track="cota"
                    vehicle="gr86-002"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pitwall Collaboration</CardTitle>
                  <CardDescription>
                    Multi-agent collaboration for pit crew teams. Multiple agents work together to provide
                    comprehensive race strategy recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PitwallCollaboration />
                </CardContent>
              </Card>
            </>
          )}

          {active === 'pipeline' && (
            <Card>
              <CardHeader>
                <CardTitle>Interactive Strategy Canvas</CardTitle>
                <CardDescription>
                  Build race strategies visually by dragging and dropping agent nodes. Execute workflows
                  through OpenAI AgentKit-style integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StrategyCanvas />
              </CardContent>
            </Card>
          )}

          {active === 'create-agent' && (
            <StrategyProvider
              defaultTrack="cota"
              defaultChassis="GR86-016-7"
              defaultLap={12}
            >
              <CreateAgentPageContent />
            </StrategyProvider>
          )}

          {active === 'create-canvas' && (
            <div className="h-[calc(100vh-200px)] -mx-6 -my-6">
              <InteractiveAgentCanvas />
            </div>
          )}

          {active === 'logs' && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Logs & Activity</CardTitle>
                <CardDescription>
                  View detailed logs and activity from all AI agents in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">
                  Agent logs and activity monitoring will be displayed here.
                </div>
              </CardContent>
            </Card>
          )}

          {active === 'run-demo' && (
            <Card>
              <CardHeader>
                <CardTitle>Run Demo & Test Endpoints</CardTitle>
                <CardDescription>
                  Test agent endpoints and run demo scenarios to verify agent functionality.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Demo server controls and test endpoints will be available here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Implementation Notes */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Implementation Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Getting Started</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>All three patterns are ready to use with your existing backend API</li>
                  <li>Components use polling by default but can be upgraded to WebSocket streaming</li>
                  <li>Agent frameworks (Mastra, OpenAI AgentKit, Microsoft Agent Framework) can be integrated when available</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Next Steps</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Add Redis caching for improved real-time performance</li>
                  <li>Implement WebSocket connections for true streaming</li>
                  <li>Connect to your actual agent backend services</li>
                  <li>Add authentication and authorization for production use</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageWithMiniTabs>
  );
};

export default AIAgentIntegration;
