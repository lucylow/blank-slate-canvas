import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Mic, Phone, CheckCircle2, Clock, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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

// Expanded demo messages with more variety
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
  {
    id: '5',
    sender: 'coach',
    message: 'Lap time improving! Keep this pace, you\'re gaining on P3',
    timestamp: '0:25:34',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '6',
    sender: 'driver',
    message: 'Copy, maintaining current pace',
    timestamp: '0:25:40',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '7',
    sender: 'coach',
    message: 'Yellow flag in Sector 1, slow down immediately',
    timestamp: '0:28:15',
    acknowledged: true,
    type: 'instruction',
  },
  {
    id: '8',
    sender: 'coach',
    message: 'Brake balance adjustment needed - shift 2% rearward',
    timestamp: '0:32:48',
    acknowledged: false,
    type: 'instruction',
  },
  {
    id: '9',
    sender: 'driver',
    message: 'Tires feeling good, can push harder in final sector',
    timestamp: '0:35:12',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '10',
    sender: 'coach',
    message: 'Fuel saving mode - reduce throttle lift by 10% on straights',
    timestamp: '0:38:56',
    acknowledged: false,
    type: 'instruction',
  },
  {
    id: '11',
    sender: 'coach',
    message: 'Weather update: light rain expected in 5 minutes',
    timestamp: '0:42:30',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '12',
    sender: 'driver',
    message: 'Noted, switching to wet setup',
    timestamp: '0:42:45',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '13',
    sender: 'coach',
    message: 'Overtake opportunity on next lap - car ahead struggling with tires',
    timestamp: '0:45:18',
    acknowledged: false,
    type: 'instruction',
  },
  {
    id: '14',
    sender: 'coach',
    message: 'Pit stop confirmed for lap 28 - tires and fuel',
    timestamp: '0:48:22',
    acknowledged: true,
    type: 'instruction',
  },
  {
    id: '15',
    sender: 'driver',
    message: 'Entering pit lane now',
    timestamp: '0:50:15',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '16',
    sender: 'coach',
    message: 'Excellent pit stop! 2.3 seconds - back on track in P4',
    timestamp: '0:50:45',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '17',
    sender: 'coach',
    message: 'Fastest lap! Keep pushing, gap to leader closing',
    timestamp: '0:55:20',
    acknowledged: true,
    type: 'text',
  },
  {
    id: '18',
    sender: 'coach',
    message: 'Final 5 laps - maximize tire life, avoid aggressive moves',
    timestamp: '0:58:10',
    acknowledged: false,
    type: 'instruction',
  },
];

