import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Filter,
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Award,
  Target,
  Zap,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  Flag,
  AlertCircle,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Eye,
  Gauge,
  Route,
  TrendingUp as TrendingUpIcon,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

interface TrackInfo {
  id: string;
  name: string;
  location: string;
  length: number; // miles
  turns: number;
  elevation: number; // feet
  surface: string;
  characteristics: {
    technical: number; // 0-100
    speed: number; // 0-100
    overtaking: number; // 0-100
    tireWear: number; // 0-100
  };
}

interface WeatherForecast {
  date: string;
  time: string;
  temperature: number; // Fahrenheit
  humidity: number; // percentage
  windSpeed: number; // mph
  windDirection: string;
  conditions: string;
  precipitation: number; // percentage chance
  trackTemp: number; // Fahrenheit (estimated)
}

interface HistoricalPerformance {
  trackId: string;
  trackName: string;
  races: number;
  bestFinish: number;
  averageFinish: number;
  fastestLap: string;
  averageLapTime: string;
  podiums: number;
  wins: number;
  dnfRate: number; // percentage
}

interface CompetitorAnalysis {
  carNumber: number;
  driverName?: string;
  trackRecord: {
    races: number;
    wins: number;
    podiums: number;
    averagePosition: number;
    fastestLap: string;
  };
  recentForm: {
    last5Races: number[]; // positions
    averagePosition: number;
    trend: "improving" | "declining" | "stable";
  };
  strengths: string[];
  weaknesses: string[];
}

interface StrategyRecommendation {
  type: "aggressive" | "conservative" | "balanced";
  pitStops: number;
  tireStrategy: string;
  expectedLapTime: string;
  riskLevel: "low" | "medium" | "high";
  reasoning: string[];
}

const mockTracks: TrackInfo[] = [
  {
    id: "barber",
    name: "Barber Motorsports Park",
    location: "Birmingham, Alabama",
    length: 2.38,
    turns: 17,
    elevation: 650,
    surface: "Smooth asphalt",
    characteristics: {
      technical: 85,
      speed: 60,
      overtaking: 40,
      tireWear: 70,
    },
  },
  {
    id: "cota",
    name: "Circuit of the Americas",
    location: "Austin, Texas",
    length: 3.427,
    turns: 20,
    elevation: 133,
    surface: "Smooth asphalt",
    characteristics: {
      technical: 90,
      speed: 80,
      overtaking: 65,
      tireWear: 75,
    },
  },
  {
    id: "sebring",
    name: "Sebring International Raceway",
    location: "Sebring, Florida",
    length: 3.74,
    turns: 17,
    elevation: 62,
    surface: "Bumpy concrete/asphalt",
    characteristics: {
      technical: 70,
      speed: 75,
      overtaking: 55,
      tireWear: 85,
    },
  },
  {
    id: "sonoma",
    name: "Sonoma Raceway",
    location: "Sonoma, California",
    length: 2.52,
    turns: 12,
    elevation: 174,
    surface: "Smooth asphalt",
    characteristics: {
      technical: 80,
      speed: 55,
      overtaking: 35,
      tireWear: 65,
    },
  },
];

const mockWeatherForecast: WeatherForecast[] = [
  {
    date: "2025-12-20",
    time: "09:00",
    temperature: 68,
    humidity: 65,
    windSpeed: 8,
    windDirection: "SW",
    conditions: "Partly Cloudy",
    precipitation: 10,
    trackTemp: 75,
  },
  {
    date: "2025-12-20",
    time: "12:00",
    temperature: 75,
    humidity: 55,
    windSpeed: 12,
    windDirection: "SW",
    conditions: "Sunny",
    precipitation: 5,
    trackTemp: 95,
  },
  {
    date: "2025-12-20",
    time: "15:00",
    temperature: 72,
    humidity: 60,
    windSpeed: 10,
    windDirection: "W",
    conditions: "Partly Cloudy",
    precipitation: 15,
    trackTemp: 88,
  },
];

