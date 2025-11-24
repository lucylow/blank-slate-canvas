import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle2, Circle, Target, TrendingUp } from 'lucide-react';

interface CoachingTip {
  id: string;
  title: string;
  content: string;
  category: 'tire-management' | 'strategy' | 'driving-technique' | 'safety';
  priority: 'high' | 'medium' | 'low';
  basedOn: string[];
  actionable: boolean;
}

interface PlaybookItem {
  id: string;
  tip: string;
  given: boolean;
  acknowledged: boolean;
  response?: string;
  timestamp?: string;
}

interface CoachingTipsPlaybookProps {
  selectedDriver: string;
}

const mockTips: CoachingTip[] = [
  {
    id: '1',
    title: 'Conserve Tires in Sector 2',
    content: 'Reduce lateral G-forces in Turns 3-5 to preserve tire life. Current wear rate is 3% per lap, target is 2% per lap.',
    category: 'tire-management',
    priority: 'high',
    basedOn: ['Tire wear analysis', 'Lap time trends', 'G-force data'],
    actionable: true,
  },
  {
    id: '2',
    title: 'Avoid Traffic in Pit Window',
    content: 'Monitor competitor positions before pitting. Optimal window is Lap 12-14 when traffic is minimal.',
    category: 'strategy',
    priority: 'high',
    basedOn: ['Monte Carlo simulation', 'Traffic analysis'],
    actionable: true,
  },
  {
    id: '3',
    title: 'Improve Exit Speed on Turn 7',
    content: 'Throttle application is 0.2s late on exit. Focus on earlier throttle to gain 0.3s per lap.',
    category: 'driving-technique',
    priority: 'medium',
    basedOn: ['Telemetry comparison', 'Sector analysis'],
    actionable: true,
  },
  {
    id: '4',
    title: 'Maintain Defensive Line',
    content: 'When defending, maintain inside line and brake later than attacker to maintain position.',
    category: 'driving-technique',
    priority: 'low',
    basedOn: ['Race situation analysis'],
    actionable: true,
  },
];

const mockPlaybook: PlaybookItem[] = [
  {
    id: '1',
    tip: 'Conserve Tires in Sector 2',
    given: true,
    acknowledged: true,
    response: 'Understood, reducing cornering speed in T3-T5',
    timestamp: '0:15:23',
  },
  {
    id: '2',
    tip: 'Avoid Traffic in Pit Window',
    given: true,
    acknowledged: false,
    timestamp: '0:18:45',
  },
  {
    id: '3',
    tip: 'Improve Exit Speed on Turn 7',
    given: false,
    acknowledged: false,
  },
];

export function CoachingTipsPlaybook({ selectedDriver }: CoachingTipsPlaybookProps) {
  const [playbook, setPlaybook] = useState<PlaybookItem[]>(mockPlaybook);
  const [selectedTip, setSelectedTip] = useState<CoachingTip | null>(mockTips[0]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tire-management':
        return '🛞';
      case 'strategy':
        return '📊';
      case 'driving-technique':
        return '🏎️';
      case 'safety':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const handleGiveTip = (tip: CoachingTip) => {
    const existingItem = playbook.find(item => item.tip === tip.title);
    if (!existingItem) {
      setPlaybook([...playbook, {
        id: Date.now().toString(),
        tip: tip.title,
        given: true,
        acknowledged: false,
        timestamp: new Date().toLocaleTimeString(),
      }]);
    }
  };

  const handleToggleAcknowledged = (id: string) => {
    setPlaybook(playbook.map(item => 
      item.id === id ? { ...item, acknowledged: !item.acknowledged } : item
    ));
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="tips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tips">Coaching Tips</TabsTrigger>
          <TabsTrigger value="playbook">Playbook</TabsTrigger>
          <TabsTrigger value="strategy">Strategy Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tips List */}
            <div className="space-y-2">
              <h3 className="font-semibold mb-2">Available Tips</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {mockTips.map((tip) => (
                  <Card
                    key={tip.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedTip?.id === tip.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTip(tip)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCategoryIcon(tip.category)}</span>
                          <Badge className={getPriorityColor(tip.priority)}>
                            {tip.priority}
                          </Badge>
                        </div>
                        {tip.actionable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGiveTip(tip);
                            }}
                          >
                            Give Tip
                          </Button>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{tip.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tip Details */}
            {selectedTip && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedTip.title}</CardTitle>
                    <Badge className={getPriorityColor(selectedTip.priority)}>
                      {selectedTip.priority} Priority
                    </Badge>
                  </div>
                  <CardDescription>
                    <span className="text-xl mr-2">{getCategoryIcon(selectedTip.category)}</span>
                    {selectedTip.category.replace('-', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Advice</h4>
                      <p className="text-sm text-muted-foreground">{selectedTip.content}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Based On
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedTip.basedOn.map((source, idx) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </div>
                    {selectedTip.actionable && (
                      <Button
                        className="w-full"
                        onClick={() => handleGiveTip(selectedTip)}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Give This Tip to Driver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="playbook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Playbook</CardTitle>
              <CardDescription>Track advice given and driver responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playbook.map((item) => (
                  <Card key={item.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                              checked={item.given}
                              disabled
                            />
                            <h4 className="font-semibold">{item.tip}</h4>
                            {item.timestamp && (
                              <Badge variant="outline" className="ml-auto">
                                {item.timestamp}
                              </Badge>
                            )}
                          </div>
                          {item.response && (
                            <p className="text-sm text-muted-foreground ml-6 mb-2">
                              Driver: "{item.response}"
                            </p>
                          )}
                          <div className="flex items-center gap-2 ml-6">
                            <Checkbox
                              checked={item.acknowledged}
                              onCheckedChange={() => handleToggleAcknowledged(item.id)}
                            />
                            <span className="text-sm text-muted-foreground">
                              Driver Acknowledged
                            </span>
                            {item.acknowledged && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customizable Strategy Plans</CardTitle>
              <CardDescription>Integrated strategy plans with telemetry forecasts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Race Strategy Plan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Pit Window:</span>
                      <Badge>Laps 12-14</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tire Management:</span>
                      <Badge variant="outline">Conservative</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fuel Strategy:</span>
                      <Badge variant="outline">One-Stop</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Expected Finish:</span>
                      <Badge className="bg-green-500/20 text-green-500">P3-P5</Badge>
                    </div>
                  </div>
                </div>
                <Button className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Edit Strategy Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



