import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Filter,
  Search,
  GitCompare,
  Calendar,
  MapPin,
  Users,
  Clock,
  Award,
  Target,
  Zap,
  Activity,
  FileText,
  Share2,
  ChevronDown,
  ChevronUp,
  Flag,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface RaceData {
  id: string;
  track: string;
  trackId: string;
  raceNumber: number;
  date: string;
  duration: string;
  totalLaps: number;
  participants: number;
  winner: {
    carNumber: number;
    time: string;
    gap: string;
  };
  fastestLap: {
    carNumber: number;
    time: string;
    kph: number;
    lap: number;
  };
  statistics: {
    averageLapTime: string;
    fieldSpread: string;
    completionRate: string;
    dnfCount: number;
  };
  results: Array<{
    position: number;
    carNumber: number;
    totalTime: string;
    gapToLeader: string;
    lapsCompleted: number;
    fastestLap: string;
    fastestLapKph: number;
    status: string;
  }>;
}

interface DriverPerformance {
  carNumber: number;
  name?: string;
  races: number;
  wins: number;
  podiums: number;
  averagePosition: number;
  averageLapTime: string;
  consistency: number;
  fastestLaps: number;
  totalPoints?: number;
}

const mockRaceData: RaceData[] = [
  {
    id: "barber-1",
    track: "Barber Motorsports Park",
    trackId: "barber",
    raceNumber: 1,
    date: "2025-09-06",
    duration: "45:15.035",
    totalLaps: 28,
    participants: 28,
    winner: { carNumber: 13, time: "45:15.035", gap: "-" },
    fastestLap: { carNumber: 22, time: "1:37.304", kph: 136.9, lap: 14 },
    statistics: {
      averageLapTime: "1:38.234",
      fieldSpread: "24.207s",
      completionRate: "96.4%",
      dnfCount: 1,
    },
    results: [
      { position: 1, carNumber: 13, totalTime: "45:15.035", gapToLeader: "-", lapsCompleted: 28, fastestLap: "1:37.428", fastestLapKph: 136.8, status: "Finished" },
      { position: 2, carNumber: 22, totalTime: "45:17.281", gapToLeader: "+2.246", lapsCompleted: 28, fastestLap: "1:37.304", fastestLapKph: 136.9, status: "Finished" },
      { position: 3, carNumber: 0, totalTime: "45:31.587", gapToLeader: "+16.552", lapsCompleted: 28, fastestLap: "1:38.123", fastestLapKph: 135.2, status: "Finished" },
    ],
  },
  {
    id: "cota-1",
    track: "Circuit of the Americas",
    trackId: "cota",
    raceNumber: 1,
    date: "2025-10-12",
    duration: "45:57.575",
    totalLaps: 25,
    participants: 31,
    winner: { carNumber: 46, time: "45:57.575", gap: "-" },
    fastestLap: { carNumber: 21, time: "2:28.112", kph: 133.0, lap: 12 },
    statistics: {
      averageLapTime: "2:29.456",
      fieldSpread: "45.234s",
      completionRate: "83.9%",
      dnfCount: 5,
    },
    results: [
      { position: 1, carNumber: 46, totalTime: "45:57.575", gapToLeader: "-", lapsCompleted: 25, fastestLap: "2:28.630", fastestLapKph: 132.5, status: "Finished" },
      { position: 2, carNumber: 7, totalTime: "46:02.123", gapToLeader: "+4.548", lapsCompleted: 25, fastestLap: "2:29.145", fastestLapKph: 131.8, status: "Finished" },
      { position: 3, carNumber: 21, totalTime: "46:05.789", gapToLeader: "+8.214", lapsCompleted: 25, fastestLap: "2:28.112", fastestLapKph: 133.0, status: "Finished" },
    ],
  },
  {
    id: "sebring-1",
    track: "Sebring International Raceway",
    trackId: "sebring",
    raceNumber: 1,
    date: "2025-11-15",
    duration: "46:23.022",
    totalLaps: 24,
    participants: 29,
    winner: { carNumber: 13, time: "46:23.022", gap: "-" },
    fastestLap: { carNumber: 13, time: "2:25.437", kph: 138.2, lap: 4 },
    statistics: {
      averageLapTime: "2:27.123",
      fieldSpread: "32.456s",
      completionRate: "100%",
      dnfCount: 0,
    },
    results: [
      { position: 1, carNumber: 13, totalTime: "46:23.022", gapToLeader: "-", lapsCompleted: 24, fastestLap: "2:25.437", fastestLapKph: 138.2, status: "Finished" },
      { position: 2, carNumber: 22, totalTime: "46:31.531", gapToLeader: "+8.509", lapsCompleted: 24, fastestLap: "2:26.123", fastestLapKph: 137.5, status: "Finished" },
      { position: 3, carNumber: 46, totalTime: "46:35.234", gapToLeader: "+12.212", lapsCompleted: 24, fastestLap: "2:26.789", fastestLapKph: 136.8, status: "Finished" },
    ],
  },
];

