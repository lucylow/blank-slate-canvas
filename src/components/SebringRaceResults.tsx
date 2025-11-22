import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, TrendingUp, AlertCircle, Award, Zap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RaceResult {
  position: number;
  car_number: number;
  total_time: string;
  gap_to_leader: string;
  laps_completed: number;
  fastest_lap: string;
  fastest_lap_kph: number;
  fastest_lap_lap: number;
  group: string;
  status: string;
  laps_down?: number;
}

interface RaceResultsData {
  track_id: string;
  track_name: string;
  location: string;
  race_number: number;
  class: string;
  total_participants: number;
  total_laps: number;
  race_duration: string;
  race_date: string;
  results: RaceResult[];
  statistics: {
    fastest_lap_overall: {
      car_number: number;
      lap_time: string;
      kph: number;
      lap: number;
    };
    fastest_lap_among_leaders: {
      car_number: number;
      lap_time: string;
      kph: number;
      lap: number;
    };
    closest_finish: {
      gap: string;
      cars: number[];
    };
    top_5_average_fast_lap: string;
    field_average_fast_lap: string;
    field_spread: string;
    completion_rate: string;
    dnf_count: number;
    legends_drivers: number;
    legends_best_finish: number;
    legends_worst_finish: number;
    legends_average_position: number;
  };
  notable_performances: {
    overachievers: Array<{
      car_number: number;
      position: number;
      fastest_lap_rank: number;
      reason: string;
    }>;
    underachievers: Array<{
      car_number: number;
      position: number;
      fastest_lap_rank: number;
      reason: string;
    }>;
  };
  race_highlights: string[];
}

export default function SebringRaceResults() {
  const [data, setData] = useState<RaceResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullResults, setShowFullResults] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/demo_data/sebring_race_results.json");
        if (!response.ok) {
          throw new Error("Failed to fetch race results");
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading race results...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            {error || "Failed to load race results"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const top10 = data.results.slice(0, 10);
  const displayedResults = showFullResults ? data.results : top10;

  return (
    <div className="space-y-6">
      {/* Race Overview */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {data.track_name} - Race {data.race_number} Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Participants</div>
              <div className="text-2xl font-bold">{data.total_participants}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Laps</div>
              <div className="text-2xl font-bold">{data.total_laps}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Race Duration</div>
              <div className="text-2xl font-bold font-mono">{data.race_duration}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
              <div className="text-2xl font-bold text-primary">{data.statistics.completion_rate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Fastest Laps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Overall Fastest</div>
                <div className="font-bold">Car #{data.statistics.fastest_lap_overall.car_number}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-primary">
                  {data.statistics.fastest_lap_overall.lap_time}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.statistics.fastest_lap_overall.kph} kph
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Among Leaders</div>
                <div className="font-bold">Car #{data.statistics.fastest_lap_among_leaders.car_number}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-bold">
                  {data.statistics.fastest_lap_among_leaders.lap_time}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.statistics.fastest_lap_among_leaders.kph} kph
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Race Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Closest Finish</span>
              <span className="font-bold">{data.statistics.closest_finish.gap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top 5 Avg Fast Lap</span>
              <span className="font-mono">{data.statistics.top_5_average_fast_lap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Field Avg Fast Lap</span>
              <span className="font-mono">{data.statistics.field_average_fast_lap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Field Spread</span>
              <span className="font-mono">{data.statistics.field_spread}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DNFs</span>
              <Badge variant="destructive">{data.statistics.dnf_count}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Race Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Race Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-sm font-semibold">Pos</th>
                  <th className="text-left p-2 text-sm font-semibold">Car #</th>
                  <th className="text-left p-2 text-sm font-semibold">Total Time</th>
                  <th className="text-left p-2 text-sm font-semibold">Gap</th>
                  <th className="text-left p-2 text-sm font-semibold">Laps</th>
                  <th className="text-left p-2 text-sm font-semibold">Fastest Lap</th>
                  <th className="text-left p-2 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedResults.map((result) => (
                  <tr
                    key={result.car_number}
                    className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${
                      result.position <= 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {result.position === 1 && (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        )}
                        {result.position === 2 && (
                          <Trophy className="w-4 h-4 text-gray-400" />
                        )}
                        {result.position === 3 && (
                          <Trophy className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="font-bold">{result.position}</span>
                      </div>
                    </td>
                    <td className="p-2 font-mono font-semibold">#{result.car_number}</td>
                    <td className="p-2 font-mono">{result.total_time}</td>
                    <td className="p-2 font-mono text-muted-foreground">
                      {result.position === 1 ? "--" : `+${result.gap_to_leader}`}
                    </td>
                    <td className="p-2">
                      {result.laps_completed}
                      {result.laps_down && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          -{result.laps_down}
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="font-mono">{result.fastest_lap}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.fastest_lap_kph} kph (Lap {result.fastest_lap_lap})
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={result.status === "Classified" ? "default" : "destructive"}
                      >
                        {result.status}
                      </Badge>
                      {result.group === "Legends" && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Legends
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showFullResults && data.results.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowFullResults(true)}
                className="text-sm text-primary hover:underline"
              >
                Show all {data.results.length} results
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notable Performances */}
      {data.notable_performances.overachievers.length > 0 || data.notable_performances.underachievers.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {data.notable_performances.overachievers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Overachievers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.notable_performances.overachievers.map((perf) => (
                  <div key={perf.car_number} className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold">Car #{perf.car_number}</span>
                      <Badge variant="outline">P{perf.position}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{perf.reason}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.notable_performances.underachievers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Underachievers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.notable_performances.underachievers.map((perf) => (
                  <div key={perf.car_number} className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold">Car #{perf.car_number}</span>
                      <Badge variant="outline">P{perf.position}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{perf.reason}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* Race Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Race Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.race_highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-sm">{highlight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

