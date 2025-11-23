import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Share2,
  Play,
  Pause,
  RefreshCw,
  Zap,
  Target,
  Activity,
  Clock,
  Gauge,
  AlertCircle,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Video,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteLayout } from "@/components/layout/RouteLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { RaceStoryGenerator as RaceStoryGen, type Highlight } from "@/lib/raceStoryGenerator";
import { mockRaceTelemetry } from "@/mocks/raceTelemetryMock";
import { RaceStoryHighlights } from "@/components/RaceStoryHighlights";

interface RaceMoment {
  id: string;
  type: "overtake" | "defensive" | "tire_cliff" | "pit_shift" | "pace_change" | "stress_peak";
  lap: number;
  timestamp: string;
  title: string;
  description: string;
  evidence: {
    sectorDeltas: {
      sector1: number;
      sector2: number;
      sector3: number;
    };
    tireCondition: {
      frontLeft: number;
      frontRight: number;
      rearLeft: number;
      rearRight: number;
    };
    paceChange: number;
    timeDelta: number;
    stressLevel: number;
  };
  drivers: {
    primary: number;
    secondary?: number;
  };
  impact: "high" | "medium" | "low";
}

interface RaceStory {
  raceId: string;
  track: string;
  date: string;
  highlights: RaceMoment[];
  summary: string;
}

// Mock data generator - in production, this would come from telemetry analysis
const generateMockHighlights = (): RaceMoment[] => {
  return [
    {
      id: "1",
      type: "overtake",
      lap: 22,
      timestamp: "00:15:32",
      title: "Lap 22 Overtake Set Up by 0.15s Gain in Sector 2",
      description: "Car #42 executed a decisive overtake on Car #18 after gaining 0.15s in Sector 2, capitalizing on superior tire condition and optimal racing line through the technical section.",
      evidence: {
        sectorDeltas: { sector1: 0.02, sector2: 0.15, sector3: 0.03 },
        tireCondition: { frontLeft: 85, frontRight: 82, rearLeft: 78, rearRight: 80 },
        paceChange: 0.18,
        timeDelta: -0.15,
        stressLevel: 0.72,
      },
      drivers: { primary: 42, secondary: 18 },
      impact: "high",
    },
    {
      id: "2",
      type: "defensive",
      lap: 34,
      timestamp: "00:23:15",
      title: "Defensive Battle at Turn 8 - Car #7 Holds Position",
      description: "Intense defensive battle where Car #7 successfully defended against Car #12's multiple overtake attempts, maintaining position despite 0.08s pace disadvantage.",
      evidence: {
        sectorDeltas: { sector1: -0.05, sector2: 0.08, sector3: -0.03 },
        tireCondition: { frontLeft: 72, frontRight: 75, rearLeft: 68, rearRight: 70 },
        paceChange: -0.08,
        timeDelta: 0.12,
        stressLevel: 0.88,
      },
      drivers: { primary: 7, secondary: 12 },
      impact: "high",
    },
    {
      id: "3",
      type: "tire_cliff",
      lap: 45,
      timestamp: "00:31:42",
      title: "Tire Cliff Moment - Car #33 Loses 0.25s Per Lap",
      description: "Car #33 experienced significant tire degradation, losing 0.25s per lap as tire wear crossed the critical threshold. Front-left tire dropped to 45% condition.",
      evidence: {
        sectorDeltas: { sector1: 0.12, sector2: 0.08, sector3: 0.05 },
        tireCondition: { frontLeft: 45, frontRight: 58, rearLeft: 62, rearRight: 60 },
        paceChange: -0.25,
        timeDelta: 0.25,
        stressLevel: 0.65,
      },
      drivers: { primary: 33 },
      impact: "medium",
    },
    {
      id: "4",
      type: "pit_shift",
      lap: 28,
      timestamp: "00:19:08",
      title: "Strategic Pit Window Shift - Early Stop Pays Off",
      description: "Car #15's early pit stop at lap 28 created a strategic advantage, undercutting competitors by 2.3s and gaining track position after the pit cycle completed.",
      evidence: {
        sectorDeltas: { sector1: 0.05, sector2: 0.03, sector3: 0.07 },
        tireCondition: { frontLeft: 95, frontRight: 95, rearLeft: 95, rearRight: 95 },
        paceChange: 0.15,
        timeDelta: -2.3,
        stressLevel: 0.45,
      },
      drivers: { primary: 15 },
      impact: "high",
    },
    {
      id: "5",
      type: "pace_change",
      lap: 38,
      timestamp: "00:26:55",
      title: "Pace Inflection Point - Car #21 Finds Rhythm",
      description: "Car #21 discovered optimal pace after adjusting driving line, improving by 0.12s per lap consistently across all sectors, indicating successful setup optimization.",
      evidence: {
        sectorDeltas: { sector1: 0.10, sector2: 0.12, sector3: 0.11 },
        tireCondition: { frontLeft: 70, frontRight: 68, rearLeft: 65, rearRight: 67 },
        paceChange: 0.12,
        timeDelta: -0.12,
        stressLevel: 0.55,
      },
      drivers: { primary: 21 },
      impact: "medium",
    },
  ];
};

