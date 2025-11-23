import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Zap, 
  Gauge, 
  Weight, 
  TrendingUp, 
  MapPin,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { grCarComparisonData, grCars, trackPerformanceData } from '@/lib/grCarData';
import type { TrackId } from '@/lib/grCarTypes';

const GRCarComparison: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>("sonoma");

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50";
      case "Good":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50";
      case "Average":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50";
      case "Challenging":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50";
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Good":
        return <Target className="w-4 h-4" />;
      case "Average":
        return <AlertCircle className="w-4 h-4" />;
      case "Challenging":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const selectedTrackData = trackPerformanceData.find(t => t.track === selectedTrack);
  const trackMatrixData = grCarComparisonData.trackCarMatrix.find(t => t.track === selectedTrack);

  const calculatePowerToWeight = (hp: number, kg: number) => {
    return (hp / kg).toFixed(3);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Toyota GR Car Comparison
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Compare the four GR-branded performance road cars across the 7 GR Cup tracks. 
          See how each car's specs interact with track characteristics for optimal performance.
        </p>
      </div>

      {/* Track Selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {trackPerformanceData.map((track) => (
          <button
            key={track.track}
            onClick={() => setSelectedTrack(track.track)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedTrack === track.track
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'bg-card hover:bg-accent border border-border/50 hover:border-primary/50'
            }`}
          >
            {track.trackName}
          </button>
        ))}
      </div>

      <Tabs defaultValue="specs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="track">Track Performance</TabsTrigger>
          <TabsTrigger value="matrix">Track Matrix</TabsTrigger>
        </TabsList>

        {/* Specifications Tab */}
        <TabsContent value="specs" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {grCars.map((car, index) => (
              <motion.div
                key={car.model}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-card/60 backdrop-blur-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      {car.model}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Engine</span>
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
                          {calculatePowerToWeight(car.power_hp, car.weight_kg)} hp/kg
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
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground italic">{car.advantages}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Track Performance Tab */}
        <TabsContent value="track" className="space-y-6">
          {selectedTrackData && (
            <>
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {selectedTrackData.trackName} - Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {grCars.map((car) => {
                      const perf = selectedTrackData.performance[car.model] || "N/A";
                      const strengths = selectedTrackData.strengths[car.model] || [];
                      const weaknesses = selectedTrackData.weaknesses[car.model] || [];

                      return (
                        <Card key={car.model} className="bg-card/40 border-border/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Car className="w-4 h-4 text-primary" />
                              {car.model}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Performance Summary</p>
                              <p className="text-sm font-medium">{perf}</p>
                            </div>
                            {strengths.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  Strengths
                                </p>
                                <ul className="space-y-1">
                                  {strengths.map((strength, idx) => (
                                    <li key={idx} className="text-xs flex items-start gap-2">
                                      <span className="text-green-500 mt-1">•</span>
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {weaknesses.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-red-500" />
                                  Weaknesses
                                </p>
                                <ul className="space-y-1">
                                  {weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="text-xs flex items-start gap-2">
                                      <span className="text-red-500 mt-1">•</span>
                                      <span>{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Key Telemetry Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrackData.telemetry_focus.map((metric, idx) => (
                      <Badge key={idx} variant="outline" className="border-primary/50">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Track Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          {trackMatrixData && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trackMatrixData.cars.map((carData, index) => {
                const car = grCars.find(c => c.model === carData.model);
                return (
                  <motion.div
                    key={carData.model}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-border/50 bg-card/60 backdrop-blur-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{carData.model}</CardTitle>
                          <Badge className={getRatingColor(carData.rating)}>
                            <div className="flex items-center gap-1">
                              {getRatingIcon(carData.rating)}
                              {carData.rating}
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{carData.notes}</p>
                        {car && (
                          <div className="pt-2 border-t border-border/50 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Power/Weight:</span>
                              <span className="font-semibold">
                                {calculatePowerToWeight(car.power_hp, car.weight_kg)} hp/kg
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Drivetrain:</span>
                              <Badge variant="outline" className="text-xs">
                                {car.drivetrain}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Summary Table */}
      <Card className="bg-card/60 backdrop-blur-md border-border/50 mt-8">
        <CardHeader>
          <CardTitle>Complete Specifications Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-2 font-semibold">Model</th>
                  <th className="text-left p-2 font-semibold">Engine</th>
                  <th className="text-left p-2 font-semibold">Power (hp)</th>
                  <th className="text-left p-2 font-semibold">Torque (Nm)</th>
                  <th className="text-left p-2 font-semibold">Weight (kg)</th>
                  <th className="text-left p-2 font-semibold">P/W Ratio</th>
                  <th className="text-left p-2 font-semibold">0-100 km/h</th>
                  <th className="text-left p-2 font-semibold">Drivetrain</th>
                </tr>
              </thead>
              <tbody>
                {grCars.map((car) => (
                  <tr key={car.model} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                    <td className="p-2 font-medium">{car.model}</td>
                    <td className="p-2">{car.engine}</td>
                    <td className="p-2">{car.power_hp}</td>
                    <td className="p-2">{car.torque_nm}</td>
                    <td className="p-2">{car.weight_kg}</td>
                    <td className="p-2 font-semibold text-primary">{calculatePowerToWeight(car.power_hp, car.weight_kg)}</td>
                    <td className="p-2">{car.accel_0_100}s</td>
                    <td className="p-2">
                      <Badge variant="outline">{car.drivetrain}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GRCarComparison;


