/**
 * F1 Benchmarking Component
 * Displays F1 data from free APIs (Ergast, OpenF1) for strategy comparison
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flag, Calendar, Award, MapPin, TrendingUp, Clock, Users } from 'lucide-react';
import {
  getCurrentF1Season,
  getF1StrategyComparison,
  getF1DriverStandings,
  getF1Circuits,
  type F1Race,
  type F1DriverStanding
} from '@/api/f1Benchmarking';

export default function F1Benchmarking() {
  const [selectedYear] = useState(2024);
  const [selectedRound] = useState(1);

  // Fetch current F1 season
  const { data: seasonData, isLoading: seasonLoading } = useQuery({
    queryKey: ['f1-season-current'],
    queryFn: getCurrentF1Season,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch strategy comparison
  const { data: strategyData, isLoading: strategyLoading } = useQuery({
    queryKey: ['f1-strategy-comparison', selectedYear, selectedRound],
    queryFn: () => getF1StrategyComparison(selectedYear, selectedRound, 'pit_stops'),
    enabled: !!selectedYear && !!selectedRound,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch driver standings
  const { data: standingsData, isLoading: standingsLoading } = useQuery({
    queryKey: ['f1-driver-standings', selectedYear],
    queryFn: () => getF1DriverStandings(selectedYear),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch circuits
  const { data: circuitsData, isLoading: circuitsLoading } = useQuery({
    queryKey: ['f1-circuits'],
    queryFn: getF1Circuits,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">F1 Benchmarking</h1>
          <p className="text-muted-foreground">
            Compare GR Cup strategies with Formula 1 historical data (Free APIs - No API Keys Required)
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Free APIs: Ergast, OpenF1
        </Badge>
      </div>

      <Tabs defaultValue="season" className="space-y-4">
        <TabsList>
          <TabsTrigger value="season">
            <Calendar className="w-4 h-4 mr-2" />
            Season Calendar
          </TabsTrigger>
          <TabsTrigger value="strategy">
            <TrendingUp className="w-4 h-4 mr-2" />
            Strategy Comparison
          </TabsTrigger>
          <TabsTrigger value="standings">
            <Award className="w-4 h-4 mr-2" />
            Driver Standings
          </TabsTrigger>
          <TabsTrigger value="circuits">
            <MapPin className="w-4 h-4 mr-2" />
            Circuits
          </TabsTrigger>
        </TabsList>

        {/* Season Calendar Tab */}
        <TabsContent value="season" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Current F1 Season Calendar
              </CardTitle>
              <CardDescription>
                Upcoming and completed races for benchmarking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {seasonLoading ? (
                <div className="text-center py-8">Loading season calendar...</div>
              ) : seasonData?.data && seasonData.data.length > 0 ? (
                <div className="space-y-4">
                  {seasonData.data.map((race: F1Race) => (
                    <Card key={`${race.season}-${race.round}`} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Round {race.round}</Badge>
                              <h3 className="font-semibold text-lg">{race.raceName}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(race.date).toLocaleDateString()}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {race.Circuit.circuitName}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No season data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Comparison Tab */}
        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pit Stop Strategy Comparison
              </CardTitle>
              <CardDescription>
                Compare F1 pit stop strategies with GR Cup patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategyLoading ? (
                <div className="text-center py-8">Loading strategy data...</div>
              ) : strategyData?.pit_stops && strategyData.pit_stops.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {strategyData.race?.raceName || 'Race'} - Round {selectedRound}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Use Case: {strategyData.use_case?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Pit Stops:</h4>
                    {strategyData.pit_stops.map((pitStop, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">Driver {pitStop.driverId}</span>
                          <p className="text-sm text-muted-foreground">
                            Lap {pitStop.lap} • Stop {pitStop.stop}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{pitStop.duration}s</p>
                          <p className="text-xs text-muted-foreground">{pitStop.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No strategy data available. Try selecting a different race.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Driver Standings Tab */}
        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Driver Championship Standings {selectedYear}
              </CardTitle>
              <CardDescription>
                Current F1 driver standings for performance comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {standingsLoading ? (
                <div className="text-center py-8">Loading standings...</div>
              ) : standingsData?.data && standingsData.data.length > 0 ? (
                <div className="space-y-2">
                  {standingsData.data.map((standing: F1DriverStanding) => (
                    <div
                      key={standing.Driver.driverId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {standing.position}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {standing.Driver.givenName} {standing.Driver.familyName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {standing.Constructors[0]?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{standing.points}</p>
                        <p className="text-xs text-muted-foreground">
                          {standing.wins} {parseInt(standing.wins) === 1 ? 'win' : 'wins'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No standings data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Circuits Tab */}
        <TabsContent value="circuits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                F1 Circuits
              </CardTitle>
              <CardDescription>
                Compare F1 circuits with GR Cup tracks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {circuitsLoading ? (
                <div className="text-center py-8">Loading circuits...</div>
              ) : circuitsData?.data && circuitsData.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {circuitsData.data.map((circuit) => (
                    <Card key={circuit.circuitId} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <h4 className="font-semibold mb-1">{circuit.circuitName}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {circuit.Location.locality}, {circuit.Location.country}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {circuit.circuitId}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No circuits data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

