import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, TrendingUp, AlertCircle, Award, Zap, Users, BarChart3, Target, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Driver {
  name: string;
  team: string;
  race1_position: number;
  race2_position: number;
  position_change: number;
  best_lap_race1: string;
  best_lap_race2: string;
  points: number;
  wins: number;
  podiums: number;
}

interface Team {
  name: string;
  race1_positions: number[];
  race2_positions: number[];
  best_finish_race1: number;
  best_finish_race2: number;
  drivers: string[];
  points: number;
}

interface RaceSummary {
  race_name: string;
  total_drivers: number;
  dnf_count: number;
  completion_rate: number;
  fastest_lap: string;
  fastest_driver: string;
  winning_team: string;
  winning_driver: string;
  avg_laps: number;
  closest_finish: number;
}

interface AnalysisData {
  race1_summary: RaceSummary;
  race2_summary: RaceSummary;
  team_performance: Team[];
  driver_consistency: Driver[];
  fastest_laps: {
    race_1: { driver: string; time: string; speed: string; lap: number };
    race_2: { driver: string; time: string; speed: string; lap: number };
  };
  team_standings: Array<{ team: string; points: number }>;
  driver_standings: Driver[];
  lap_consistency: {
    most_consistent: string[];
    least_consistent: string[];
  };
  strategy_insights: {
    best_lap_timing: {
      early_race: string[];
      mid_race: string[];
      late_race: string[];
    };
  };
  rivalries: Array<{
    drivers: string[];
    race1_gap: string;
    race2_gap: string;
    avg_gap: string;
    closest_finish: string;
  }>;
  reliability: {
    total_dnfs: { race_1: number; race_2: number; total: number };
    most_reliable_teams: string[];
    least_reliable_teams: string[];
  };
}

