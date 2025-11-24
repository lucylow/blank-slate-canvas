import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, MessageSquare, Bookmark } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VideoPreview, { type VideoPreviewHandle } from '@/components/VideoPreview';
import AnnotationPanel from '@/components/AnnotationPanel';
import TimelinePanel from '@/components/TimelinePanel';

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

// Video and poster mappings
const VIDEO_MAP: Record<string, string> = {
  'overtake-turn3': '/videos/overtake-turn3.mp4',
  'defensive-roadamerica': '/videos/defensive-block-roadamerica.mp4',
  'personal-best-sebring': '/videos/personal-best-sebring.mp4',
  'near-miss-barber': '/videos/near-miss-barber.mp4',
};

const POSTER_MAP: Record<string, string> = {
  'overtake-turn3': '/videos/posters/overtake-turn3.jpg',
  'defensive-roadamerica': '/videos/posters/defensive-block-roadamerica.jpg',
  'personal-best-sebring': '/videos/posters/personal-best-sebring.jpg',
  'near-miss-barber': '/videos/posters/near-miss-barber.jpg',
};

const mockHighlights: HighlightEvent[] = [
  {
    id: '1',
    timestamp: '0:12:34',
    type: 'overtake',
    title: 'Overtake on Turn 3',
    description: 'Clean overtake on competitor #45 using inside line',
    videoUrl: VIDEO_MAP['overtake-turn3'],
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
    videoUrl: VIDEO_MAP['defensive-roadamerica'],
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
    videoUrl: VIDEO_MAP['personal-best-sebring'],
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
    videoUrl: VIDEO_MAP['near-miss-barber'],
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
  const [annotations, setAnnotations] = useState<string[]>([]);
  const mainVideoRef = useRef<VideoPreviewHandle>(null);

  const handleJumpTo = (event: { seconds: number; video?: string | null }) => {
    // If the event has a video, try to find the matching highlight and set it
    if (event.video) {
      const matchingHighlight = mockHighlights.find(h => h.videoUrl === event.video);
      if (matchingHighlight) {
        setSelectedHighlight(matchingHighlight);
      }
    }
    // Seek to the timestamp in the main video player
    if (mainVideoRef.current && event.seconds != null) {
      mainVideoRef.current.seekTo(event.seconds);
      mainVideoRef.current.play().catch(() => {});
    }
  };

  // Get video key from highlight id for mapping
  const getVideoKey = (highlightId: string): string => {
    switch (highlightId) {
      case '1': return 'overtake-turn3';
      case '2': return 'defensive-roadamerica';
      case '3': return 'personal-best-sebring';
      case '4': return 'near-miss-barber';
      default: return 'overtake-turn3';
    }
  };

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
                      {/* Video Player */}
                      {selectedHighlight.videoUrl && (
                        <div className="mb-4">
                          <VideoPreview
                            ref={mainVideoRef}
                            src={selectedHighlight.videoUrl}
                            poster={POSTER_MAP[getVideoKey(selectedHighlight.id)] || null}
                            ariaLabel={`Video for ${selectedHighlight.title}`}
                            className="w-full aspect-video"
                          />
                        </div>
                      )}

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
          <TimelinePanel onJumpTo={handleJumpTo} />
        </TabsContent>

        <TabsContent value="annotations" className="space-y-4">
          <AnnotationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}



