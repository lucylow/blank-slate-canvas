// src/pages/SlackIntegrationPage.tsx
// Slack Integration Page

import { RouteLayout } from '@/components/layout/RouteLayout';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { 
  sendSlackMessage, 
  sendRaceAlert,
  sendTelemetryAlert,
  sendLapTimeNotification,
  sendPitStopNotification,
  sendTireWearAlert,
  getMockMessages,
  clearMockMessages,
  isSlackMockMode,
  type MockSlackMessage
} from '@/api/slack';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SlackIntegrationPage() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [mockMessages, setMockMessages] = useState<MockSlackMessage[]>(getMockMessages());

  const isMock = isSlackMockMode();

  const refreshMockMessages = () => {
    setMockMessages(getMockMessages());
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    setLastResponse(null);
    
    try {
      const response = await sendSlackMessage(message);
      setLastResponse(response.success ? 'Message sent successfully!' : `Error: ${response.error}`);
      setMessage('');
      refreshMockMessages();
    } catch (error) {
      setLastResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendTestAlert = async (type: string) => {
    setSending(true);
    setLastResponse(null);
    
    try {
      let response;
      switch (type) {
        case 'race':
          response = await sendRaceAlert(
            'Barber Motorsports Park',
            'Race Start',
            { 'Track': 'Barber Motorsports Park', 'Laps': '28', 'Weather': 'Clear' }
          );
          break;
        case 'telemetry':
          response = await sendTelemetryAlert('GR86-002-000', 'Speed', 145.3, 'warning');
          break;
        case 'lap':
          response = await sendLapTimeNotification('GR86-002-000', 5, '1:23.456', 1, '+0.234');
          break;
        case 'pit':
          response = await sendPitStopNotification('GR86-002-000', 12, 'Tire Change', '25s');
          break;
        case 'tire':
          response = await sendTireWearAlert('GR86-002-000', 65, 68, 72, 70, 15);
          break;
        default:
          return;
      }
      setLastResponse(response.success ? `${type} alert sent successfully!` : `Error: ${response.error}`);
      refreshMockMessages();
    } catch (error) {
      setLastResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 shadow-xl shadow-purple-500/20">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Slack Integration
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real-time race alerts and notifications via Slack webhooks. Send race updates, telemetry alerts, 
            lap times, pit stop notifications, and more to your Slack channels.
          </p>
          <div className="flex items-center justify-center gap-2">
            {isMock ? (
              <>
                <WifiOff className="w-5 h-5 text-yellow-500" />
                <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                  Mock Mode Active
                </Badge>
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-green-600 border-green-500">
                  Connected to Slack
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-6 h-6 text-purple-500" />
                <CardTitle>Race Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Send formatted race event notifications with custom fields and rich formatting.
              </p>
              <Button 
                onClick={() => handleSendTestAlert('race')}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                Send Test Race Alert
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-purple-500" />
                <CardTitle>Telemetry Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Real-time telemetry alerts for critical sensor readings and anomalies.
              </p>
              <Button 
                onClick={() => handleSendTestAlert('telemetry')}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                Send Test Telemetry Alert
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-6 h-6 text-purple-500" />
                <CardTitle>Lap Time Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Automatic lap time notifications with position and gap information.
              </p>
              <Button 
                onClick={() => handleSendTestAlert('lap')}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                Send Test Lap Notification
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-purple-500" />
                <CardTitle>Pit Stop Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Notify your team when vehicles enter the pit lane with reason and timing.
              </p>
              <Button 
                onClick={() => handleSendTestAlert('pit')}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                Send Test Pit Stop Alert
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-purple-500" />
                <CardTitle>Tire Wear Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Monitor tire wear levels and get alerts when pit stops are recommended.
              </p>
              <Button 
                onClick={() => handleSendTestAlert('tire')}
                disabled={sending}
                className="w-full"
                variant="outline"
              >
                Send Test Tire Alert
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Send className="w-6 h-6 text-purple-500" />
                <CardTitle>Custom Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Send custom messages with full formatting support and attachments.
              </p>
              <Button 
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="w-full"
                variant="outline"
              >
                Send Custom Message
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Custom Message Sender */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Send Custom Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your Slack message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button 
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
              {lastResponse && (
                <div className={`flex items-center gap-2 ${lastResponse.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                  {lastResponse.includes('Error') ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span className="text-sm">{lastResponse}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mock Messages (only shown in mock mode) */}
        {isMock && mockMessages.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mock Messages ({mockMessages.length})</CardTitle>
                <Button 
                  onClick={() => {
                    clearMockMessages();
                    refreshMockMessages();
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {mockMessages.map((msg) => (
                    <Card key={msg.id} className="border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {new Date(msg.timestamp).toLocaleString()}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-yellow-600">
                            Mock
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            {msg.payload.text || 
                             msg.payload.blocks?.[0]?.text?.text || 
                             msg.payload.attachments?.[0]?.title || 
                             'No message content'}
                          </p>
                          {msg.payload.attachments?.[0]?.text && (
                            <p className="text-sm text-muted-foreground">
                              {msg.payload.attachments[0].text}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </RouteLayout>
  );
}