export default function PostEventAnalysis() {
  const [selectedRaces, setSelectedRaces] = useState<string[]>([mockRaceData[0].id]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const filteredRaces = useMemo(() => {
    return mockRaceData.filter((race) => {
      const matchesSearch = race.track.toLowerCase().includes(searchQuery.toLowerCase()) ||
        race.trackId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrack = filterTrack === "all" || race.trackId === filterTrack;
      return matchesSearch && matchesTrack;
    });
  }, [searchQuery, filterTrack]);

  const selectedRaceData = useMemo(() => {
    return mockRaceData.filter((race) => selectedRaces.includes(race.id));
  }, [selectedRaces]);

  const driverPerformance = useMemo((): DriverPerformance[] => {
    const driverMap = new Map<number, DriverPerformance>();
    
    mockRaceData.forEach((race) => {
      race.results.forEach((result) => {
        if (!driverMap.has(result.carNumber)) {
          driverMap.set(result.carNumber, {
            carNumber: result.carNumber,
            races: 0,
            wins: 0,
            podiums: 0,
            averagePosition: 0,
            averageLapTime: "",
            consistency: 0,
            fastestLaps: 0,
            totalPoints: 0,
          });
        }
        const driver = driverMap.get(result.carNumber)!;
        driver.races++;
        if (result.position === 1) driver.wins++;
        if (result.position <= 3) driver.podiums++;
        driver.averagePosition = (driver.averagePosition * (driver.races - 1) + result.position) / driver.races;
      });
    });
    
    return Array.from(driverMap.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.averagePosition - b.averagePosition;
    });
  }, []);

  const lapTimeChartData = useMemo(() => {
    return selectedRaceData.flatMap((race) =>
      race.results.slice(0, 10).map((result) => ({
        race: `${race.trackId}-${race.raceNumber}`,
        carNumber: result.carNumber,
        position: result.position,
        fastestLap: parseFloat(result.fastestLap.replace(":", ".")),
      }))
    );
  }, [selectedRaceData]);

  const positionDistributionData = useMemo(() => {
    const distribution = new Map<number, number>();
    selectedRaceData.forEach((race) => {
      race.results.forEach((result) => {
        const range = Math.floor((result.position - 1) / 5) * 5 + 1;
        distribution.set(range, (distribution.get(range) || 0) + 1);
      });
    });
    return Array.from(distribution.entries())
      .map(([range, count]) => ({
        range: `${range}-${range + 4}`,
        count,
      }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range));
  }, [selectedRaceData]);

  const handleExport = (format: "csv" | "json" | "pdf") => {
    const data = selectedRaceData;
    let blob: Blob;
    let filename: string;

    if (format === "csv") {
      const csv = [
        ["Track", "Race", "Date", "Position", "Car Number", "Total Time", "Gap", "Fastest Lap", "Status"].join(","),
        ...data.flatMap((race) =>
          race.results.map((result) =>
            [
              race.track,
              race.raceNumber,
              race.date,
              result.position,
              result.carNumber,
              result.totalTime,
              result.gapToLeader,
              result.fastestLap,
              result.status,
            ].join(",")
          )
        ),
      ].join("\n");
      blob = new Blob([csv], { type: "text/csv" });
      filename = `race-analysis-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (format === "json") {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      filename = `race-analysis-${new Date().toISOString().split("T")[0]}.json`;
    } else {
      // PDF export would require a library like jsPDF
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

  const toggleRaceSelection = (raceId: string) => {
    setSelectedRaces((prev) =>
      prev.includes(raceId) ? prev.filter((id) => id !== raceId) : [...prev, raceId]
    );
  };

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-6xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              Post-Event Analysis
            </h1>
            <p className="text-gray-300 mt-3 max-w-2xl">
              Comprehensive race analysis, comparisons, and performance insights
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
            <Button
              variant={comparisonMode ? "default" : "outline"}
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`gap-2 ${comparisonMode ? 'bg-[#EB0A1E] hover:bg-red-700' : 'border-gray-700 text-gray-200 hover:bg-gray-800'}`}
              aria-label={comparisonMode ? "Exit comparison mode" : "Enter comparison mode"}
              aria-pressed={comparisonMode}
            >
              <GitCompare className="w-4 h-4" aria-hidden="true" />
              Compare
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tracks or races..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Track</Label>
                    <Select value={filterTrack} onValueChange={setFilterTrack}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tracks</SelectItem>
                        <SelectItem value="barber">Barber Motorsports Park</SelectItem>
                        <SelectItem value="cota">Circuit of the Americas</SelectItem>
                        <SelectItem value="sebring">Sebring International Raceway</SelectItem>
                        <SelectItem value="sonoma">Sonoma Raceway</SelectItem>
                        <SelectItem value="indianapolis">Indianapolis Motor Speedway</SelectItem>
                        <SelectItem value="road-america">Road America</SelectItem>
                        <SelectItem value="vir">Virginia International Raceway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="quarter">Last Quarter</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Race Selection */}
        {comparisonMode && (
          <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5" aria-hidden="true" />
                Select Races to Compare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredRaces.map((race) => (
                  <div
                    key={race.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRaces.includes(race.id)
                        ? "border-[#EB0A1E] bg-[#EB0A1E]/10"
                        : "border-gray-800 hover:border-gray-700 bg-gray-800"
                    }`}
                    onClick={() => toggleRaceSelection(race.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{race.track}</div>
                        <div className="text-sm text-gray-400">
                          Race {race.raceNumber} • {race.date}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {race.participants} participants • {race.totalLaps} laps
                        </div>
                      </div>
                      <Checkbox
                        checked={selectedRaces.includes(race.id)}
                        onCheckedChange={() => toggleRaceSelection(race.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Races</p>
                    <p className="text-2xl font-bold">{mockRaceData.length}</p>
                  </div>
                  <Flag className="w-8 h-8 text-[#EB0A1E]/50" />
                </div>
              </CardContent>
            </Card>
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Unique Drivers</p>
                      <p className="text-2xl font-bold">{driverPerformance.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-[#EB0A1E]/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Avg Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {(
                          mockRaceData.reduce(
                            (sum, race) => sum + parseFloat(race.statistics.completionRate),
                            0
                          ) / mockRaceData.length
                        ).toFixed(1)}%
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-[#EB0A1E]/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total DNFs</p>
                      <p className="text-2xl font-bold">
                        {mockRaceData.reduce((sum, race) => sum + race.statistics.dnfCount, 0)}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Race Results Table */}
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle>Race Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRaces.map((race) => (
                    <div key={race.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{race.track}</h3>
                          <p className="text-sm text-muted-foreground">
                            Race {race.raceNumber} • {race.date} • {race.duration}
                          </p>
                        </div>
                        <Badge variant="outline">{race.participants} participants</Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Pos</th>
                              <th className="text-left p-2">Car #</th>
                              <th className="text-left p-2">Total Time</th>
                              <th className="text-left p-2">Gap</th>
                              <th className="text-left p-2">Fastest Lap</th>
                              <th className="text-left p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {race.results.slice(0, 10).map((result) => (
                              <tr key={result.carNumber} className="border-b hover:bg-accent/50">
                                <td className="p-2 font-semibold">{result.position}</td>
                                <td className="p-2">#{result.carNumber}</td>
                                <td className="p-2 font-mono">{result.totalTime}</td>
                                <td className="p-2 font-mono">{result.gapToLeader}</td>
                                <td className="p-2 font-mono">{result.fastestLap}</td>
                                <td className="p-2">
                                  <Badge
                                    variant={result.status === "Finished" ? "default" : "destructive"}
                                  >
                                    {result.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            {selectedRaceData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                    <CardHeader>
                      <CardTitle>Lap Time Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={lapTimeChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="race" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="fastestLap" fill="#ef4444" name="Fastest Lap (s)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                    <CardHeader>
                      <CardTitle>Position Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={positionDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" name="Drivers" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                  <CardHeader>
                    <CardTitle>Race Statistics Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Track</th>
                            <th className="text-left p-2">Race</th>
                            <th className="text-left p-2">Participants</th>
                            <th className="text-left p-2">Avg Lap Time</th>
                            <th className="text-left p-2">Field Spread</th>
                            <th className="text-left p-2">Completion Rate</th>
                            <th className="text-left p-2">DNFs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRaceData.map((race) => (
                            <tr key={race.id} className="border-b hover:bg-accent/50">
                              <td className="p-2 font-semibold">{race.track}</td>
                              <td className="p-2">Race {race.raceNumber}</td>
                              <td className="p-2">{race.participants}</td>
                              <td className="p-2 font-mono">{race.statistics.averageLapTime}</td>
                              <td className="p-2 font-mono">{race.statistics.fieldSpread}</td>
                              <td className="p-2">{race.statistics.completionRate}</td>
                              <td className="p-2">{race.statistics.dnfCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-12 text-center">
                  <GitCompare 
                    className="w-12 h-12 mx-auto mb-4 text-gray-400" 
                    aria-hidden="true"
                    role="img"
                  />
                  <p className="text-gray-400">
                    Select races in comparison mode to view detailed comparisons
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6">
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle>Driver Performance Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">Car #</th>
                        <th className="text-left p-2">Races</th>
                        <th className="text-left p-2">Wins</th>
                        <th className="text-left p-2">Podiums</th>
                        <th className="text-left p-2">Avg Position</th>
                        <th className="text-left p-2">Fastest Laps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverPerformance.map((driver, index) => (
                        <tr key={driver.carNumber} className="border-b hover:bg-accent/50">
                          <td className="p-2 font-semibold">{index + 1}</td>
                          <td className="p-2 font-semibold">#{driver.carNumber}</td>
                          <td className="p-2">{driver.races}</td>
                          <td className="p-2">
                            <Badge variant={driver.wins > 0 ? "default" : "outline"}>
                              {driver.wins}
                            </Badge>
                          </td>
                          <td className="p-2">{driver.podiums}</td>
                          <td className="p-2">{driver.averagePosition.toFixed(1)}</td>
                          <td className="p-2">{driver.fastestLaps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle>Performance Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockRaceData.map((race) => ({
                    date: race.date,
                    track: race.trackId,
                    avgLapTime: parseFloat(race.statistics.averageLapTime.replace(":", ".")),
                    completionRate: parseFloat(race.statistics.completionRate),
                    dnfCount: race.statistics.dnfCount,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgLapTime"
                      stroke="#ef4444"
                      name="Avg Lap Time (s)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#3b82f6"
                      name="Completion Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-[#EB0A1E]/10 border border-[#EB0A1E]/20 rounded-lg">
                    <div className="font-semibold mb-2">Most Competitive Race</div>
                    <p className="text-sm text-gray-400">
                      Barber Motorsports Park Race 1 had the closest finish with top 3 within 16.5 seconds
                    </p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="font-semibold mb-2">Best Reliability</div>
                    <p className="text-sm text-gray-400">
                      Sebring International Raceway achieved 100% completion rate with 0 DNFs
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="font-semibold mb-2">Top Performer</div>
                    <p className="text-sm text-gray-400">
                      Car #13 leads with multiple wins and consistent podium finishes
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Average Field Spread</span>
                    <span className="font-semibold">34.0s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Average Completion Rate</span>
                    <span className="font-semibold">93.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Total Race Time</span>
                    <span className="font-semibold">2h 17m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Total Laps</span>
                    <span className="font-semibold">77</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

