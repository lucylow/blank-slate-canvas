import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Award, Zap, Users, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Data based on road_america_analysis_report.txt
const RACE_1_DATA = {
  track_name: "Road America",
  location: "Elkhart Lake, Wisconsin",
  race_number: 1,
  total_participants: 28,
  total_laps: 15,
  race_duration: "45:03.689",
  race_date: "November 20, 2025",
  winner: { car_number: 55, time: "45:03.689" },
  podium: [
    { car_number: 55, gap: "0.000s", position: 1 },
    { car_number: 7, gap: "+0.652s", position: 2 },
    { car_number: 13, gap: "+0.801s", position: 3 },
  ],
  fastest_lap: { car_number: 55, time: "2:43.767", kph: 143.2 },
  weather: {
    air_temp: "21.6°C",
    track_temp: "24.7°C",
    humidity: "94.4%",
    conditions: "Cool and humid - good for engine power, challenging for grip"
  },
  statistics: {
    sector_data_laps: 415,
    top_9_within: "6 seconds",
    photo_finish: "Top 3 within 0.8 seconds"
  },
  highlights: [
    "Incredibly close finish with top 3 separated by less than a second",
    "Deep competitive field - top 9 drivers within 6 seconds",
    "Car #55 dominated with both victory and fastest lap",
    "High humidity conditions affected grip levels throughout the race"
  ]
};

const RACE_2_DATA = {
  track_name: "Road America",
  location: "Elkhart Lake, Wisconsin",
  race_number: 2,
  total_participants: 28,
  total_laps: 15,
  race_duration: "45:10.035",
  race_date: "November 20, 2025",
  winner: { car_number: 13, time: "45:10.035" },
  podium: [
    { car_number: 13, gap: "0.000s", position: 1 },
    { car_number: 22, gap: "+1.321s", position: 2 },
    { car_number: 7, gap: "+1.733s", position: 3 },
  ],
  fastest_lap: { car_number: 22, time: "2:43.342", kph: 143.6 },
  weather: {
    air_temp: "22.5°C",
    track_temp: "26.9°C",
    humidity: "93.8%",
    conditions: "Slightly warmer - changed track grip characteristics"
  },
  statistics: {
    sector_data_laps: 414,
    lap_records: 221,
    unique_vehicles: 28
  },
  highlights: [
    "Car #13 improved from P3 in Race 1 to victory in Race 2",
    "Car #22 set fastest lap and improved from P7 to P2",
    "Demonstrates importance of post-race analysis and setup adjustments",
    "Slightly warmer conditions favored drivers who adapted their style"
  ]
};

export default function RoadAmericaRaceResults() {
  const [selectedRace, setSelectedRace] = useState<1 | 2>(1);
  const data = selectedRace === 1 ? RACE_1_DATA : RACE_2_DATA;

  return (
    <div className="space-y-6">
      {/* Race Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={selectedRace === 1 ? "default" : "outline"}
              onClick={() => setSelectedRace(1)}
              className="flex-1"
            >
              Race 1
            </Button>
            <Button
              variant={selectedRace === 2 ? "default" : "outline"}
              onClick={() => setSelectedRace(2)}
              className="flex-1"
            >
              Race 2
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Race Overview */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {data.track_name} - Race {data.race_number} Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              <div className="text-sm text-muted-foreground">Winner</div>
              <div className="text-2xl font-bold text-primary">#{data.winner.car_number}</div>
            </div>
          </div>

          {/* Podium */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {data.podium.map((driver) => (
              <div
                key={driver.car_number}
                className={`p-4 rounded-lg border-2 ${
                  driver.position === 1
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : driver.position === 2
                    ? "bg-gray-400/10 border-gray-400/30"
                    : "bg-orange-600/10 border-orange-600/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy
                    className={`w-5 h-5 ${
                      driver.position === 1
                        ? "text-yellow-500"
                        : driver.position === 2
                        ? "text-gray-400"
                        : "text-orange-600"
                    }`}
                  />
                  <span className="font-bold text-lg">P{driver.position}</span>
                </div>
                <div className="text-2xl font-bold mb-1">#{driver.car_number}</div>
                <div className="text-sm text-muted-foreground">{driver.gap}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Fastest Lap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Overall Fastest</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold">Car #{data.fastest_lap.car_number}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {data.fastest_lap.time}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.fastest_lap.kph} kph
                  </div>
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
            {selectedRace === 1 ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sector Data Laps</span>
                  <span className="font-bold">{data.statistics.sector_data_laps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top 9 Within</span>
                  <span className="font-mono">{data.statistics.top_9_within}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photo Finish</span>
                  <Badge variant="default">{data.statistics.photo_finish}</Badge>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sector Data Laps</span>
                  <span className="font-bold">{data.statistics.sector_data_laps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lap Records</span>
                  <span className="font-bold">{data.statistics.lap_records}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unique Vehicles</span>
                  <span className="font-bold">{data.statistics.unique_vehicles}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weather Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-primary" />
            Weather Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Air Temperature</div>
              <div className="text-lg font-bold">{data.weather.air_temp}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Track Temperature</div>
              <div className="text-lg font-bold">{data.weather.track_temp}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Humidity</div>
              <div className="text-lg font-bold">{data.weather.humidity}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg col-span-2 md:col-span-1">
              <div className="text-xs text-muted-foreground mb-1">Conditions</div>
              <div className="text-xs">{data.weather.conditions}</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            {data.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-sm">{highlight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-card/50 rounded-lg">
              <div className="font-semibold mb-1">The Power of the Draft</div>
              <div className="text-sm text-muted-foreground">
                Road America's long straights made the slipstream effect crucial, keeping the field bunched up and enabling overtaking maneuvers.
              </div>
            </div>
            <div className="p-3 bg-card/50 rounded-lg">
              <div className="font-semibold mb-1">Adaptation is Key</div>
              <div className="text-sm text-muted-foreground">
                {selectedRace === 1 
                  ? "The close competition shows that consistent race pace is more valuable than a single fast lap."
                  : "Car #13's improvement from P3 to victory demonstrates the importance of post-race analysis and effective setup changes."}
              </div>
            </div>
            <div className="p-3 bg-card/50 rounded-lg">
              <div className="font-semibold mb-1">Consistency Over Speed</div>
              <div className="text-sm text-muted-foreground">
                {selectedRace === 2 && "Car #22 had the fastest lap but finished P2, reinforcing that consistent, competitive race pace is more important than one blistering lap."}
                {selectedRace === 1 && "While Car #55 won with the fastest lap, the top 9 being within 6 seconds shows the importance of consistency."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