const mockHistoricalPerformance: HistoricalPerformance[] = [
  {
    trackId: "barber",
    trackName: "Barber Motorsports Park",
    races: 4,
    bestFinish: 1,
    averageFinish: 2.5,
    fastestLap: "1:37.304",
    averageLapTime: "1:38.234",
    podiums: 3,
    wins: 1,
    dnfRate: 3.6,
  },
  {
    trackId: "cota",
    trackName: "Circuit of the Americas",
    races: 3,
    bestFinish: 2,
    averageFinish: 4.2,
    fastestLap: "2:28.112",
    averageLapTime: "2:29.456",
    podiums: 1,
    wins: 0,
    dnfRate: 16.1,
  },
  {
    trackId: "sebring",
    trackName: "Sebring International Raceway",
    races: 2,
    bestFinish: 1,
    averageFinish: 1.5,
    fastestLap: "2:25.437",
    averageLapTime: "2:27.123",
    podiums: 2,
    wins: 2,
    dnfRate: 0,
  },
];

const mockCompetitors: CompetitorAnalysis[] = [
  {
    carNumber: 13,
    driverName: "Driver A",
    trackRecord: {
      races: 4,
      wins: 2,
      podiums: 3,
      averagePosition: 2.2,
      fastestLap: "1:37.428",
    },
    recentForm: {
      last5Races: [1, 2, 1, 3, 2],
      averagePosition: 1.8,
      trend: "improving",
    },
    strengths: ["Consistency", "Tire management", "Qualifying pace"],
    weaknesses: ["Overtaking", "Wet conditions"],
  },
  {
    carNumber: 22,
    driverName: "Driver B",
    trackRecord: {
      races: 4,
      wins: 1,
      podiums: 2,
      averagePosition: 3.5,
      fastestLap: "1:37.304",
    },
    recentForm: {
      last5Races: [2, 3, 4, 2, 1],
      averagePosition: 2.4,
      trend: "stable",
    },
    strengths: ["Raw speed", "Race craft", "Overtaking"],
    weaknesses: ["Tire degradation", "Consistency"],
  },
  {
    carNumber: 46,
    driverName: "Driver C",
    trackRecord: {
      races: 3,
      wins: 1,
      podiums: 2,
      averagePosition: 4.0,
      fastestLap: "2:28.630",
    },
    recentForm: {
      last5Races: [1, 5, 3, 4, 3],
      averagePosition: 3.2,
      trend: "declining",
    },
    strengths: ["Strategy", "Race management"],
    weaknesses: ["Qualifying", "Early race pace"],
  },
];

const mockStrategyRecommendations: StrategyRecommendation[] = [
  {
    type: "balanced",
    pitStops: 1,
    tireStrategy: "Start on Mediums, switch to Hards at lap 12-15",
    expectedLapTime: "1:38.5",
    riskLevel: "medium",
    reasoning: [
      "Track temperature expected to be moderate (75-95°F)",
      "Historical data shows 1-stop strategy is optimal",
      "Medium compound provides good balance of pace and durability",
      "Hards will last to the end with minimal degradation",
    ],
  },
  {
    type: "aggressive",
    pitStops: 2,
    tireStrategy: "Start on Softs, switch to Mediums at lap 8, Hards at lap 18",
    expectedLapTime: "1:37.8",
    riskLevel: "high",
    reasoning: [
      "Faster initial pace with Softs",
      "Requires clean track position",
      "Higher tire degradation risk",
      "Best for qualifying position advantage",
    ],
  },
  {
    type: "conservative",
    pitStops: 1,
    tireStrategy: "Start on Hards, switch to Mediums at lap 20",
    expectedLapTime: "1:39.2",
    riskLevel: "low",
    reasoning: [
      "Minimal tire degradation",
      "Lower risk of tire issues",
      "Better for maintaining position",
      "Suitable for mid-field starting position",
    ],
  },
];

