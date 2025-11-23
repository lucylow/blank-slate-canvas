import React from 'react';
import { CarData } from './TrackMapSVG';
import { theme, getTireWearColor } from '../styles/theme';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

export interface EvidenceFeature {
  name: string;
  contribution: number; // 0-1, normalized contribution score
  description?: string;
  timestamp?: number; // for replay scrubbing
}

interface CarDetailCardProps {
  car: CarData | null;
  topFeatures?: EvidenceFeature[];
  onFeatureClick?: (feature: EvidenceFeature) => void;
  onPitNow?: (carId: string) => void;
  onSimulate?: (carId: string) => void;
}

export default function CarDetailCard({
  car,
  topFeatures = [],
  onFeatureClick,
  onPitNow,
  onSimulate,
}: CarDetailCardProps) {
  if (!car) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a car to view details
        </CardContent>
      </Card>
    );
  }

  const tireWear = car.tire_wear ?? 0;
  const wearColor = getTireWearColor(tireWear);
  const lapsToCliff = car.predicted_laps_to_cliff ?? null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{car.chassis}</CardTitle>
          <Badge
            variant={tireWear > 0.6 ? 'destructive' : tireWear > 0.3 ? 'default' : 'secondary'}
            style={{ backgroundColor: wearColor }}
          >
            {tireWear > 0.6 ? 'Critical' : tireWear > 0.3 ? 'Warning' : 'Healthy'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speed and Lap Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Speed</p>
            <p className="text-2xl font-bold">
              {car.speed !== undefined ? `${Math.round(car.speed)} km/h` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lap</p>
            <p className="text-2xl font-bold">{car.lap ?? 'N/A'}</p>
          </div>
        </div>

        {/* Tire Wear Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Tire Wear</span>
            <span className="font-medium">{Math.round(tireWear * 100)}%</span>
          </div>
          <Progress value={tireWear * 100} className="h-2" />
          {lapsToCliff !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Predicted cliff in {lapsToCliff.toFixed(1)} laps
            </p>
          )}
        </div>

        {/* Tire Temperatures */}
        {(car.tire_temp_fl !== undefined ||
          car.tire_temp_fr !== undefined ||
          car.tire_temp_rl !== undefined ||
          car.tire_temp_rr !== undefined) && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tire Temperatures</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {car.tire_temp_fl !== undefined && (
                <div>
                  <span className="text-muted-foreground">FL:</span>{' '}
                  <span className="font-medium">{Math.round(car.tire_temp_fl)}°C</span>
                </div>
              )}
              {car.tire_temp_fr !== undefined && (
                <div>
                  <span className="text-muted-foreground">FR:</span>{' '}
                  <span className="font-medium">{Math.round(car.tire_temp_fr)}°C</span>
                </div>
              )}
              {car.tire_temp_rl !== undefined && (
                <div>
                  <span className="text-muted-foreground">RL:</span>{' '}
                  <span className="font-medium">{Math.round(car.tire_temp_rl)}°C</span>
                </div>
              )}
              {car.tire_temp_rr !== undefined && (
                <div>
                  <span className="text-muted-foreground">RR:</span>{' '}
                  <span className="font-medium">{Math.round(car.tire_temp_rr)}°C</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top 3 Evidence Features */}
        {topFeatures.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3">Top Reasons for Prediction</p>
            <div className="space-y-3">
              {topFeatures.slice(0, 3).map((feature, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                  onClick={() => onFeatureClick?.(feature)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">
                      {idx + 1}. {feature.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(feature.contribution * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={feature.contribution * 100} className="h-1.5" />
                  {feature.description && (
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onPitNow?.(car.id)}
            className="flex-1 px-4 py-2 bg-[#7B1E2D] text-white rounded-md hover:bg-[#A02A3F] transition-colors text-sm font-medium"
          >
            Pit Now
          </button>
          <button
            onClick={() => onSimulate?.(car.id)}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium"
          >
            Simulate
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