export default function RaceStoryGenerator() {
  const [highlights, setHighlights] = useState<RaceMoment[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>("race-1");
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"story" | "data" | "generator">("generator");

  // Initialize the new Race Story Generator
  const generator = useMemo(() => new RaceStoryGen(mockRaceTelemetry), []);
  const generatedHighlights = useMemo(() => generator.identifyKeyMoments(), [generator]);
  const englishSummaries = useMemo(() => generator.generateEnglishSummaries(generatedHighlights), [generator, generatedHighlights]);
  const broadcastCards = useMemo(() => generator.generateBroadcastCards(generatedHighlights), [generator, generatedHighlights]);

  useEffect(() => {
    // Simulate loading race highlights
    setIsGenerating(true);
    setTimeout(() => {
      setHighlights(generateMockHighlights());
      setIsGenerating(false);
    }, 1500);
  }, [selectedRace]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setHighlights(generateMockHighlights());
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMomentTypeLabel = (type: RaceMoment["type"]) => {
    const labels = {
      overtake: "Overtake",
      defensive: "Defensive Battle",
      tire_cliff: "Tire Cliff",
      pit_shift: "Pit Strategy",
      pace_change: "Pace Change",
      stress_peak: "Stress Peak",
    };
    return labels[type];
  };

  const getMomentTypeColor = (type: RaceMoment["type"]) => {
    const colors = {
      overtake: "bg-blue-500",
      defensive: "bg-red-500",
      tire_cliff: "bg-orange-500",
      pit_shift: "bg-purple-500",
      pace_change: "bg-green-500",
      stress_peak: "bg-yellow-500",
    };
    return colors[type];
  };

  const getImpactColor = (impact: RaceMoment["impact"]) => {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[impact];
  };

  const selectedMoment = useMemo(() => {
    return highlights.find((h) => h.id === selectedHighlight);
  }, [highlights, selectedHighlight]);

  const chartData = useMemo(() => {
    return highlights.map((h) => ({
      lap: h.lap,
      paceChange: h.evidence.paceChange,
      timeDelta: h.evidence.timeDelta,
      stress: h.evidence.stressLevel * 100,
      name: `Lap ${h.lap}`,
    }));
  }, [highlights]);

  const tireData = selectedMoment
    ? [
        { name: "FL", value: selectedMoment.evidence.tireCondition.frontLeft },
        { name: "FR", value: selectedMoment.evidence.tireCondition.frontRight },
        { name: "RL", value: selectedMoment.evidence.tireCondition.rearLeft },
        { name: "RR", value: selectedMoment.evidence.tireCondition.rearRight },
      ]
    : [];

  return (
    <RouteLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Race Story Generator
            </h1>
            <p className="text-muted-foreground mt-2">
              Automatically identifies key race moments and converts telemetry data into shareable story highlights
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedRace} onValueChange={setSelectedRace}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Race" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="race-1">Race 1 - COTA</SelectItem>
                <SelectItem value="race-2">Race 2 - Indianapolis</SelectItem>
                <SelectItem value="race-3">Race 3 - Road America</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Story
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Key Moments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highlights.length}</div>
              <p className="text-xs text-muted-foreground">Detected highlights</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {highlights.filter((h) => h.impact === "high").length}
              </div>
              <p className="text-xs text-muted-foreground">Critical moments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overtakes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {highlights.filter((h) => h.type === "overtake").length}
              </div>
              <p className="text-xs text-muted-foreground">Position changes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Stress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {highlights.length > 0
                  ? Math.round(
                      (highlights.reduce((sum, h) => sum + h.evidence.stressLevel, 0) / highlights.length) * 100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Peak intensity</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "story" | "data" | "generator")}>
          <TabsList>
            <TabsTrigger value="generator">Race Story Generator</TabsTrigger>
            <TabsTrigger value="story">Story View</TabsTrigger>
            <TabsTrigger value="data">Data Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-4">
            {/* New Race Story Generator Component */}
            <RaceStoryHighlights highlights={generatedHighlights} />

            {/* English Summaries Section */}
            <Card>
              <CardHeader>
                <CardTitle>English Summaries</CardTitle>
                <CardDescription>
                  Human-readable summaries generated from telemetry data (Data → English translation)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {englishSummaries.map((summary, index) => (
                    <div
                      key={index}
                      className="bg-muted rounded-md p-4 border-l-4 border-primary"
                    >
                      <p className="text-sm">{summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Broadcast Cards Section */}
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Cards</CardTitle>
                <CardDescription>
                  Media-ready visuals for commentary and post-race recaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {broadcastCards.map((card, index) => (
                    <div
                      key={index}
                      className="bg-primary/10 border border-primary/20 rounded-md p-4"
                    >
                      <h3 className="font-bold text-primary mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{card.mainText}</p>
                      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-primary/10">
                        {card.evidence.sectorDelta && (
                          <div>
                            <span className="text-primary">Sector {card.evidence.sectorDelta.sector}:</span>{" "}
                            {Math.abs(card.evidence.sectorDelta.delta).toFixed(2)}s
                            {card.evidence.sectorDelta.delta < 0 ? (
                              <span className="text-green-600 ml-1">(Gain)</span>
                            ) : (
                              <span className="text-red-600 ml-1">(Loss)</span>
                            )}
                          </div>
                        )}
                        {card.evidence.tireCondition && (
                          <div>
                            <span className="text-primary">Tire Wear:</span>{" "}
                            {card.evidence.tireCondition.wearPercentage}% (Threshold:{" "}
                            {card.evidence.tireCondition.wornThreshold}%)
                          </div>
                        )}
                        {typeof card.evidence.paceChange === "number" && (
                          <div>
                            <span className="text-primary">Pace Change:</span>{" "}
                            <span
                              className={
                                card.evidence.paceChange < 0 ? "text-green-600" : "text-red-600"
                              }
                            >
                              {card.evidence.paceChange.toFixed(2)}s
                            </span>
                          </div>
                        )}
                        {card.evidence.pitTiming && (
                          <div>
                            <span className="text-primary">Pit Strategy:</span>{" "}
                            {card.evidence.pitTiming.pitType} on lap {card.evidence.pitTiming.pitLap}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="story" className="space-y-4">
            {/* Highlights List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {highlights.map((highlight) => (
                <motion.div
                  key={highlight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedHighlight === highlight.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedHighlight(highlight.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getMomentTypeColor(highlight.type)}>
                              {getMomentTypeLabel(highlight.type)}
                            </Badge>
                            <Badge variant="outline" className={getImpactColor(highlight.impact)}>
                              {highlight.impact.toUpperCase()} IMPACT
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{highlight.title}</CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Lap {highlight.lap}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {highlight.timestamp}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Car #{highlight.drivers.primary}
                              {highlight.drivers.secondary && ` vs #${highlight.drivers.secondary}`}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{highlight.description}</p>

                      {/* Evidence Summary */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-muted p-2 rounded">
                          <div className="text-xs text-muted-foreground">Pace Change</div>
                          <div
                            className={`text-sm font-semibold ${
                              highlight.evidence.paceChange > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {highlight.evidence.paceChange > 0 ? "+" : ""}
                            {highlight.evidence.paceChange.toFixed(2)}s
                          </div>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <div className="text-xs text-muted-foreground">Time Delta</div>
                          <div
                            className={`text-sm font-semibold ${
                              highlight.evidence.timeDelta < 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {highlight.evidence.timeDelta > 0 ? "+" : ""}
                            {highlight.evidence.timeDelta.toFixed(2)}s
                          </div>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <div className="text-xs text-muted-foreground">Stress Level</div>
                          <div className="text-sm font-semibold">
                            {Math.round(highlight.evidence.stressLevel * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Sector Deltas */}
                      <div className="mb-4">
                        <div className="text-xs font-medium mb-2">Sector Deltas</div>
                        <div className="flex gap-2">
                          {Object.entries(highlight.evidence.sectorDeltas).map(([sector, delta]) => (
                            <div key={sector} className="flex-1 bg-muted p-2 rounded text-center">
                              <div className="text-xs text-muted-foreground">{sector.toUpperCase()}</div>
                              <div
                                className={`text-sm font-semibold ${
                                  delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-600"
                                }`}
                              >
                                {delta > 0 ? "+" : ""}
                                {delta.toFixed(2)}s
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(highlight.description, highlight.id);
                          }}
                        >
                          {copiedId === highlight.id ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pace Change Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Pace Changes Over Race</CardTitle>
                  <CardDescription>Time delta and pace changes by lap</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="lap" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="paceChange"
                        stroke="#8884d8"
                        name="Pace Change (s)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="timeDelta"
                        stroke="#82ca9d"
                        name="Time Delta (s)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Stress Level Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Stress Levels by Moment</CardTitle>
                  <CardDescription>Intensity of key race moments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="stress" fill="#f59e0b" name="Stress Level (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tire Condition */}
              {selectedMoment && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Tire Condition Analysis - {selectedMoment.title}</CardTitle>
                    <CardDescription>
                      Tire wear percentages: FL (Front Left), FR (Front Right), RL (Rear Left), RR (Rear Right)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={tireData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#ef4444" name="Tire Condition (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      {tireData.map((tire) => (
                        <div key={tire.name} className="text-center">
                          <div className="text-sm font-medium">{tire.name}</div>
                          <div
                            className={`text-lg font-bold ${
                              tire.value > 70
                                ? "text-green-600"
                                : tire.value > 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {tire.value}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Export & Share</CardTitle>
            <CardDescription>Generate media-ready content for broadcasts and debriefs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline">
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Visuals
              </Button>
              <Button variant="outline">
                <Video className="h-4 w-4 mr-2" />
                Create Recap Video
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share Story
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteLayout>
  );
}