export default function IndianapolisRaceResults() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'teams' | 'drivers' | 'analysis'>('overview');

  useEffect(() => {
    // Load Indianapolis race data - this would typically come from an API
    const loadData = async () => {
      try {
        // For now, using mock data based on the structure from the Python code
        // In production, this would fetch from /api/indianapolis/race-analysis
        const mockData: AnalysisData = {
          race1_summary: {
            race_name: "Race 1",
            total_drivers: 35,
            dnf_count: 4,
            completion_rate: 88.6,
            fastest_lap: "1:39.748",
            fastest_driver: "Spike Kohlbecker",
            winning_team: "RVA Graphics Motorsports",
            winning_driver: "Spike Kohlbecker",
            avg_laps: 26,
            closest_finish: 0.170
          },
          race2_summary: {
            race_name: "Race 2",
            total_drivers: 35,
            dnf_count: 5,
            completion_rate: 85.7,
            fastest_lap: "1:40.409",
            fastest_driver: "Spike Kohlbecker",
            winning_team: "BSI Racing",
            winning_driver: "Westin Workman",
            avg_laps: 23,
            closest_finish: 0.156
          },
          team_performance: [
            {
              name: "RVA Graphics Motorsports",
              race1_positions: [1, 2],
              race2_positions: [2, 4],
              best_finish_race1: 1,
              best_finish_race2: 2,
              drivers: ["Spike Kohlbecker", "Will Robusto"],
              points: 45
            },
            {
              name: "BSI Racing",
              race1_positions: [3, 5],
              race2_positions: [1, 3],
              best_finish_race1: 3,
              best_finish_race2: 1,
              drivers: ["Westin Workman", "Jaxon Bell"],
              points: 38
            },
            {
              name: "Copeland Motorsports",
              race1_positions: [4, 7],
              race2_positions: [3, 6],
              best_finish_race1: 4,
              best_finish_race2: 3,
              drivers: ["Jaxon Bell", "Henry Drury"],
              points: 32
            }
          ],
          driver_consistency: [
            {
              name: "Spike Kohlbecker",
              team: "RVA Graphics Motorsports",
              race1_position: 1,
              race2_position: 2,
              position_change: 1,
              best_lap_race1: "1:39.748",
              best_lap_race2: "1:40.409",
              points: 50,
              wins: 1,
              podiums: 2
            },
            {
              name: "Westin Workman",
              team: "BSI Racing",
              race1_position: 3,
              race2_position: 1,
              position_change: -2,
              best_lap_race1: "1:40.305",
              best_lap_race2: "1:40.747",
              points: 48,
              wins: 1,
              podiums: 2
            },
            {
              name: "Will Robusto",
              team: "RVA Graphics Motorsports",
              race1_position: 2,
              race2_position: 4,
              position_change: 2,
              best_lap_race1: "1:40.305",
              best_lap_race2: "1:40.892",
              points: 42,
              wins: 0,
              podiums: 2
            }
          ],
          fastest_laps: {
            race_1: {
              driver: "Spike Kohlbecker",
              time: "1:39.748",
              speed: "141.7 kph",
              lap: 7
            },
            race_2: {
              driver: "Spike Kohlbecker",
              time: "1:40.409",
              speed: "140.7 kph",
              lap: 12
            }
          },
          team_standings: [
            { team: "RVA Graphics Motorsports", points: 45 },
            { team: "BSI Racing", points: 38 },
            { team: "Copeland Motorsports", points: 32 },
            { team: "TechSport", points: 28 },
            { team: "Eagles Canyon Racing", points: 22 }
          ],
          driver_standings: [
            {
              name: "Spike Kohlbecker",
              team: "RVA Graphics Motorsports",
              race1_position: 1,
              race2_position: 2,
              position_change: 1,
              best_lap_race1: "1:39.748",
              best_lap_race2: "1:40.409",
              points: 50,
              wins: 1,
              podiums: 2
            },
            {
              name: "Westin Workman",
              team: "BSI Racing",
              race1_position: 3,
              race2_position: 1,
              position_change: -2,
              best_lap_race1: "1:40.305",
              best_lap_race2: "1:40.747",
              points: 48,
              wins: 1,
              podiums: 2
            }
          ],
          lap_consistency: {
            most_consistent: ["Henry Drury", "Massimo Sunseri", "Will Robusto"],
            least_consistent: ["Ramon Llano", "Tom Rudnai", "Andrew Gilleland"]
          },
          strategy_insights: {
            best_lap_timing: {
              early_race: ["Will Robusto", "Westin Workman"],
              mid_race: ["Spike Kohlbecker", "Max Schweid"],
              late_race: ["Ethan Tovo", "Livio Galanti"]
            }
          },
          rivalries: [
            {
              drivers: ["Spike Kohlbecker", "Westin Workman"],
              race1_gap: "+0.427",
              race2_gap: "+0.156",
              avg_gap: "+0.292",
              closest_finish: "Race 2 (+0.156)"
            }
          ],
          reliability: {
            total_dnfs: { race_1: 4, race_2: 5, total: 9 },
            most_reliable_teams: ["RVA Graphics Motorsports", "BSI Racing", "Copeland Motorsports"],
            least_reliable_teams: ["Nitro Motorsports", "Eagles Canyon Racing", "TechSport"]
          }
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading race analysis...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            {error || "Failed to load race analysis"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Indianapolis Motor Speedway - GR Cup Race Analysis
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('overview')}
            >
              Overview
            </Button>
            <Button
              variant={selectedView === 'teams' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('teams')}
            >
              Team Performance
            </Button>
            <Button
              variant={selectedView === 'drivers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('drivers')}
            >
              Driver Analysis
            </Button>
            <Button
              variant={selectedView === 'analysis' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('analysis')}
            >
              Advanced Analytics
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <>
          {/* Race Summaries */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Race 1 Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Winner</div>
                    <div className="text-xl font-bold">{data.race1_summary.winning_driver}</div>
                    <div className="text-xs text-muted-foreground">{data.race1_summary.winning_team}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fastest Lap</div>
                    <div className="text-xl font-mono font-bold text-primary">
                      {data.race1_summary.fastest_lap}
                    </div>
                    <div className="text-xs text-muted-foreground">{data.race1_summary.fastest_driver}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">Completion</div>
                    <div className="text-lg font-bold">{data.race1_summary.completion_rate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">DNFs</div>
                    <div className="text-lg font-bold text-destructive">{data.race1_summary.dnf_count}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Closest Finish</div>
                    <div className="text-lg font-mono">{data.race1_summary.closest_finish}s</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Race 2 Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Winner</div>
                    <div className="text-xl font-bold">{data.race2_summary.winning_driver}</div>
                    <div className="text-xs text-muted-foreground">{data.race2_summary.winning_team}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fastest Lap</div>
                    <div className="text-xl font-mono font-bold text-primary">
                      {data.race2_summary.fastest_lap}
                    </div>
                    <div className="text-xs text-muted-foreground">{data.race2_summary.fastest_driver}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">Completion</div>
                    <div className="text-lg font-bold">{data.race2_summary.completion_rate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">DNFs</div>
                    <div className="text-lg font-bold text-destructive">{data.race2_summary.dnf_count}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Closest Finish</div>
                    <div className="text-lg font-mono">{data.race2_summary.closest_finish}s</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Championship Standings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Team Championship Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.team_standings.slice(0, 10).map((team, index) => (
                  <div
                    key={team.team}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index < 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-background' :
                        index === 1 ? 'bg-gray-400 text-background' :
                        index === 2 ? 'bg-orange-600 text-background' :
                        'bg-muted'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-semibold">{team.team}</span>
                    </div>
                    <div className="text-xl font-bold text-primary">{team.points} pts</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Driver Championship Standings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Driver Championship Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.driver_standings.slice(0, 10).map((driver, index) => (
                  <div
                    key={driver.name}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index < 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-background' :
                        index === 1 ? 'bg-gray-400 text-background' :
                        index === 2 ? 'bg-orange-600 text-background' :
                        'bg-muted'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">{driver.team}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{driver.points} pts</div>
                      <div className="text-xs text-muted-foreground">
                        {driver.wins}W {driver.podiums}P
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Team Performance View */}
      {selectedView === 'teams' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.team_performance.map((team) => (
            <Card key={team.name}>
              <CardHeader>
                <CardTitle className="text-base">{team.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Race 1 Best</span>
                  <Badge variant="outline">P{team.best_finish_race1}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Race 2 Best</span>
                  <Badge variant="outline">P{team.best_finish_race2}</Badge>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">Drivers</div>
                  <div className="text-sm">{team.drivers.join(', ')}</div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Team Points</span>
                    <span className="text-lg font-bold text-primary">{team.points}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Driver Analysis View */}
      {selectedView === 'drivers' && (
        <>
          {/* Driver Consistency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Driver Position Changes (Race 1 → Race 2)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.driver_consistency.map((driver) => (
                  <div
                    key={driver.name}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold">{driver.name}</div>
                        <div className="text-sm text-muted-foreground">{driver.team}</div>
                      </div>
                      <Badge
                        variant={driver.position_change < 0 ? 'default' : driver.position_change > 0 ? 'destructive' : 'outline'}
                      >
                        {driver.position_change > 0 ? `+${driver.position_change}` : driver.position_change}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Race 1</div>
                        <div className="font-mono">P{driver.race1_position}</div>
                        <div className="text-xs text-muted-foreground mt-1">Best: {driver.best_lap_race1}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Race 2</div>
                        <div className="font-mono">P{driver.race2_position}</div>
                        <div className="text-xs text-muted-foreground mt-1">Best: {driver.best_lap_race2}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lap Consistency */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Most Consistent Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.lap_consistency.most_consistent.map((driver, index) => (
                    <div key={driver} className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                      <span className="font-semibold">{driver}</span>
                      <Badge variant="outline" className="bg-green-500/20">Consistent</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Least Consistent Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.lap_consistency.least_consistent.map((driver) => (
                    <div key={driver} className="flex items-center justify-between p-2 bg-orange-500/10 rounded">
                      <span className="font-semibold">{driver}</span>
                      <Badge variant="outline" className="bg-orange-500/20">Variable</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Advanced Analytics View */}
      {selectedView === 'analysis' && (
        <>
          {/* Fastest Lap Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Fastest Lap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-sm text-muted-foreground mb-2">Race 1 Fastest Lap</div>
                  <div className="text-2xl font-mono font-bold text-primary mb-1">
                    {data.fastest_laps.race_1.time}
                  </div>
                  <div className="font-semibold">{data.fastest_laps.race_1.driver}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {data.fastest_laps.race_1.speed} • Lap {data.fastest_laps.race_1.lap}
                  </div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-sm text-muted-foreground mb-2">Race 2 Fastest Lap</div>
                  <div className="text-2xl font-mono font-bold text-primary mb-1">
                    {data.fastest_laps.race_2.time}
                  </div>
                  <div className="font-semibold">{data.fastest_laps.race_2.driver}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {data.fastest_laps.race_2.speed} • Lap {data.fastest_laps.race_2.lap}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Strategy Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-semibold mb-2 text-blue-500">Early Race Pace</div>
                  <div className="space-y-1">
                    {data.strategy_insights.best_lap_timing.early_race.map((driver) => (
                      <div key={driver} className="text-sm">{driver}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2 text-purple-500">Mid Race Pace</div>
                  <div className="space-y-1">
                    {data.strategy_insights.best_lap_timing.mid_race.map((driver) => (
                      <div key={driver} className="text-sm">{driver}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2 text-orange-500">Late Race Pace</div>
                  <div className="space-y-1">
                    {data.strategy_insights.best_lap_timing.late_race.map((driver) => (
                      <div key={driver} className="text-sm">{driver}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Rivalries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Key Rivalries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.rivalries.map((rivalry, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="font-bold mb-2">{rivalry.drivers.join(' vs ')}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Race 1 Gap</div>
                        <div className="font-mono">{rivalry.race1_gap}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Race 2 Gap</div>
                        <div className="font-mono">{rivalry.race2_gap}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">Closest Finish</div>
                      <div className="text-sm font-semibold">{rivalry.closest_finish}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reliability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                Reliability Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Total DNFs</div>
                  <div className="text-3xl font-bold text-destructive">{data.reliability.total_dnfs.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Race 1: {data.reliability.total_dnfs.race_1} • Race 2: {data.reliability.total_dnfs.race_2}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2 text-green-500">Most Reliable Teams</div>
                  <div className="space-y-1">
                    {data.reliability.most_reliable_teams.map((team) => (
                      <div key={team} className="text-sm">{team}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2 text-red-500">Least Reliable Teams</div>
                  <div className="space-y-1">
                    {data.reliability.least_reliable_teams.map((team) => (
                      <div key={team} className="text-sm">{team}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


