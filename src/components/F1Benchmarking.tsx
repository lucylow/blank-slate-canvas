/**
 * F1 Benchmarking Component with Detailed Mock Data
 * Displays comprehensive F1 benchmarking data for strategy comparison
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Flag, 
  Calendar, 
  Award, 
  MapPin, 
  TrendingUp, 
  Clock, 
  Users, 
  Gauge, 
  Zap, 
  Activity,
  BarChart3,
  Target,
  Flame,
  Timer,
  ChevronRight,
  Trophy,
  TrendingDown
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data Types
interface MockF1Race {
  season: string;
  round: string;
  raceName: string;
  circuitName: string;
  location: string;
  country: string;
  date: string;
  winner: string;
  fastestLap: string;
  totalLaps: number;
  raceTime: string;
}

interface MockF1DriverStanding {
  position: number;
  driver: string;
  code: string;
  team: string;
  points: number;
  wins: number;
  podiums: number;
  fastestLaps: number;
  nationality: string;
}

interface MockF1PitStop {
  driver: string;
  code: string;
  lap: number;
  stop: number;
  duration: string;
  tireCompound: string;
  totalStops: number;
}

interface MockF1LapTime {
  lap: number;
  driver: string;
  code: string;
  time: string;
  position: number;
  sector1: string;
  sector2: string;
  sector3: string;
}

interface MockF1TireStrategy {
  driver: string;
  code: string;
  stints: Array<{
    compound: string;
    laps: number;
    avgLapTime: string;
    degradation: number;
  }>;
  totalTime: string;
}

interface MockF1PerformanceMetrics {
  driver: string;
  code: string;
  avgLapTime: string;
  bestLapTime: string;
  consistency: number;
  topSpeed: number;
  avgSpeed: number;
  tireWearRate: number;
  fuelEfficiency: number;
}

// Comprehensive Mock Data
const mockF1Races: MockF1Race[] = [
  {
    season: '2024',
    round: '1',
    raceName: 'Bahrain Grand Prix',
    circuitName: 'Bahrain International Circuit',
    location: 'Sakhir',
    country: 'Bahrain',
    date: '2024-03-02',
    winner: 'Max Verstappen',
    fastestLap: '1:33.007',
    totalLaps: 57,
    raceTime: '1:31:44.742'
  },
  {
    season: '2024',
    round: '2',
    raceName: 'Saudi Arabian Grand Prix',
    circuitName: 'Jeddah Corniche Circuit',
    location: 'Jeddah',
    country: 'Saudi Arabia',
    date: '2024-03-09',
    winner: 'Sergio Pérez',
    fastestLap: '1:30.915',
    totalLaps: 50,
    raceTime: '1:20:14.894'
  },
  {
    season: '2024',
    round: '3',
    raceName: 'Australian Grand Prix',
    circuitName: 'Albert Park Circuit',
    location: 'Melbourne',
    country: 'Australia',
    date: '2024-03-24',
    winner: 'Carlos Sainz',
    fastestLap: '1:19.813',
    totalLaps: 58,
    raceTime: '1:20:26.843'
  },
  {
    season: '2024',
    round: '4',
    raceName: 'Japanese Grand Prix',
    circuitName: 'Suzuka International Racing Course',
    location: 'Suzuka',
    country: 'Japan',
    date: '2024-04-07',
    winner: 'Max Verstappen',
    fastestLap: '1:30.983',
    totalLaps: 53,
    raceTime: '1:54:23.566'
  },
  {
    season: '2024',
    round: '5',
    raceName: 'Chinese Grand Prix',
    circuitName: 'Shanghai International Circuit',
    location: 'Shanghai',
    country: 'China',
    date: '2024-04-21',
    winner: 'Max Verstappen',
    fastestLap: '1:35.808',
    totalLaps: 56,
    raceTime: '1:40:52.554'
  }
];

const mockF1DriverStandings: MockF1DriverStanding[] = [
  {
    position: 1,
    driver: 'Max Verstappen',
    code: 'VER',
    team: 'Red Bull Racing',
    points: 136,
    wins: 4,
    podiums: 5,
    fastestLaps: 3,
    nationality: 'Dutch'
  },
  {
    position: 2,
    driver: 'Sergio Pérez',
    code: 'PER',
    team: 'Red Bull Racing',
    points: 103,
    wins: 1,
    podiums: 4,
    fastestLaps: 1,
    nationality: 'Mexican'
  },
  {
    position: 3,
    driver: 'Charles Leclerc',
    code: 'LEC',
    team: 'Ferrari',
    points: 98,
    wins: 0,
    podiums: 3,
    fastestLaps: 2,
    nationality: 'Monegasque'
  },
  {
    position: 4,
    driver: 'Carlos Sainz',
    code: 'SAI',
    team: 'Ferrari',
    points: 83,
    wins: 1,
    podiums: 3,
    fastestLaps: 1,
    nationality: 'Spanish'
  },
  {
    position: 5,
    driver: 'Lando Norris',
    code: 'NOR',
    team: 'McLaren',
    points: 76,
    wins: 0,
    podiums: 2,
    fastestLaps: 0,
    nationality: 'British'
  },
  {
    position: 6,
    driver: 'George Russell',
    code: 'RUS',
    team: 'Mercedes',
    points: 64,
    wins: 0,
    podiums: 1,
    fastestLaps: 0,
    nationality: 'British'
  },
  {
    position: 7,
    driver: 'Lewis Hamilton',
    code: 'HAM',
    team: 'Mercedes',
    points: 58,
    wins: 0,
    podiums: 1,
    fastestLaps: 0,
    nationality: 'British'
  },
  {
    position: 8,
    driver: 'Oscar Piastri',
    code: 'PIA',
    team: 'McLaren',
    points: 47,
    wins: 0,
    podiums: 1,
    fastestLaps: 0,
    nationality: 'Australian'
  },
  {
    position: 9,
    driver: 'Fernando Alonso',
    code: 'ALO',
    team: 'Aston Martin',
    points: 33,
    wins: 0,
    podiums: 0,
    fastestLaps: 0,
    nationality: 'Spanish'
  },
  {
    position: 10,
    driver: 'Lance Stroll',
    code: 'STR',
    team: 'Aston Martin',
    points: 11,
    wins: 0,
    podiums: 0,
    fastestLaps: 0,
    nationality: 'Canadian'
  }
];

const mockF1PitStops: MockF1PitStop[] = [
  {
    driver: 'Max Verstappen',
    code: 'VER',
    lap: 18,
    stop: 1,
    duration: '2.34',
    tireCompound: 'Hard',
    totalStops: 2
  },
  {
    driver: 'Max Verstappen',
    code: 'VER',
    lap: 38,
    stop: 2,
    duration: '2.41',
    tireCompound: 'Medium',
    totalStops: 2
  },
  {
    driver: 'Sergio Pérez',
    code: 'PER',
    lap: 16,
    stop: 1,
    duration: '2.28',
    tireCompound: 'Hard',
    totalStops: 2
  },
  {
    driver: 'Sergio Pérez',
    code: 'PER',
    lap: 35,
    stop: 2,
    duration: '2.52',
    tireCompound: 'Medium',
    totalStops: 2
  },
  {
    driver: 'Charles Leclerc',
    code: 'LEC',
    lap: 20,
    stop: 1,
    duration: '2.45',
    tireCompound: 'Hard',
    totalStops: 2
  },
  {
    driver: 'Charles Leclerc',
    code: 'LEC',
    lap: 40,
    stop: 2,
    duration: '2.38',
    tireCompound: 'Soft',
    totalStops: 2
  },
  {
    driver: 'Carlos Sainz',
    code: 'SAI',
    lap: 19,
    stop: 1,
    duration: '2.31',
    tireCompound: 'Hard',
    totalStops: 2
  },
  {
    driver: 'Carlos Sainz',
    code: 'SAI',
    lap: 39,
    stop: 2,
    duration: '2.44',
    tireCompound: 'Medium',
    totalStops: 2
  }
];

const mockF1LapTimes: MockF1LapTime[] = [
  { lap: 1, driver: 'Max Verstappen', code: 'VER', time: '1:35.234', position: 1, sector1: '28.456', sector2: '35.123', sector3: '31.655' },
  { lap: 2, driver: 'Max Verstappen', code: 'VER', time: '1:34.891', position: 1, sector1: '28.234', sector2: '34.890', sector3: '31.767' },
  { lap: 3, driver: 'Max Verstappen', code: 'VER', time: '1:34.567', position: 1, sector1: '28.123', sector2: '34.567', sector3: '31.877' },
  { lap: 5, driver: 'Max Verstappen', code: 'VER', time: '1:33.890', position: 1, sector1: '27.890', sector2: '34.234', sector3: '31.766' },
  { lap: 10, driver: 'Max Verstappen', code: 'VER', time: '1:34.123', position: 1, sector1: '28.012', sector2: '34.456', sector3: '31.655' },
  { lap: 1, driver: 'Sergio Pérez', code: 'PER', time: '1:35.567', position: 2, sector1: '28.567', sector2: '35.234', sector3: '31.766' },
  { lap: 2, driver: 'Sergio Pérez', code: 'PER', time: '1:35.123', position: 2, sector1: '28.345', sector2: '35.012', sector3: '31.766' },
  { lap: 3, driver: 'Sergio Pérez', code: 'PER', time: '1:34.890', position: 2, sector1: '28.234', sector2: '34.789', sector3: '31.867' },
  { lap: 1, driver: 'Charles Leclerc', code: 'LEC', time: '1:35.890', position: 3, sector1: '28.678', sector2: '35.456', sector3: '31.756' },
  { lap: 2, driver: 'Charles Leclerc', code: 'LEC', time: '1:35.456', position: 3, sector1: '28.456', sector2: '35.234', sector3: '31.766' }
];

const mockF1TireStrategies: MockF1TireStrategy[] = [
  {
    driver: 'Max Verstappen',
    code: 'VER',
    stints: [
      { compound: 'Soft', laps: 18, avgLapTime: '1:34.234', degradation: 0.12 },
      { compound: 'Hard', laps: 25, avgLapTime: '1:35.456', degradation: 0.08 },
      { compound: 'Medium', laps: 14, avgLapTime: '1:34.567', degradation: 0.15 }
    ],
    totalTime: '1:31:44.742'
  },
  {
    driver: 'Sergio Pérez',
    code: 'PER',
    stints: [
      { compound: 'Soft', laps: 16, avgLapTime: '1:34.567', degradation: 0.14 },
      { compound: 'Hard', laps: 23, avgLapTime: '1:35.789', degradation: 0.09 },
      { compound: 'Medium', laps: 18, avgLapTime: '1:34.890', degradation: 0.16 }
    ],
    totalTime: '1:32:15.234'
  },
  {
    driver: 'Charles Leclerc',
    code: 'LEC',
    stints: [
      { compound: 'Soft', laps: 20, avgLapTime: '1:34.890', degradation: 0.13 },
      { compound: 'Hard', laps: 22, avgLapTime: '1:35.567', degradation: 0.10 },
      { compound: 'Soft', laps: 15, avgLapTime: '1:34.123', degradation: 0.18 }
    ],
    totalTime: '1:32:45.678'
  }
];

const mockF1PerformanceMetrics: MockF1PerformanceMetrics[] = [
  {
    driver: 'Max Verstappen',
    code: 'VER',
    avgLapTime: '1:34.567',
    bestLapTime: '1:33.007',
    consistency: 98.5,
    topSpeed: 342.5,
    avgSpeed: 215.3,
    tireWearRate: 0.12,
    fuelEfficiency: 94.2
  },
  {
    driver: 'Sergio Pérez',
    code: 'PER',
    avgLapTime: '1:35.123',
    bestLapTime: '1:33.456',
    consistency: 97.8,
    topSpeed: 340.2,
    avgSpeed: 214.1,
    tireWearRate: 0.14,
    fuelEfficiency: 93.5
  },
  {
    driver: 'Charles Leclerc',
    code: 'LEC',
    avgLapTime: '1:35.456',
    bestLapTime: '1:33.789',
    consistency: 97.2,
    topSpeed: 338.9,
    avgSpeed: 213.4,
    tireWearRate: 0.15,
    fuelEfficiency: 92.8
  },
  {
    driver: 'Carlos Sainz',
    code: 'SAI',
    avgLapTime: '1:35.789',
    bestLapTime: '1:34.012',
    consistency: 96.9,
    topSpeed: 337.5,
    avgSpeed: 212.8,
    tireWearRate: 0.13,
    fuelEfficiency: 93.1
  }
];

export default function F1Benchmarking() {
  const [selectedRace, setSelectedRace] = useState<MockF1Race>(mockF1Races[0]);
  const [selectedDriver, setSelectedDriver] = useState<string>('VER');

  const getTireColor = (compound: string) => {
    switch (compound.toLowerCase()) {
      case 'soft': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-white border border-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500';
    if (position === 2) return 'bg-gray-300/20 text-gray-600 border-gray-400';
    if (position === 3) return 'bg-orange-500/20 text-orange-600 border-orange-500';
    return 'bg-muted';
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            F1 Benchmarking Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive Formula 1 performance analysis with detailed mock data for strategy comparison
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          Mock Data Mode
        </Badge>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Races</p>
                <p className="text-2xl font-bold">{mockF1Races.length}</p>
              </div>
              <Flag className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drivers Tracked</p>
                <p className="text-2xl font-bold">{mockF1DriverStandings.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Pit Stops</p>
                <p className="text-2xl font-bold">2.1</p>
              </div>
              <Timer className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fastest Lap</p>
                <p className="text-2xl font-bold">1:33.007</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="races" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="races">
            <Calendar className="w-4 h-4 mr-2" />
            Races
          </TabsTrigger>
          <TabsTrigger value="standings">
            <Award className="w-4 h-4 mr-2" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="strategy">
            <TrendingUp className="w-4 h-4 mr-2" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="tires">
            <Flame className="w-4 h-4 mr-2" />
            Tire Analysis
          </TabsTrigger>
        </TabsList>

        {/* Races Tab */}
        <TabsContent value="races" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-500" />
                  2024 F1 Season Races
                </CardTitle>
                <CardDescription>
                  Select a race to view detailed analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockF1Races.map((race, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all ${
                          selectedRace.raceName === race.raceName 
                            ? 'border-orange-500 border-2 bg-orange-500/5' 
                            : 'hover:border-orange-500/50'
                        }`}
                        onClick={() => setSelectedRace(race)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Round {race.round}</Badge>
                                <h3 className="font-semibold text-lg">{race.raceName}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {race.location}, {race.country}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(race.date).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-sm font-medium">{race.circuitName}</p>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  {race.winner}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  FL: {race.fastestLap}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  Race Details
                </CardTitle>
                <CardDescription>
                  {selectedRace.raceName} - Round {selectedRace.round}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Winner</p>
                    <p className="text-xl font-bold">{selectedRace.winner}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Fastest Lap</p>
                    <p className="text-xl font-bold">{selectedRace.fastestLap}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Laps</p>
                    <p className="text-xl font-bold">{selectedRace.totalLaps}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Race Time</p>
                    <p className="text-xl font-bold">{selectedRace.raceTime}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Circuit Information</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Circuit:</span>
                      <span className="font-medium">{selectedRace.circuitName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{selectedRace.location}, {selectedRace.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{new Date(selectedRace.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Standings Tab */}
        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                2024 F1 Driver Championship Standings
              </CardTitle>
              <CardDescription>
                Current championship positions with detailed statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockF1DriverStandings.map((standing) => (
                  <motion.div
                    key={standing.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`border-l-4 ${getPositionColor(standing.position)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              standing.position === 1 ? 'bg-yellow-500 text-white' :
                              standing.position === 2 ? 'bg-gray-300 text-gray-900' :
                              standing.position === 3 ? 'bg-orange-500 text-white' :
                              'bg-muted'
                            }`}>
                              {standing.position}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">
                                  {standing.driver}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {standing.code}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {standing.nationality}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{standing.team}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-orange-500">{standing.points}</p>
                              <p className="text-xs text-muted-foreground">Points</p>
                            </div>
                            <div>
                              <p className="text-xl font-semibold">{standing.wins}</p>
                              <p className="text-xs text-muted-foreground">Wins</p>
                            </div>
                            <div>
                              <p className="text-xl font-semibold">{standing.podiums}</p>
                              <p className="text-xs text-muted-foreground">Podiums</p>
                            </div>
                            <div>
                              <p className="text-xl font-semibold">{standing.fastestLaps}</p>
                              <p className="text-xs text-muted-foreground">FL</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-orange-500" />
                  Pit Stop Analysis
                </CardTitle>
                <CardDescription>
                  Detailed pit stop timing and tire compound changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockF1PitStops.map((pitStop, idx) => (
                    <Card key={idx} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{pitStop.code}</Badge>
                              <span className="font-semibold">{pitStop.driver}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Lap {pitStop.lap}</span>
                              <span>Stop {pitStop.stop}/{pitStop.totalStops}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${getTireColor(pitStop.tireCompound)}`} />
                              <span className="font-medium">{pitStop.tireCompound}</span>
                            </div>
                            <p className="text-lg font-bold text-orange-500">{pitStop.duration}s</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Lap Time Analysis
                </CardTitle>
                <CardDescription>
                  Sector-by-sector lap time breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockF1LapTimes.slice(0, 8).map((lapTime, idx) => (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Lap {lapTime.lap}</Badge>
                            <Badge variant="secondary">{lapTime.code}</Badge>
                            <span className="font-semibold">{lapTime.driver}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{lapTime.time}</p>
                            <p className="text-xs text-muted-foreground">P{lapTime.position}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="p-2 bg-muted/50 rounded text-center">
                            <p className="text-xs text-muted-foreground">S1</p>
                            <p className="text-sm font-semibold">{lapTime.sector1}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded text-center">
                            <p className="text-xs text-muted-foreground">S2</p>
                            <p className="text-sm font-semibold">{lapTime.sector2}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded text-center">
                            <p className="text-xs text-muted-foreground">S3</p>
                            <p className="text-sm font-semibold">{lapTime.sector3}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Performance Metrics Comparison
              </CardTitle>
              <CardDescription>
                Detailed performance analysis across key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockF1PerformanceMetrics.map((metric, idx) => (
                  <Card key={idx} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{metric.code}</Badge>
                            <h3 className="font-bold text-lg">{metric.driver}</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Consistency</p>
                          <p className="text-2xl font-bold text-purple-500">{metric.consistency}%</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Avg Lap Time</p>
                          <p className="font-semibold">{metric.avgLapTime}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Best Lap Time</p>
                          <p className="font-semibold text-green-600">{metric.bestLapTime}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Top Speed</p>
                          <p className="font-semibold">{metric.topSpeed} km/h</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Avg Speed</p>
                          <p className="font-semibold">{metric.avgSpeed} km/h</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Tire Wear Rate</p>
                          <p className="font-semibold">{metric.tireWearRate}/lap</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Fuel Efficiency</p>
                          <p className="font-semibold">{metric.fuelEfficiency}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tire Analysis Tab */}
        <TabsContent value="tires" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Tire Strategy Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive tire compound usage and degradation analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockF1TireStrategies.map((strategy, idx) => (
                  <Card key={idx} className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-lg px-3 py-1">{strategy.code}</Badge>
                          <h3 className="font-bold text-xl">{strategy.driver}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Race Time</p>
                          <p className="text-xl font-bold">{strategy.totalTime}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Stint Breakdown:</p>
                        {strategy.stints.map((stint, stintIdx) => (
                          <div key={stintIdx} className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full ${getTireColor(stint.compound)}`} />
                                <span className="font-semibold">{stint.compound} Compound</span>
                                <Badge variant="secondary">{stint.laps} Laps</Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">Avg: {stint.avgLapTime}</p>
                                <p className="text-xs text-muted-foreground">
                                  Degradation: {stint.degradation.toFixed(2)}s/lap
                                </p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-2 ${getTireColor(stint.compound)}`}
                                    style={{ width: `${(stint.laps / 60) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{stint.laps} laps</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