export default function PreEventAnalysis() {
  const [selectedTrack, setSelectedTrack] = useState<string>("barber");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const currentTrack = useMemo(() => {
    return mockTracks.find((track) => track.id === selectedTrack) || mockTracks[0];
  }, [selectedTrack]);

  const trackHistory = useMemo(() => {
    return mockHistoricalPerformance.find((perf) => perf.trackId === selectedTrack);
  }, [selectedTrack]);

  const filteredTracks = useMemo(() => {
    return mockTracks.filter((track) => {
      return (
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  const trackCharacteristicsData = useMemo(() => {
    return [
      { name: "Technical", value: currentTrack.characteristics.technical },
      { name: "Speed", value: currentTrack.characteristics.speed },
      { name: "Overtaking", value: currentTrack.characteristics.overtaking },
      { name: "Tire Wear", value: currentTrack.characteristics.tireWear },
    ];
  }, [currentTrack]);

  const weatherChartData = useMemo(() => {
    return mockWeatherForecast.map((forecast) => ({
      time: forecast.time,
      temperature: forecast.temperature,
      trackTemp: forecast.trackTemp,
      humidity: forecast.humidity,
      windSpeed: forecast.windSpeed,
    }));
  }, []);

  const competitorFormData = useMemo(() => {
    return mockCompetitors.map((competitor) => ({
      carNumber: `#${competitor.carNumber}`,
      avgPosition: competitor.recentForm.averagePosition,
      trend: competitor.recentForm.trend === "improving" ? 1 : competitor.recentForm.trend === "declining" ? -1 : 0,
    }));
  }, []);

  const handleExport = (format: "csv" | "json" | "pdf") => {
    const data = {
      track: currentTrack,
      weather: mockWeatherForecast,
      history: trackHistory,
      competitors: mockCompetitors,
      strategies: mockStrategyRecommendations,
    };

    let blob: Blob;
    let filename: string;

    if (format === "csv") {
      const csv = [
        ["Category", "Field", "Value"].join(","),
        ["Track", "Name", currentTrack.name].join(","),
        ["Track", "Length (miles)", currentTrack.length].join(","),
        ["Track", "Turns", currentTrack.turns].join(","),
        ["Weather", "Race Time Temp", mockWeatherForecast[1].temperature].join(","),
        ["Weather", "Track Temp", mockWeatherForecast[1].trackTemp].join(","),
      ].join("\n");
      blob = new Blob([csv], { type: "text/csv" });
      filename = `pre-event-analysis-${selectedTrack}-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (format === "json") {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      filename = `pre-event-analysis-${selectedTrack}-${new Date().toISOString().split("T")[0]}.json`;
    } else {
      alert("PDF export coming soon!");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getWeatherIcon = (conditions: string) => {
    if (conditions.toLowerCase().includes("rain")) return <CloudRain className="w-5 h-5" />;
    if (conditions.toLowerCase().includes("cloud")) return <Cloud className="w-5 h-5" />;
    return <Sun className="w-5 h-5" />;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "declining") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getRiskBadgeColor = (risk: string) => {
    if (risk === "low") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (risk === "medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-6xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              Pre-Event Analysis
            </h1>
            <p className="text-gray-300 mt-3 max-w-2xl">
              Track analysis, weather forecasts, historical performance, and strategy planning before race day
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tracks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Track</Label>
                    <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTracks.map((track) => (
                          <SelectItem key={track.id} value={track.id}>
                            {track.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="track">Track Analysis</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Track Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Track Length</p>
                      <p className="text-2xl font-bold">{currentTrack.length} mi</p>
                    </div>
                    <Route className="w-8 h-8 text-[#EB0A1E]/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Turns</p>
                      <p className="text-2xl font-bold">{currentTrack.turns}</p>
                    </div>
                    <Gauge className="w-8 h-8 text-[#EB0A1E]/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Expected Temp</p>
                      <p className="text-2xl font-bold">{mockWeatherForecast[1].temperature}°F</p>
                    </div>
                    <Thermometer className="w-8 h-8 text-[#EB0A1E]/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Historical Races</p>
                      <p className="text-2xl font-bold">{trackHistory?.races || 0}</p>
                    </div>
                    <Flag className="w-8 h-8 text-[#EB0A1E]/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Track Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Track Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Location</span>
                      <span className="font-semibold">{currentTrack.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Length</span>
                      <span className="font-semibold">{currentTrack.length} miles</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Turns</span>
                      <span className="font-semibold">{currentTrack.turns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Elevation</span>
                      <span className="font-semibold">{currentTrack.elevation} ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Surface</span>
                      <span className="font-semibold">{currentTrack.surface}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Track Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={trackCharacteristicsData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Characteristics"
                        dataKey="value"
                        stroke="#EB0A1E"
                        fill="#EB0A1E"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Weather Summary */}
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Weather Forecast (Race Day)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockWeatherForecast.map((forecast, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{forecast.time}</span>
                        {getWeatherIcon(forecast.conditions)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Temp</span>
                          <span className="font-semibold">{forecast.temperature}°F</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Track Temp</span>
                          <span className="font-semibold">{forecast.trackTemp}°F</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Humidity</span>
                          <span className="font-semibold">{forecast.humidity}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Wind</span>
                          <span className="font-semibold">
                            {forecast.windSpeed} mph {forecast.windDirection}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rain Chance</span>
                          <span className="font-semibold">{forecast.precipitation}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Historical Performance Summary */}
            {trackHistory && (
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Historical Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Races</p>
                      <p className="text-2xl font-bold">{trackHistory.races}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Best Finish</p>
                      <p className="text-2xl font-bold">{trackHistory.bestFinish}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Avg Finish</p>
                      <p className="text-2xl font-bold">{trackHistory.averageFinish.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Wins</p>
                      <p className="text-2xl font-bold">{trackHistory.wins}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Track Analysis Tab */}
          <TabsContent value="track" className="space-y-6">
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle>Track Characteristics Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold">Technical Difficulty</span>
                      <span className="text-sm">{currentTrack.characteristics.technical}/100</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-[#EB0A1E] h-2 rounded-full"
                        style={{ width: `${currentTrack.characteristics.technical}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold">Speed Requirement</span>
                      <span className="text-sm">{currentTrack.characteristics.speed}/100</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-[#EB0A1E] h-2 rounded-full"
                        style={{ width: `${currentTrack.characteristics.speed}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold">Overtaking Opportunities</span>
                      <span className="text-sm">{currentTrack.characteristics.overtaking}/100</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-[#EB0A1E] h-2 rounded-full"
                        style={{ width: `${currentTrack.characteristics.overtaking}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold">Tire Wear Factor</span>
                      <span className="text-sm">{currentTrack.characteristics.tireWear}/100</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-[#EB0A1E] h-2 rounded-full"
                        style={{ width: `${currentTrack.characteristics.tireWear}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {trackHistory && (
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Fastest Lap</p>
                        <p className="text-2xl font-bold">{trackHistory.fastestLap}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Average Lap Time</p>
                        <p className="text-2xl font-bold">{trackHistory.averageLapTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">DNF Rate</p>
                        <p className="text-2xl font-bold">{trackHistory.dnfRate}%</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Podiums</p>
                        <p className="text-2xl font-bold">{trackHistory.podiums}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Wins</p>
                        <p className="text-2xl font-bold">{trackHistory.wins}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Best Finish</p>
                        <p className="text-2xl font-bold">P{trackHistory.bestFinish}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="space-y-6">
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle>Weather Forecast Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={weatherChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="temperature"
                      fill="#ef4444"
                      fillOpacity={0.3}
                      stroke="#ef4444"
                      name="Air Temp (°F)"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="trackTemp"
                      stroke="#f59e0b"
                      name="Track Temp (°F)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      name="Humidity (%)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="windSpeed"
                      stroke="#8b5cf6"
                      name="Wind Speed (mph)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Weather Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="font-semibold mb-2">Track Temperature</div>
                    <p className="text-sm text-gray-400">
                      Expected track temp of {mockWeatherForecast[1].trackTemp}°F will provide good tire grip
                      and moderate degradation
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="font-semibold mb-2">Wind Conditions</div>
                    <p className="text-sm text-gray-400">
                      {mockWeatherForecast[1].windSpeed} mph {mockWeatherForecast[1].windDirection} wind
                      may affect top speed on main straight
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="font-semibold mb-2">Precipitation Risk</div>
                    <p className="text-sm text-gray-400">
                      {mockWeatherForecast[1].precipitation}% chance of rain - monitor conditions closely
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-semibold">Tire Strategy</p>
                      <p className="text-sm text-gray-400">
                        Moderate temperatures favor medium compound for balanced performance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-semibold">Setup Adjustments</p>
                      <p className="text-sm text-gray-400">
                        Consider aerodynamic adjustments for wind conditions on high-speed sections
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-semibold">Contingency Planning</p>
                      <p className="text-sm text-gray-400">
                        Prepare wet weather setup in case of precipitation during race
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="space-y-6">
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle>Competitor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCompetitors.map((competitor) => (
                    <div
                      key={competitor.carNumber}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold">#{competitor.carNumber}</span>
                            {competitor.driverName && (
                              <span className="text-sm text-gray-400">{competitor.driverName}</span>
                            )}
                            {getTrendIcon(competitor.recentForm.trend)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {competitor.trackRecord.races} races • {competitor.trackRecord.wins} wins •{" "}
                            {competitor.trackRecord.podiums} podiums
                          </div>
                        </div>
                        <Badge variant="outline">
                          Avg: P{competitor.trackRecord.averagePosition.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold mb-2">Strengths</p>
                          <div className="flex flex-wrap gap-2">
                            {competitor.strengths.map((strength, idx) => (
                              <Badge key={idx} variant="default" className="bg-green-500/20 text-green-400">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Weaknesses</p>
                          <div className="flex flex-wrap gap-2">
                            {competitor.weaknesses.map((weakness, idx) => (
                              <Badge key={idx} variant="outline" className="border-red-500/30 text-red-400">
                                {weakness}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Recent Form (Last 5)</span>
                          <span className="font-semibold">
                            {competitor.recentForm.last5Races.map((pos) => `P${pos}`).join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-400">Fastest Lap</span>
                          <span className="font-semibold">{competitor.trackRecord.fastestLap}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle>Competitor Form Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={competitorFormData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="carNumber" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgPosition" fill="#EB0A1E" name="Average Position" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockStrategyRecommendations.map((strategy, index) => (
                <Card
                  key={index}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize">{strategy.type} Strategy</CardTitle>
                      <Badge className={getRiskBadgeColor(strategy.riskLevel)}>
                        {strategy.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Pit Stops</p>
                      <p className="text-xl font-bold">{strategy.pitStops}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Tire Strategy</p>
                      <p className="text-sm font-semibold">{strategy.tireStrategy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Expected Lap Time</p>
                      <p className="text-xl font-bold">{strategy.expectedLapTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Reasoning</p>
                      <ul className="space-y-1">
                        {strategy.reasoning.map((reason, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-[#EB0A1E] mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Strategy Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-[#EB0A1E]/10 border border-[#EB0A1E]/20 rounded-lg">
                  <div className="font-semibold mb-2">Recommended Strategy</div>
                  <p className="text-sm text-gray-400 mb-2">
                    Based on track characteristics, weather conditions, and historical performance, the{" "}
                    <strong>Balanced Strategy</strong> is recommended for optimal risk/reward balance.
                  </p>
                  <p className="text-sm text-gray-400">
                    This strategy provides good pace while minimizing tire degradation risk and maintaining
                    flexibility for race conditions.
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="font-semibold mb-2">Alternative Considerations</div>
                  <p className="text-sm text-gray-400">
                    If starting from pole position, consider the Aggressive Strategy to build an early gap.
                    If starting mid-field, the Conservative Strategy may help avoid early race incidents.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}


