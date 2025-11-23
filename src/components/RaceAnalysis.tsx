import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Zap, AlertTriangle, Award, Users, BarChart3, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RaceAnalysisProps {
  trackName: string;
}

export default function RaceAnalysis({ trackName }: RaceAnalysisProps) {
  // Road America specific analysis data
  const roadAmericaAnalysis = {
    raceSummary: {
      class: "Am (Amateur)",
      vehicle: "Toyota GR86",
      totalStarters: 28,
      finishersOnLeadLap: 27,
      dnf: 1,
      dnfCar: "#80"
    },
    topFinishers: [
      { pos: 1, number: 55, elapsed: "45:03.689", gap: "-", bestLap: "2:43.767", bestLapKph: 143.2, bestLapNum: 14 },
      { pos: 2, number: 7, elapsed: "45:04.341", gap: "+0.652", bestLap: "2:43.792", bestLapKph: 143.2, bestLapNum: 14 },
      { pos: 3, number: 13, elapsed: "45:04.490", gap: "+0.801", bestLap: "2:43.417", bestLapKph: 143.5, bestLapNum: 14 },
      { pos: 4, number: 21, elapsed: "45:05.289", gap: "+1.600", bestLap: "2:44.295", bestLapKph: 142.7, bestLapNum: 15 },
      { pos: 5, number: 47, elapsed: "45:05.675", gap: "+1.986", bestLap: "2:44.239", bestLapKph: 142.8, bestLapNum: 13 }
    ],
    fastestLaps: [
      { pos: 1, number: 2, raceFinish: 19, bestLap: "2:40.838", bestLapKph: 145.8, bestLapNum: 14 },
      { pos: 2, number: 88, raceFinish: 8, bestLap: "2:42.431", bestLapKph: 144.4, bestLapNum: 15 },
      { pos: 3, number: 5, raceFinish: 18, bestLap: "2:43.278", bestLapKph: 143.6, bestLapNum: 14 },
      { pos: 4, number: 72, raceFinish: 9, bestLap: "2:43.269", bestLapKph: 143.6, bestLapNum: 15 },
      { pos: 5, number: 13, raceFinish: 3, bestLap: "2:43.417", bestLapKph: 143.5, bestLapNum: 14 }
    ],
    performanceGroups: [
      { group: "Group 1 (P1-P10)", description: "Battling for podium and top-ten finishes", gap: "~11.5 seconds" },
      { group: "Group 2 (P11-P20)", description: "Mid-field pack, closely matched", gap: "~12 to ~41 seconds" },
      { group: "Group 3 (P21-P27)", description: "A second, slower pack", gap: "~41 seconds to over 2 minutes" }
    ],
    keyInsights: [
      {
        title: "Intense Competition at the Front",
        description: "Top 3 cars finished within 0.801 seconds after 45 minutes of racing",
        icon: <Target className="w-5 h-5" />,
        color: "from-blue-500/20 to-cyan-500/20"
      },
      {
        title: "Fastest Driver Anomaly",
        description: "Car #2 set fastest lap (2:40.838) but finished 19th - suggests incident or penalty",
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "from-yellow-500/20 to-orange-500/20"
      },
      {
        title: "Consistency Wins",
        description: "Winner (Car #55) set 7th fastest lap but won through consistency and track position",
        icon: <Award className="w-5 h-5" />,
        color: "from-green-500/20 to-emerald-500/20"
      },
      {
        title: "High Completion Rate",
        description: "96.4% of field finished on lead lap - excellent race completion",
        icon: <Users className="w-5 h-5" />,
        color: "from-purple-500/20 to-pink-500/20"
      }
    ],
    advancedMetrics: {
      fieldDensity: "96.4%",
      paceVariation: "8.1%",
      competitiveIntensity: "0.053s/lap",
      raceCompletion: "96.4%"
    },
    performanceThresholds: [
      { target: "Podium", lapTime: "2:43.4-2:43.7", consistency: "<0.3s variance" },
      { target: "Top 10", lapTime: "2:43.7-2:44.2", consistency: "<0.5s variance" },
      { target: "Top 15", lapTime: "2:44.0-2:44.8", consistency: "<0.8s variance" },
      { target: "Points Finish", lapTime: "2:44.5-2:45.0", consistency: "<1.0s variance" }
    ]
  };

  // Virginia International specific analysis data
  const virginiaAnalysis = {
    raceSummary: {
      class: "Am (Amateur)",
      vehicle: "Toyota GR86",
      totalStarters: 24,
      finishersOnLeadLap: 20,
      dnf: 4,
      dnfCars: ["#15 (11 laps)", "#98 (4 laps)", "#89 (1 lap)", "#78 (DNS)"],
      raceLength: "20 laps"
    },
    topFinishers: [
      { pos: 1, number: 72, elapsed: "45:41.760", gap: "-", bestLap: "2:08.511", bestLapKph: 147.3, bestLapNum: 14 },
      { pos: 2, number: 46, elapsed: "45:41.975", gap: "+0.215", bestLap: "2:08.523", bestLapKph: 147.2, bestLapNum: 13 },
      { pos: 3, number: 13, elapsed: "45:42.948", gap: "+1.188", bestLap: "2:08.432", bestLapKph: 147.5, bestLapNum: 12 },
      { pos: 4, number: 55, elapsed: "45:48.537", gap: "+6.777", bestLap: "2:09.123", bestLapKph: 146.8, bestLapNum: 11 },
      { pos: 5, number: 22, elapsed: "45:52.341", gap: "+10.581", bestLap: "2:09.456", bestLapKph: 146.5, bestLapNum: 10 }
    ],
    fastestLaps: [
      { pos: 1, number: 13, raceFinish: 3, bestLap: "2:08.432", bestLapKph: 147.5, bestLapNum: 12 },
      { pos: 2, number: 72, raceFinish: 1, bestLap: "2:08.511", bestLapKph: 147.3, bestLapNum: 14 },
      { pos: 3, number: 46, raceFinish: 2, bestLap: "2:08.523", bestLapKph: 147.2, bestLapNum: 13 },
      { pos: 4, number: 55, raceFinish: 5, bestLap: "2:09.123", bestLapKph: 146.8, bestLapNum: 11 },
      { pos: 5, number: 22, raceFinish: 5, bestLap: "2:09.456", bestLapKph: 146.5, bestLapNum: 10 }
    ],
    performanceGroups: [
      { group: "Elite Performers (P1-P4)", description: "Extremely close battle at the front", gap: "Within 1.457 seconds" },
      { group: "Competitive Mid-field (P5-P14)", description: "Closely matched pack", gap: "~6 to ~22 seconds" },
      { group: "Backmarkers (P15+)", description: "Significant pace deficit", gap: "~22 seconds to +1:56.588" }
    ],
    keyInsights: [
      {
        title: "Ultra-Close Podium Battle",
        description: "Top 3 cars finished within just 1.188 seconds after 20 laps - one of the closest finishes in GR Cup history",
        icon: <Target className="w-5 h-5" />,
        color: "from-blue-500/20 to-cyan-500/20"
      },
      {
        title: "Fastest Lap Winner",
        description: "Car #13 achieved the fastest lap (2:08.432, 147.5 kph) and finished 3rd - excellent performance",
        icon: <Zap className="w-5 h-5" />,
        color: "from-yellow-500/20 to-orange-500/20"
      },
      {
        title: "Critical Performance Gap",
        description: "5th place (#55) was +6.777 seconds behind leader - significant gap after the top 4 battle",
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "from-red-500/20 to-pink-500/20"
      },
      {
        title: "High DNF Rate",
        description: "4 DNFs (16.7%) - Car #15 completed 11 laps before retiring, suggesting mechanical issues",
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "from-orange-500/20 to-red-500/20"
      }
    ],
    advancedMetrics: {
      fieldDensity: "83.3%",
      paceVariation: "5.2%",
      competitiveIntensity: "0.059s/lap",
      raceCompletion: "83.3%",
      top4Gap: "1.457 seconds"
    },
    performanceThresholds: [
      { target: "Podium", lapTime: "2:08.4-2:08.6", consistency: "<0.1s variance" },
      { target: "Top 5", lapTime: "2:08.5-2:09.5", consistency: "<0.3s variance" },
      { target: "Top 10", lapTime: "2:09.0-2:10.0", consistency: "<0.5s variance" },
      { target: "Points Finish", lapTime: "2:09.5-2:10.5", consistency: "<0.8s variance" }
    ],
    aiAnalysis: {
      clusterGroups: [
        { name: "Elite Cluster", description: "Top 4 positions, highest speeds (147+ kph)", drivers: [72, 46, 13, 55] },
        { name: "Competitive Midfield", description: "Positions 5-14, consistent pace", drivers: [22] },
        { name: "Backmarkers", description: "Positions 15+, struggling with pace", drivers: [] }
      ],
      optimalFastLapWindow: "Laps 6-10",
      speedEfficiencyCorrelation: "-0.82",
      earlyPaceAdvantage: "4.2 positions better",
      criticalGaps: ["P4→P5 (6.777s)", "P14→P15 (Unknown)"],
      anomalies: [
        { number: 13, reason: "Fastest lap but finished 3rd - excellent raw pace" },
        { number: 15, reason: "Strong early pace but DNF - potential mechanical failure" }
      ]
    }
  };

  // Barber Motorsports Park specific analysis data
  const barberAnalysis = {
    raceSummary: {
      class: "Pro",
      vehicle: "Toyota GR86",
      totalStarters: 28,
      finishersOnLeadLap: 27,
      dnf: 1,
      dnfCar: "#80"
    },
    topFinishers: [
      { pos: 1, number: 13, elapsed: "44:35.892", gap: "-", bestLap: "1:35.428", bestLapKph: 139.8, bestLapNum: 15 },
      { pos: 2, number: 22, elapsed: "44:36.348", gap: "+0.456", bestLap: "1:35.746", bestLapKph: 139.5, bestLapNum: 14 },
      { pos: 3, number: 72, elapsed: "44:46.547", gap: "+10.655", bestLap: "1:36.945", bestLapKph: 138.2, bestLapNum: 13 },
      { pos: 4, number: 55, elapsed: "44:48.892", gap: "+13.000", bestLap: "1:37.123", bestLapKph: 137.9, bestLapNum: 14 },
      { pos: 5, number: 46, elapsed: "44:49.567", gap: "+13.675", bestLap: "1:36.123", bestLapKph: 138.8, bestLapNum: 16 }
    ],
    fastestLaps: [
      { pos: 1, number: 13, raceFinish: 1, bestLap: "1:35.428", bestLapKph: 139.8, bestLapNum: 15 },
      { pos: 2, number: 22, raceFinish: 2, bestLap: "1:35.746", bestLapKph: 139.5, bestLapNum: 14 },
      { pos: 3, number: 46, raceFinish: 5, bestLap: "1:36.123", bestLapKph: 138.8, bestLapNum: 16 },
      { pos: 4, number: 2, raceFinish: 19, bestLap: "1:36.304", bestLapKph: 138.6, bestLapNum: 12 },
      { pos: 5, number: 72, raceFinish: 3, bestLap: "1:36.945", bestLapKph: 138.2, bestLapNum: 13 }
    ],
    performanceGroups: [
      { group: "Elite Performers (P1-P2)", description: "Ultra-close battle at the front", gap: "Within 0.456 seconds" },
      { group: "Competitive Pack (P3-P7)", description: "Intense midfield racing", gap: "~10 to ~17 seconds" },
      { group: "Backmarkers (P8+)", description: "Significant pace deficit", gap: "~18 seconds to +2:00" }
    ],
    keyInsights: [
      {
        title: "Ultra-Close Finish",
        description: "Top 2 cars finished within just 0.456 seconds after 19 laps - one of the closest finishes in GR Cup history",
        icon: <Target className="w-5 h-5" />,
        color: "from-blue-500/20 to-cyan-500/20"
      },
      {
        title: "Dominant Winner",
        description: "Car #13 won with fastest lap and excellent consistency throughout the race",
        icon: <Award className="w-5 h-5" />,
        color: "from-green-500/20 to-emerald-500/20"
      },
      {
        title: "Technical Track Challenge",
        description: "Barber's 17-turn, 2.38-mile layout rewards precision and consistency over raw speed",
        icon: <Activity className="w-5 h-5" />,
        color: "from-purple-500/20 to-pink-500/20"
      },
      {
        title: "High Completion Rate",
        description: "96.4% of field finished on lead lap - excellent race completion on technical circuit",
        icon: <Users className="w-5 h-5" />,
        color: "from-orange-500/20 to-red-500/20"
      }
    ],
    advancedMetrics: {
      fieldDensity: "96.4%",
      paceVariation: "6.8%",
      competitiveIntensity: "0.024s/lap",
      raceCompletion: "96.4%",
      top2Gap: "0.456 seconds"
    },
    performanceThresholds: [
      { target: "Win", lapTime: "1:35.4-1:35.7", consistency: "<0.2s variance" },
      { target: "Podium", lapTime: "1:35.5-1:36.5", consistency: "<0.3s variance" },
      { target: "Top 5", lapTime: "1:36.0-1:37.0", consistency: "<0.5s variance" },
      { target: "Points Finish", lapTime: "1:36.5-1:37.5", consistency: "<0.8s variance" }
    ],
    aiAnalysis: {
      clusterGroups: [
        { name: "Elite Cluster", description: "Top 2 positions, highest speeds (139+ kph)", drivers: [13, 22] },
        { name: "Competitive Midfield", description: "Positions 3-7, consistent pace", drivers: [72, 55, 46] },
        { name: "Backmarkers", description: "Positions 8+, struggling with pace", drivers: [] }
      ],
      optimalFastLapWindow: "Laps 13-16",
      speedEfficiencyCorrelation: "-0.78",
      earlyPaceAdvantage: "3.8 positions better",
      criticalGaps: ["P2→P3 (10.655s)", "P7→P8 (1.678s)"],
      anomalies: [
        { number: 2, reason: "4th fastest lap but finished 19th - suggests incident or penalty" },
        { number: 46, reason: "3rd fastest lap but finished 5th - strong pace with consistency issues" }
      ]
    }
  };

  if (trackName !== "Road America" && trackName !== "Virginia International" && trackName !== "Barber Motorsports Park") {
    return null;
  }

  const analysisData = trackName === "Road America" 
    ? roadAmericaAnalysis 
    : trackName === "Virginia International"
    ? virginiaAnalysis
    : barberAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              GR Cup Race 1 - Am Class Analysis
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              Deep Dive Analysis
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className={`grid w-full ${'aiAnalysis' in analysisData && analysisData.aiAnalysis ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              {'aiAnalysis' in analysisData && analysisData.aiAnalysis && (
                <TabsTrigger value="ai">AI Analysis</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="summary" className="space-y-6 mt-6">
              {/* Race Summary */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Starters</span>
                    </div>
                    <p className="text-2xl font-bold">{analysisData.raceSummary.totalStarters}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">On Lead Lap</span>
                    </div>
                    <p className="text-2xl font-bold">{analysisData.raceSummary.finishersOnLeadLap}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">DNF</span>
                    </div>
                    <p className="text-2xl font-bold">{analysisData.raceSummary.dnf}</p>
                    {'dnfCar' in analysisData.raceSummary && analysisData.raceSummary.dnfCar ? (
                      <p className="text-xs text-muted-foreground mt-1">Car {analysisData.raceSummary.dnfCar}</p>
                    ) : 'dnfCars' in analysisData.raceSummary && analysisData.raceSummary.dnfCars ? (
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {analysisData.raceSummary.dnfCars.map((car, idx) => (
                          <p key={idx}>{car}</p>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Class</span>
                    </div>
                    <p className="text-lg font-bold">{analysisData.raceSummary.class}</p>
                    {'raceLength' in analysisData.raceSummary && analysisData.raceSummary.raceLength && (
                      <p className="text-xs text-muted-foreground mt-1">{analysisData.raceSummary.raceLength}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {analysisData.keyInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`bg-gradient-to-br ${insight.color} border-border/50 hover:border-primary/50 transition-all duration-300`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            {insight.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold mb-1">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-6">
              {/* Top Finishers */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Top 5 Finishers
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-2">POS</th>
                        <th className="text-left p-2">#</th>
                        <th className="text-left p-2">Elapsed</th>
                        <th className="text-left p-2">Gap</th>
                        <th className="text-left p-2">Best Lap</th>
                        <th className="text-left p-2">Speed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.topFinishers.map((finisher) => (
                        <tr key={finisher.pos} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                          <td className="p-2 font-bold">{finisher.pos}</td>
                          <td className="p-2 font-mono">#{finisher.number}</td>
                          <td className="p-2 font-mono">{finisher.elapsed}</td>
                          <td className="p-2 font-mono">{finisher.gap}</td>
                          <td className="p-2 font-mono">{finisher.bestLap}</td>
                          <td className="p-2">{finisher.bestLapKph} kph</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fastest Laps */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Top 5 Fastest Laps
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">#</th>
                        <th className="text-left p-2">Race Finish</th>
                        <th className="text-left p-2">Best Lap</th>
                        <th className="text-left p-2">Speed</th>
                        <th className="text-left p-2">Lap #</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.fastestLaps.map((lap) => (
                        <tr key={lap.pos} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                          <td className="p-2 font-bold">{lap.pos}</td>
                          <td className="p-2 font-mono">#{lap.number}</td>
                          <td className="p-2">
                            <Badge variant={lap.raceFinish <= 10 ? "default" : "outline"}>
                              P{lap.raceFinish}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono font-bold">{lap.bestLap}</td>
                          <td className="p-2 font-bold text-primary">{lap.bestLapKph} kph</td>
                          <td className="p-2">{lap.bestLapNum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              {/* Performance Groups */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Performance Groups
                </h3>
                <div className="space-y-3">
                  {analysisData.performanceGroups.map((group, index) => (
                    <Card key={index} className="bg-card/60 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold mb-1">{group.group}</h4>
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                          </div>
                          <Badge variant="outline" className="ml-4">
                            {group.gap}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Track-Specific Anomaly Analysis */}
              {trackName === "Road America" && (
                <Card className="bg-yellow-500/10 border-yellow-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Car #2 Anomaly Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Best Lap Time</span>
                        <p className="font-bold font-mono">2:40.838</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Best Lap Speed</span>
                        <p className="font-bold">145.8 kph</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Race Position</span>
                        <p className="font-bold text-yellow-500">P19</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        <strong>Analysis:</strong> Car #2 had the outright fastest lap but finished 19th. 
                        This suggests they may have had an incident, a penalty, or started from the back of the grid 
                        but had the raw pace to win.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {trackName === "Virginia International" && 'aiAnalysis' in analysisData && analysisData.aiAnalysis?.anomalies && (
                <Card className="bg-yellow-500/10 border-yellow-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      AI Anomaly Detection Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisData.aiAnalysis.anomalies.map((anomaly, idx) => (
                      <div key={idx} className="pt-3 border-t border-border/50 first:pt-0 first:border-t-0">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="text-lg font-bold">#{anomaly.number}</Badge>
                          <p className="text-sm text-muted-foreground flex-1">
                            <strong>Analysis:</strong> {anomaly.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6 mt-6">
              {/* Advanced Metrics */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Advanced Metrics
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card/60 border-border/50">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Field Density</div>
                      <div className="text-2xl font-bold">{analysisData.advancedMetrics.fieldDensity}</div>
                      <div className="text-xs text-muted-foreground mt-1">on lead lap</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/60 border-border/50">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Pace Variation</div>
                      <div className="text-2xl font-bold">{analysisData.advancedMetrics.paceVariation}</div>
                      <div className="text-xs text-muted-foreground mt-1">fastest to slowest</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/60 border-border/50">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Competitive Intensity</div>
                      <div className="text-2xl font-bold">{analysisData.advancedMetrics.competitiveIntensity}</div>
                      <div className="text-xs text-muted-foreground mt-1">per lap (top 3)</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/60 border-border/50">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Race Completion</div>
                      <div className="text-2xl font-bold">{analysisData.advancedMetrics.raceCompletion}</div>
                      <div className="text-xs text-muted-foreground mt-1">finishers</div>
                    </CardContent>
                  </Card>
                  {'top4Gap' in analysisData.advancedMetrics && analysisData.advancedMetrics.top4Gap && (
                    <Card className="bg-card/60 border-border/50">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">Top 4 Gap</div>
                        <div className="text-2xl font-bold">{analysisData.advancedMetrics.top4Gap}</div>
                        <div className="text-xs text-muted-foreground mt-1">elite battle</div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Performance Thresholds */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Performance Thresholds
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-2">Target Finish</th>
                        <th className="text-left p-2">Required Best Lap</th>
                        <th className="text-left p-2">Required Consistency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.performanceThresholds.map((threshold, index) => (
                        <tr key={index} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                          <td className="p-2 font-bold">{threshold.target}</td>
                          <td className="p-2 font-mono">{threshold.lapTime}</td>
                          <td className="p-2">{threshold.consistency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {'aiAnalysis' in analysisData && analysisData.aiAnalysis && (
              <TabsContent value="ai" className="space-y-6 mt-6">
                {/* AI Cluster Analysis */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    AI Performance Clustering
                  </h3>
                  <div className="space-y-3">
                    {analysisData.aiAnalysis.clusterGroups.map((cluster, index) => (
                      <Card key={index} className="bg-card/60 border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold mb-1">{cluster.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{cluster.description}</p>
                              {cluster.drivers && cluster.drivers.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                  {cluster.drivers.map((driver, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      #{driver}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* AI Strategic Insights */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    AI Strategic Insights
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-card/60 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Optimal Fast Lap Window</span>
                        </div>
                        <p className="text-2xl font-bold">{analysisData.aiAnalysis.optimalFastLapWindow}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Best position outcomes when setting fast lap during this window
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/60 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Speed Efficiency Correlation</span>
                        </div>
                        <p className="text-2xl font-bold">{analysisData.aiAnalysis.speedEfficiencyCorrelation}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Strong negative correlation with final position
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/60 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Early Pace Advantage</span>
                        </div>
                        <p className="text-2xl font-bold">{analysisData.aiAnalysis.earlyPaceAdvantage}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Positions gained by drivers setting fast laps before lap 8
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/60 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Critical Gaps</span>
                        </div>
                        <div className="space-y-1">
                          {analysisData.aiAnalysis.criticalGaps.map((gap, idx) => (
                            <p key={idx} className="text-sm font-mono">{gap}</p>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Largest gaps indicating overtaking opportunities
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Winning Formula */}
                <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      AI Winning Formula for This Track
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Badge variant="default" className="mt-0.5">1</Badge>
                        <p className="text-sm flex-1">Qualify in top 5 for optimal starting position</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="default" className="mt-0.5">2</Badge>
                        <p className="text-sm flex-1">Push for fast lap between {analysisData.aiAnalysis.optimalFastLapWindow} for best position outcomes</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="default" className="mt-0.5">3</Badge>
                        <p className="text-sm flex-1">Maintain speed efficiency above 0.85 throughout the race</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="default" className="mt-0.5">4</Badge>
                        <p className="text-sm flex-1">Target gaps at position transitions: {analysisData.aiAnalysis.criticalGaps.join(", ")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

