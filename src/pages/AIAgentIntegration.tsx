import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RealTimeAgentDashboard } from '@/components/RealTimeAgentDashboard';
import { StrategyCanvas } from '@/components/StrategyCanvas';
import { PitwallCollaboration } from '@/components/PitwallCollaboration';
import { Sparkles, Activity, Workflow, Users } from 'lucide-react';

const AIAgentIntegration = () => {
  const [activeTab, setActiveTab] = useState('realtime');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Agent Integration Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Three powerful patterns for integrating AI agents into your racing analytics
              </p>
            </div>
          </div>
        </div>

        {/* Pattern Overview Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
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

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-Time Dashboard
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Strategy Canvas
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pitwall Collaboration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="mt-6">
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
          </TabsContent>

          <TabsContent value="strategy" className="mt-6">
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
          </TabsContent>

          <TabsContent value="collaboration" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Agent Collaboration Interface</CardTitle>
                <CardDescription>
                  Coordinate specialized agents using Microsoft Agent Framework patterns. Perfect for pitwall
                  teams working with multiple AI specialists.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PitwallCollaboration />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
    </div>
  );
};

export default AIAgentIntegration;


