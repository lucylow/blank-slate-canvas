import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Zap, 
  Gauge, 
  Weight, 
  TrendingUp, 
  Users,
  Target,
  Award,
  Flag,
  Activity,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { grCars } from '@/lib/grCarData';
import { DRIVER_PROFILES, type DriverProfile } from '@/lib/driverProfiles';
import { TopNav } from '@/components/layout/TopNav';

// Extended driver profiles with championship data
interface ExtendedDriverProfile extends DriverProfile {
  wins?: number;
  podiums?: number;
  fastestLaps?: number;
  championshipPoints?: number;
  bestTrack?: string;
  drivingStyle?: string;
  bio?: string;
}

// Add championship drivers
const championshipDrivers: ExtendedDriverProfile[] = [
  {
    carNumber: '50',
    chassisNumber: 'GR86-005-50',
    vehicleId: 'GR86-005-50',
    vehicleNumber: 50,
    carType: 'supra',
    driverName: 'Westin Workman',
    team: 'BSI Racing',
    position: 1,
    gapToLeader: 0,
    lastLapTime: 99.234,
    bestLapTime: 99.123,
    consistency: 99.85,
    nationality: 'USA',
    wins: 6,
    podiums: 12,
    fastestLaps: 8,
    championshipPoints: 264,
    bestTrack: 'Indianapolis Motor Speedway',
    drivingStyle: 'Consistent, strategic, excellent tire management',
    bio: '2025 GR Cup Champion. Known for exceptional consistency and strategic race management. Won championship with 264 points through consistent podium finishes.'
  },
  {
    carNumber: '46',
    chassisNumber: 'GR86-010-46',
    vehicleId: 'GR86-010-46',
    vehicleNumber: 46,
    carType: 'supra',
    driverName: 'Spike Kohlbecker',
    team: 'RVA Graphics Motorsports',
    position: 2,
    gapToLeader: 0.156,
    lastLapTime: 99.748,
    bestLapTime: 99.748,
    consistency: 99.65,
    nationality: 'USA',
    wins: 4,
    podiums: 10,
    fastestLaps: 12,
    championshipPoints: 155,
    bestTrack: 'Indianapolis Motor Speedway',
    drivingStyle: 'Aggressive, fast qualifier, excellent race starts',
    bio: 'Fastest lap record holder at Indianapolis (1:39.748). Strong early race pace and qualifying performance. Won Race 1 at Indianapolis with dominant performance.'
  }
];

// Combine all drivers
const allDrivers: ExtendedDriverProfile[] = [
  ...championshipDrivers,
  ...DRIVER_PROFILES.map(d => ({
    ...d,
    wins: Math.floor(Math.random() * 3),
    podiums: Math.floor(Math.random() * 8),
    fastestLaps: Math.floor(Math.random() * 5),
    championshipPoints: Math.floor(Math.random() * 100),
    bestTrack: ['COTA', 'Barber', 'Sebring', 'Sonoma', 'VIR', 'Road America', 'Indianapolis'][Math.floor(Math.random() * 7)],
    drivingStyle: ['Smooth and consistent', 'Aggressive late braking', 'Technical precision', 'Momentum conservation'][Math.floor(Math.random() * 4)],
    bio: `Competitive driver in the GR Cup series with strong performance across multiple tracks.`
  }))
];