export function CommunicationHub({ selectedDriver }: CommunicationHubProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'coach',
        message: newMessage,
        timestamp: getCurrentTime(),
        type: 'text',
      };
      setMessages([...messages, message]);
      setNewMessage('');
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered to the driver.',
      });
    }
  };

  const handleAcknowledge = (id: string) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, acknowledged: true } : msg
    ));
    toast({
      title: 'Message acknowledged',
      description: 'The driver has acknowledged your message.',
    });
  };

  const handleVoiceCall = () => {
    if (isVoiceCallActive) {
      setIsVoiceCallActive(false);
      toast({
        title: 'Call ended',
        description: 'Voice call has been terminated.',
      });
    } else {
      setIsVoiceCallActive(true);
      const message: Message = {
        id: Date.now().toString(),
        sender: 'coach',
        message: 'Voice call initiated',
        timestamp: getCurrentTime(),
        acknowledged: true,
        type: 'voice',
      };
      setMessages([...messages, message]);
      toast({
        title: 'Call initiated',
        description: 'Connecting to driver...',
      });
    }
  };

  const handleQuickInstruction = () => {
    const quickInstructions = [
      'Push harder in Sector 1',
      'Conserve fuel on straights',
      'Watch for traffic in T6',
      'Tire temperature rising - reduce pace',
      'Maintain current gap to car ahead',
      'Prepare for pit stop in 2 laps',
      'Yellow flag - slow down',
      'Overtake opportunity next lap',
    ];
    const instruction = quickInstructions[Math.floor(Math.random() * quickInstructions.length)];
    const message: Message = {
      id: Date.now().toString(),
      sender: 'coach',
      message: instruction,
      timestamp: getCurrentTime(),
      acknowledged: false,
      type: 'instruction',
    };
    setMessages([...messages, message]);
    toast({
      title: 'Quick instruction sent',
      description: instruction,
    });
  };

  const handleSendStrategyUpdate = () => {
    const strategies = [
      'Strategy update: Extending stint by 2 laps due to tire condition',
      'New strategy: Pit window moved to lap 30',
      'Strategy change: Fuel saving mode activated',
      'Updated plan: Double stint tires, single pit stop',
      'Strategy: Push for 3 laps then conserve',
    ];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const message: Message = {
      id: Date.now().toString(),
      sender: 'coach',
      message: strategy,
      timestamp: getCurrentTime(),
      acknowledged: false,
      type: 'instruction',
    };
    setMessages([...messages, message]);
    toast({
      title: 'Strategy update sent',
      description: 'Driver has been notified of the strategy change.',
    });
  };

  const handleVoiceInstruction = () => {
    if (isRecording) {
      setIsRecording(false);
      const message: Message = {
        id: Date.now().toString(),
        sender: 'coach',
        message: 'Voice instruction recorded and sent',
        timestamp: getCurrentTime(),
        acknowledged: false,
        type: 'voice',
      };
      setMessages([...messages, message]);
      toast({
        title: 'Voice instruction sent',
        description: 'Your voice message has been delivered.',
      });
    } else {
      setIsRecording(true);
      toast({
        title: 'Recording started',
        description: 'Recording your voice instruction...',
      });
      // Simulate recording duration
      setTimeout(() => {
        setIsRecording(false);
        const message: Message = {
          id: Date.now().toString(),
          sender: 'coach',
          message: 'Voice instruction: "Push hard in final sector, tires are good"',
          timestamp: getCurrentTime(),
          acknowledged: false,
          type: 'voice',
        };
        setMessages([...messages, message]);
        toast({
          title: 'Voice instruction sent',
          description: 'Your voice message has been delivered.',
        });
      }, 2000);
    }
  };

  const handleRequestStatusUpdate = () => {
    const message: Message = {
      id: Date.now().toString(),
      sender: 'coach',
      message: 'Requesting status update: How are tires and fuel levels?',
      timestamp: getCurrentTime(),
      acknowledged: false,
      type: 'text',
    };
    setMessages([...messages, message]);
    
    // Simulate driver response after a delay
    setTimeout(() => {
      const driverResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'driver',
        message: 'Tires at 75%, fuel good for 8 more laps. Car feels balanced.',
        timestamp: getCurrentTime(),
        acknowledged: true,
        type: 'text',
      };
      setMessages(prev => [...prev, driverResponse]);
    }, 3000);
    
    toast({
      title: 'Status update requested',
      description: 'Waiting for driver response...',
    });
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      const message: Message = {
        id: Date.now().toString(),
        sender: 'coach',
        message: 'Voice message recorded and sent',
        timestamp: getCurrentTime(),
        acknowledged: false,
        type: 'voice',
      };
      setMessages([...messages, message]);
      toast({
        title: 'Voice message sent',
        description: 'Your voice message has been delivered.',
      });
    } else {
      setIsRecording(true);
      toast({
        title: 'Recording started',
        description: 'Speak your message...',
      });
      // Simulate recording
      setTimeout(() => {
        setIsRecording(false);
        const message: Message = {
          id: Date.now().toString(),
          sender: 'coach',
          message: 'Voice message: "Good pace, keep it up"',
          timestamp: getCurrentTime(),
          acknowledged: false,
          type: 'voice',
        };
        setMessages([...messages, message]);
        toast({
          title: 'Voice message sent',
          description: 'Your voice message has been delivered.',
        });
      }, 2000);
    }
  };

  const handleViewFullHistory = () => {
    setShowHistoryDialog(true);
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
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleMicClick}
                  className={isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant={isVoiceCallActive ? "destructive" : "outline"} 
                  size="sm" 
                  className="flex-1"
                  onClick={handleVoiceCall}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {isVoiceCallActive ? 'End Call' : 'Voice Call'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleQuickInstruction}
                >
                  Quick Instruction
                </Button>
              </div>
              {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  Recording...
                </div>
              )}
              {isVoiceCallActive && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-500">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Call in progress...
                </div>
              )}
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleSendStrategyUpdate}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Strategy Update
                </Button>
                <Button 
                  variant="outline" 
                  className={`w-full justify-start ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
                  onClick={handleVoiceInstruction}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isRecording ? 'Recording...' : 'Voice Instruction'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleRequestStatusUpdate}
                >
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
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleViewFullHistory}
                >
                  <History className="h-4 w-4 mr-2" />
                  View Full History
                </Button>
                <div className="text-xs text-muted-foreground pt-2">
                  <p>Total messages: {messages.length}</p>
                  <p>Instructions: {messages.filter(m => m.type === 'instruction').length}</p>
                  <p>Voice messages: {messages.filter(m => m.type === 'voice').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Full Communication History</DialogTitle>
            <DialogDescription>
              Complete log of all coach-driver communications for {selectedDriver}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
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
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {msg.sender === 'coach' ? 'Coach' : 'Driver'}
                      </span>
                      {msg.type === 'voice' && (
                        <Badge variant="outline" className="text-xs">
                          <Mic className="h-3 w-3 mr-1" />
                          Voice
                        </Badge>
                      )}
                      {msg.type === 'instruction' && (
                        <Badge variant="outline" className="text-xs">
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
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {messages.length} messages
            </div>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



