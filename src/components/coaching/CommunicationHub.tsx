import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Mic, Phone, CheckCircle2, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  sender: 'coach' | 'driver';
  message: string;
  timestamp: string;
  acknowledged?: boolean;
  type: 'text' | 'voice' | 'instruction';
}

interface CommunicationHubProps {
  selectedDriver: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'coach',
    message: 'Conserve tires in Sector 2, reduce cornering speed by 5%',
    timestamp: '0:15:23',
    acknowledged: true,
    type: 'instruction',
  },
  {
    id: '2',
    sender: 'driver',
    message: 'Understood, reducing speed in T3-T5',
    timestamp: '0:15:28',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '3',
    sender: 'coach',
    message: 'Pit window opening in 3 laps, prepare for pit stop',
    timestamp: '0:18:45',
    acknowledged: false,
    type: 'instruction',
  },
  {
    id: '4',
    sender: 'coach',
    message: 'Traffic ahead, consider alternative line',
    timestamp: '0:22:12',
    acknowledged: false,
    type: 'text',
  },
];

export function CommunicationHub({ selectedDriver }: CommunicationHubProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'coach',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString(),
        type: 'text',
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleAcknowledge = (id: string) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, acknowledged: true } : msg
    ));
  };

  const unacknowledgedCount = messages.filter(m => m.sender === 'coach' && !m.acknowledged).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Communication Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Coach-Driver Communication</CardTitle>
                  <CardDescription>Real-time messaging and instructions</CardDescription>
                </div>
                {unacknowledgedCount > 0 && (
                  <Badge variant="destructive">{unacknowledgedCount} Unread</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'coach' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender === 'coach'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {msg.type === 'voice' && <Mic className="h-4 w-4 mt-0.5" />}
                          {msg.type === 'instruction' && (
                            <Badge variant="outline" className="mb-1">
                              Instruction
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">{msg.timestamp}</span>
                          {msg.sender === 'coach' && (
                            <div className="flex items-center gap-1">
                              {msg.acknowledged ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="text-xs">Acknowledged</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs">Pending</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {msg.sender === 'coach' && !msg.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={() => handleAcknowledge(msg.id)}
                          >
                            Mark as Acknowledged
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Input */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message or instruction..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button variant="outline" size="icon">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Voice Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Quick Instruction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communication History & Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Strategy Update
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Instruction
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Request Status Update
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {messages
                    .filter(m => m.type === 'instruction')
                    .map((msg) => (
                      <div key={msg.id} className="p-2 border rounded-lg text-sm">
                        <p className="font-semibold mb-1">{msg.message}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{msg.timestamp}</span>
                          {msg.acknowledged ? (
                            <Badge variant="outline" className="bg-green-500/20">
                              Acknowledged
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/20">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debrief Log</CardTitle>
              <CardDescription>Historical communication for post-race review</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Full History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

