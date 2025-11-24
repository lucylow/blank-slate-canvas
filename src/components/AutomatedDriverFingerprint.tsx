/**
 * Automated Driver Fingerprint Component
 * 
 * Demonstrates real-time driver fingerprinting that learns behavior profiles
 * automatically from telemetry streams.
 */

import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Target, 
  Brain,
  BarChart3,
  Users,
  RefreshCw
} from 'lucide-react';
import { useDriverFingerprinting } from '@/hooks/useDriverFingerprinting';
import { telemetryWS, type TelemetryPoint } from '@/lib/api';
import type { DriverFingerprint } from '@/lib/driverFingerprinting';

interface AutomatedDriverFingerprintProps {
  /**
   * Track context for fingerprinting
   */
  trackContext?: string;
  
  /**
   * Mission/session ID
   */
  missionId?: string;
  
  /**
   * Minimum samples before showing fingerprint
   * @default 50
   */
  minSamples?: number;
  
  /**
   * Update interval in milliseconds
   * @default 5000
   */
  updateInterval?: number;
}

export default function AutomatedDriverFingerprint({
  trackContext,
  missionId,
  minSamples = 50,
  updateInterval = 5000,
}: AutomatedDriverFingerprintProps) {
  const {
    fingerprints,
    getFingerprint,
    compareDrivers,
    addTelemetry,
    recompute,
    clear,
    stats,
  } = useDriverFingerprinting({
    minSamples,
    updateInterval,
    continuousLearning: true,
    trackContext,
    missionId,
  });

  // Subscribe to telemetry WebSocket
  useEffect(() => {
    const unsubscribe = telemetryWS.subscribe((point: TelemetryPoint) => {
      addTelemetry([point]);
    });

    return () => {
      unsubscribe();
    };
  }, [addTelemetry]);

  // Convert fingerprints map to array for display
  const fingerprintArray = useMemo(() => {
    return Array.from(fingerprints.values());
  }, [fingerprints]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Automated Driver Fingerprinting
          </h2>
          <p className="text-muted-foreground">
            Real-time behavior profiling from telemetry streams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={recompute} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recompute
          </Button>
          <Button onClick={clear} variant="outline" size="sm">
            Clear
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Samples</p>
                <p className="text-2xl font-bold">{stats.totalSamples.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-sm font-medium">
                  {stats.lastUpdate
                    ? new Date(stats.lastUpdate).toLocaleTimeString()
                    : 'Never'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Fingerprints Grid */}
      {fingerprintArray.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No fingerprints yet. Waiting for telemetry data...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Need at least {minSamples} samples per driver to generate a fingerprint.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fingerprintArray.map((fingerprint) => (
            <DriverFingerprintCard
              key={fingerprint.driverId}
              fingerprint={fingerprint}
            />
          ))}
        </div>
      )}

      {/* Driver Comparison */}
      {fingerprintArray.length >= 2 && (
        <DriverComparisonSection
          fingerprints={fingerprintArray}
          compareDrivers={compareDrivers}
        />
      )}
    </div>
  );
}

/**
 * Individual driver fingerprint card
 */
function DriverFingerprintCard({ fingerprint }: { fingerprint: DriverFingerprint }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Driver {fingerprint.driverId}
          </span>
          <div className="flex gap-2">
            <Badge variant="outline">{fingerprint.corneringStyle}</Badge>
            <Badge variant="outline">{fingerprint.brakingStyle}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricItem
            label="Consistency"
            value={fingerprint.consistency}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricItem
            label="Smoothness"
            value={fingerprint.smoothness}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricItem
            label="Aggression"
            value={fingerprint.aggression}
            icon={<Zap className="h-4 w-4" />}
          />
          <MetricItem
            label="Avg Speed"
            value={fingerprint.avgSpeed}
            suffix=" km/h"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* Behavioral Profile */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Behavioral Profile</h4>
          <div className="space-y-1">
            <ProfileBar
              label="Throttle"
              value={fingerprint.averageThrottle}
              max={1}
            />
            <ProfileBar
              label="Brake"
              value={fingerprint.averageBrake}
              max={1}
            />
            <ProfileBar
              label="Steering"
              value={fingerprint.averageSteeringAngle}
              max={30}
            />
          </div>
        </div>

        {/* Style Classifications */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Cornering: {fingerprint.corneringStyle}
          </Badge>
          <Badge variant="secondary">
            Braking: {fingerprint.brakingStyle}
          </Badge>
          <Badge variant="secondary">
            Throttle: {fingerprint.throttleStyle}
          </Badge>
        </div>

        {/* Sample Count */}
        <div className="text-xs text-muted-foreground">
          Based on {fingerprint.sampleCount.toLocaleString()} telemetry samples
          {fingerprint.trackContext && ` • ${fingerprint.trackContext}`}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Metric display item
 */
function MetricItem({
  label,
  value,
  suffix = '',
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
}) {
  const displayValue = suffix === '' 
    ? (value * 100).toFixed(1) + '%'
    : value.toFixed(1) + suffix;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold">{displayValue}</p>
    </div>
  );
}

/**
 * Profile bar visualization
 */
function ProfileBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Driver comparison section
 */
function DriverComparisonSection({
  fingerprints,
  compareDrivers,
}: {
  fingerprints: DriverFingerprint[];
  compareDrivers: (idA: string, idB: string) => {
    similarity: number;
    differences: Record<string, number>;
    styleComparison: Record<string, string>;
  } | null;
}) {
  const [selectedA, setSelectedA] = React.useState(fingerprints[0]?.driverId || '');
  const [selectedB, setSelectedB] = React.useState(fingerprints[1]?.driverId || '');

  const comparison = useMemo(() => {
    if (!selectedA || !selectedB || selectedA === selectedB) {
      return null;
    }
    return compareDrivers(selectedA, selectedB);
  }, [selectedA, selectedB, compareDrivers]);

  if (fingerprints.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Driver Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Driver Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Driver A</label>
            <select
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {fingerprints.map((fp) => (
                <option key={fp.driverId} value={fp.driverId}>
                  Driver {fp.driverId}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Driver B</label>
            <select
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {fingerprints.map((fp) => (
                <option key={fp.driverId} value={fp.driverId}>
                  Driver {fp.driverId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Similarity Score</span>
                <Badge variant={comparison.similarity > 0.8 ? 'default' : 'secondary'}>
                  {(comparison.similarity * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${comparison.similarity * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Differences</h4>
              {Object.entries(comparison.differences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-medium">{value.toFixed(3)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Style Comparison</h4>
              {Object.entries(comparison.styleComparison).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>{' '}
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