const GRCarsAndDrivers: React.FC = () => {
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const getCarIcon = (model: string) => {
    switch (model) {
      case 'GR Supra':
        return '🏎️';
      case 'GR Yaris':
        return '🚗';
      case 'GR86':
        return '🏁';
      case 'GR Corolla':
        return '⚡';
      default:
        return '🚙';
    }
  };

  const getCarColor = (model: string) => {
    switch (model) {
      case 'GR Supra':
        return 'from-red-500/20 to-orange-500/20 border-red-500/30';
      case 'GR Yaris':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'GR86':
        return 'from-primary/20 to-primary/30 border-primary/40';
      case 'GR Corolla':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      default:
        return 'from-gray-500/20 to-gray-500/20 border-gray-500/30';
    }
  };

  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 99.5) return 'text-green-500';
    if (consistency >= 99.0) return 'text-blue-500';
    if (consistency >= 98.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const driversByCar = (carType: string) => {
    return allDrivers.filter(d => d.carType === carType);
  };

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <TopNav />
      
      <section className="max-w-6xl mx-auto py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <Car className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Toyota GR Cup
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              GR Toyota Cars & Driver Profiles
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive specifications, performance data, and driver profiles for the Toyota GR Cup series.
              Explore the four GR models and meet the drivers competing in North America's premier racing series.
            </p>
          </div>

          <Tabs defaultValue="cars" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="cars" className="text-lg">
                <Car className="w-5 h-5 mr-2" />
                GR Car Specifications
              </TabsTrigger>
              <TabsTrigger value="drivers" className="text-lg">
                <Users className="w-5 h-5 mr-2" />
                Driver Profiles
              </TabsTrigger>
            </TabsList>

            {/* GR Car Specifications Tab */}
            <TabsContent value="cars" className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {grCars.map((car, index) => (
                  <motion.div
                    key={car.model}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 bg-gradient-to-br ${getCarColor(car.model)} cursor-pointer`}
                      onClick={() => setSelectedCar(selectedCar === car.model ? null : car.model)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-3xl">{getCarIcon(car.model)}</span>
                            {car.model}
                          </CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">{car.notes.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              Engine
                            </span>
                            <span className="text-sm font-semibold">{car.engine}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Drivetrain</span>
                            <Badge variant="outline" className={car.drivetrain === "AWD" ? "border-green-500/50 text-green-700 dark:text-green-400" : ""}>
                              {car.drivetrain}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Power
                            </span>
                            <span className="text-sm font-semibold">{car.power_hp} hp</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              Torque
                            </span>
                            <span className="text-sm font-semibold">{car.torque_nm} Nm</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Weight className="w-3 h-3" />
                              Weight
                            </span>
                            <span className="text-sm font-semibold">{car.weight_kg} kg</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">P/W Ratio</span>
                            <span className="text-sm font-semibold text-primary">
                              {(car.power_hp / car.weight_kg).toFixed(3)} hp/kg
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">0-100 km/h</span>
                            <span className="text-sm font-semibold">{car.accel_0_100}s</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Transmission</span>
                            <span className="text-sm font-semibold">{car.transmission}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground italic">{car.advantages}</p>
                        </div>
                        {selectedCar === car.model && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-4 border-t border-border/50 mt-4"
                          >
                            <p className="text-xs font-semibold mb-2 text-muted-foreground">Best Tracks:</p>
                            <div className="flex flex-wrap gap-1">
                              {car.notes.best_tracks.map((track, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {track.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Detailed Comparison Table */}
              <Card className="bg-card/60 backdrop-blur-md border-border/50 mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Complete Specifications Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left p-3 font-semibold">Model</th>
                          <th className="text-left p-3 font-semibold">Engine</th>
                          <th className="text-left p-3 font-semibold">Power (hp)</th>
                          <th className="text-left p-3 font-semibold">Torque (Nm)</th>
                          <th className="text-left p-3 font-semibold">Weight (kg)</th>
                          <th className="text-left p-3 font-semibold">P/W Ratio</th>
                          <th className="text-left p-3 font-semibold">0-100 km/h</th>
                          <th className="text-left p-3 font-semibold">Drivetrain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grCars.map((car) => (
                          <tr key={car.model} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                            <td className="p-3 font-medium">{car.model}</td>
                            <td className="p-3">{car.engine}</td>
                            <td className="p-3">{car.power_hp}</td>
                            <td className="p-3">{car.torque_nm}</td>
                            <td className="p-3">{car.weight_kg}</td>
                            <td className="p-3 font-semibold text-primary">{(car.power_hp / car.weight_kg).toFixed(3)}</td>
                            <td className="p-3">{car.accel_0_100}s</td>
                            <td className="p-3">
                              <Badge variant="outline">{car.drivetrain}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Driver Profiles Tab */}
            <TabsContent value="drivers" className="space-y-8">
              {/* Championship Leaders */}
              <div>
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  Championship Leaders
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {championshipDrivers.map((driver, index) => (
                    <motion.div
                      key={driver.vehicleNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl flex items-center gap-3">
                              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/50">
                                #{driver.carNumber}
                              </div>
                              <div>
                                <div className="font-bold">{driver.driverName}</div>
                                <div className="text-sm text-muted-foreground font-normal">{driver.team}</div>
                              </div>
                            </CardTitle>
                            {driver.championshipPoints && (
                              <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
                                {driver.championshipPoints} pts
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-card/50 rounded-lg">
                              <div className="text-2xl font-bold text-primary">{driver.wins}</div>
                              <div className="text-xs text-muted-foreground">Wins</div>
                            </div>
                            <div className="text-center p-3 bg-card/50 rounded-lg">
                              <div className="text-2xl font-bold text-primary">{driver.podiums}</div>
                              <div className="text-xs text-muted-foreground">Podiums</div>
                            </div>
                            <div className="text-center p-3 bg-card/50 rounded-lg">
                              <div className="text-2xl font-bold text-primary">{driver.fastestLaps}</div>
                              <div className="text-xs text-muted-foreground">Fastest Laps</div>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Consistency</span>
                              <span className={`text-sm font-semibold ${getConsistencyColor(driver.consistency || 0)}`}>
                                {driver.consistency?.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Best Track</span>
                              <span className="text-sm font-semibold">{driver.bestTrack}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Car</span>
                              <Badge variant="outline">{driver.carType?.toUpperCase() || 'GR86'}</Badge>
                            </div>
                          </div>
                          {driver.bio && (
                            <p className="text-sm text-muted-foreground pt-2 border-t border-border/50 italic">
                              {driver.bio}
                            </p>
                          )}
                          {driver.drivingStyle && (
                            <div className="pt-2">
                              <p className="text-xs text-muted-foreground mb-1">Driving Style:</p>
                              <p className="text-sm font-medium">{driver.drivingStyle}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* All Drivers by Car Type */}
              <div>
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  All Drivers
                </h2>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">All Drivers</TabsTrigger>
                    <TabsTrigger value="supra">GR Supra</TabsTrigger>
                    <TabsTrigger value="yaris">GR Yaris</TabsTrigger>
                    <TabsTrigger value="gr86">GR86</TabsTrigger>
                    <TabsTrigger value="corolla">GR Corolla</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allDrivers
                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                        .map((driver, index) => (
                          <motion.div
                            key={driver.vehicleNumber}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card 
                              className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-border/50"
                              onClick={() => setSelectedDriver(selectedDriver === driver.vehicleNumber.toString() ? null : driver.vehicleNumber.toString())}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                      #{driver.carNumber}
                                    </div>
                                    <div>
                                      <div className="font-bold">{driver.driverName}</div>
                                      <div className="text-xs text-muted-foreground font-normal">{driver.team}</div>
                                    </div>
                                  </CardTitle>
                                  <Badge variant="outline" className="text-xs">
                                    {driver.carType?.toUpperCase() || 'GR86'}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Position:</span>
                                    <span className="font-semibold ml-1">P{driver.position}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Gap:</span>
                                    <span className="font-semibold ml-1">{driver.gapToLeader.toFixed(3)}s</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Best Lap:</span>
                                    <span className="font-semibold ml-1">{driver.bestLapTime.toFixed(3)}s</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Consistency:</span>
                                    <span className={`font-semibold ml-1 ${getConsistencyColor(driver.consistency || 0)}`}>
                                      {driver.consistency?.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                {selectedDriver === driver.vehicleNumber.toString() && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-3 border-t border-border/50 space-y-2"
                                  >
                                    {driver.wins !== undefined && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Wins:</span>
                                        <span className="font-semibold">{driver.wins}</span>
                                      </div>
                                    )}
                                    {driver.podiums !== undefined && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Podiums:</span>
                                        <span className="font-semibold">{driver.podiums}</span>
                                      </div>
                                    )}
                                    {driver.bestTrack && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Best Track:</span>
                                        <span className="font-semibold">{driver.bestTrack}</span>
                                      </div>
                                    )}
                                    {driver.drivingStyle && (
                                      <div className="pt-2 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Style:</p>
                                        <p className="text-xs">{driver.drivingStyle}</p>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                    </div>
                  </TabsContent>

                  {['supra', 'yaris', 'gr86', 'corolla'].map((carType) => (
                    <TabsContent key={carType} value={carType} className="space-y-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {driversByCar(carType)
                          .sort((a, b) => (a.position || 0) - (b.position || 0))
                          .map((driver, index) => (
                            <motion.div
                              key={driver.vehicleNumber}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                        #{driver.carNumber}
                                      </div>
                                      <div>
                                        <div className="font-bold">{driver.driverName}</div>
                                        <div className="text-xs text-muted-foreground font-normal">{driver.team}</div>
                                      </div>
                                    </CardTitle>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Position:</span>
                                      <span className="font-semibold ml-1">P{driver.position}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Gap:</span>
                                      <span className="font-semibold ml-1">{driver.gapToLeader.toFixed(3)}s</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Best Lap:</span>
                                      <span className="font-semibold ml-1">{driver.bestLapTime.toFixed(3)}s</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Consistency:</span>
                                      <span className={`font-semibold ml-1 ${getConsistencyColor(driver.consistency || 0)}`}>
                                        {driver.consistency?.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
};

export default GRCarsAndDrivers;


