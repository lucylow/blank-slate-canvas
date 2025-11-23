import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Play, Pause, SkipForward, SkipBack, MessageSquare, Bookmark } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HighlightEvent {
  id: string;
  timestamp: string;
  type: 'overtake' | 'defensive' | 'incident' | 'fast-lap' | 'strategy';
  title: string;
  description: string;
  videoUrl?: string;
  telemetryData: {
    lap: number;
    sector: string;
    speed: number;
    gForce: number;
  };
  annotations?: string[];
}

interface HighlightVideoIntegrationProps {
  selectedDriver: string;
}

const mockHighlights: HighlightEvent[] = [
  {
    id: '1',
    timestamp: '0:12:34',
    type: 'overtake',
    title: 'Overtake on Turn 3',
    description: 'Clean overtake on competitor #45 using inside line',
    videoUrl: '/videos/overtake-turn3.mp4',
    telemetryData: {
      lap: 8,
      sector: 'Sector 2',
      speed: 185,
      gForce: 2.4,
    },
    annotations: ['Late braking', 'Optimal line', 'Clean exit'],
  },
  {
    id: '2',
    timestamp: '0:18:45',
    type: 'defensive',
    title: 'Defensive Move on Straight',
    description: 'Successfully defended position against #23',
    videoUrl: '/videos/defensive-straight.mp4',
    telemetryData: {
      lap: 12,
      sector: 'Sector 1',
      speed: 210,
      gForce: 1.2,
    },
    annotations: ['Good positioning', 'Maintained speed'],
  },
  {
    id: '3',
    timestamp: '0:25:12',
    type: 'fast-lap',
    title: 'Personal Best Lap',
    description: 'New personal best lap time: 88.45s',
    videoUrl: '/videos/pb-lap.mp4',
    telemetryData: {
      lap: 15,
      sector: 'Full Lap',
      speed: 195,
      gForce: 2.2,
    },
    annotations: ['Optimal tire usage', 'Smooth cornering', 'Good exit speeds'],
  },
  {
    id: '4',
    timestamp: '0:32:08',
    type: 'incident',
    title: 'Near Miss - Turn 5',
    description: 'Close call with competitor, avoided collision',
    videoUrl: '/videos/near-miss.mp4',
    telemetryData: {
      lap: 19,
      sector: 'Sector 2',
      speed: 165,
      gForce: 2.6,
    },
    annotations: ['Reaction time: 0.3s', 'Emergency braking', 'Recovery successful'],
  },
];

export function HighlightVideoIntegration({ selectedDriver }: HighlightVideoIntegrationProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightEvent | null>(mockHighlights[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [annotations, setAnnotations] = useState<string[]>([]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'overtake':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'defensive':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'incident':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'fast-lap':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'strategy':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const handleAddAnnotation = (text: string) => {
    if (selectedHighlight) {
      setAnnotations([...annotations, text]);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="highlights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="annotations">Annotations</TabsTrigger>
        </TabsList>

        <TabsContent value="highlights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Highlights List */}
            <div className="lg:col-span-1 space-y-2">
              <h3 className="font-semibold mb-2">Key Race Events</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {mockHighlights.map((highlight) => (
                  <Card
                    key={highlight.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedHighlight?.id === highlight.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedHighlight(highlight);
                      setAnnotations(highlight.annotations || []);
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getTypeColor(highlight.type)}>
                          {highlight.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{highlight.timestamp}</span>
                      </div>
                      <h4 className="font-semibold mb-1">{highlight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{highlight.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Lap {highlight.telemetryData.lap}</span>
                        <span>•</span>
                        <span>{highlight.telemetryData.sector}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Video Player & Details */}
            <div className="lg:col-span-2 space-y-4">
              {selectedHighlight && (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedHighlight.title}</CardTitle>
                          <CardDescription>{selectedHighlight.timestamp} • {selectedHighlight.description}</CardDescription>
                        </div>
                        <Badge className={getTypeColor(selectedHighlight.type)}>
                          {selectedHighlight.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Video Player Placeholder */}
                      <div className="relative aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center text-white">
                          <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                          <p className="text-sm opacity-75">Video Player</p>
                          <p className="text-xs opacity-50 mt-1">{selectedHighlight.videoUrl}</p>
                        </div>
                        {/* Video Controls */}
                        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="secondary" size="icon" className="rounded-full">
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="icon" className="rounded-full">
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Telemetry Data */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Lap</p>
                          <p className="text-lg font-semibold">{selectedHighlight.telemetryData.lap}</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Sector</p>
                          <p className="text-lg font-semibold">{selectedHighlight.telemetryData.sector}</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Speed</p>
                          <p className="text-lg font-semibold">{selectedHighlight.telemetryData.speed} km/h</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">G-Force</p>
                          <p className="text-lg font-semibold">{selectedHighlight.telemetryData.gForce}G</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Annotations */}
                  {annotations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Annotations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {annotations.map((annotation, idx) => (
                            <Alert key={idx}>
                              <MessageSquare className="h-4 w-4" />
                              <AlertDescription>{annotation}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Race Timeline with Highlights</CardTitle>
              <CardDescription>Key events mapped to race timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline */}
                <div className="flex items-center gap-4 overflow-x-auto pb-4">
                  {mockHighlights.map((highlight, idx) => (
                    <div key={highlight.id} className="flex-shrink-0 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-2">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs font-semibold">{highlight.timestamp}</p>
                      <p className="text-xs text-muted-foreground mt-1">{highlight.type}</p>
                      {idx < mockHighlights.length - 1 && (
                        <div className="absolute top-8 left-16 w-16 h-0.5 bg-border" style={{ marginLeft: '64px' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annotations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Annotation</CardTitle>
              <CardDescription>Review and annotate key moments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add annotation..."
                    className="flex-1 px-3 py-2 border rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        handleAddAnnotation(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button onClick={() => {
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (input?.value) {
                      handleAddAnnotation(input.value);
                      input.value = '';
                    }
                  }}>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {annotations.map((annotation, idx) => (
                    <Alert key={idx}>
                      <AlertDescription>{annotation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

