// src/pages/SlackIntegrationPage.tsx
// Slack Integration Page

import { RouteLayout } from '@/components/layout/RouteLayout';
import { Bot, Flag, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sendRaceAlert, getMockMessages, isSlackMockMode } from '@/api/slack';
import { useState } from 'react';

export default function SlackIntegrationPage() {
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestRaceAlert = async () => {
    try {
      const result = await sendRaceAlert('GR Cup Race', 'Lap 10 Completed', {
        'Leader': 'Car #7',
        'Gap': '+2.5s'
      });
      setTestResult(`Slack message ${result.success ? 'sent' : 'failed'}: ${result.message || result.error}`);
    } catch (error) {
      setTestResult(`Failed to send Slack message: ${error}`);
    }
  };

  const handleViewMockMessages = () => {
    const messages = getMockMessages(10);
    console.log('Mock messages:', messages);
    setTestResult(`${messages.length} mock messages stored`);
  };

  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-xl shadow-green-500/20">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Slack Notifications
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real-time race alerts and notifications via Slack webhooks with rich formatting and mock mode support
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 hover:border-green-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Flag className="w-6 h-6 text-green-500" />
                <CardTitle>Race Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Send formatted race alerts with event details, vehicle information, and custom fields.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Rich block formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Custom attachments</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-green-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-green-500" />
                <CardTitle>Telemetry Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Real-time telemetry alerts with severity levels (info, warning, critical) and metric values.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Severity-based colors</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Lap time notifications</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-green-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-green-500" />
                <CardTitle>Pit & Tire Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Pit stop and tire wear alerts with detailed information and recommended actions.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Pit stop notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Tire wear alerts</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Test Section */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle>Test Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isSlackMockMode() ? 'Mock Mode: Messages stored in localStorage' : 'Production Mode: Messages sent to Slack'}
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={handleTestRaceAlert}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                Test Race Alert
              </Button>
              <Button 
                onClick={handleViewMockMessages}
                variant="outline"
              >
                View Mock Messages
              </Button>
            </div>
            {testResult && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                {testResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteLayout>
  );
}

