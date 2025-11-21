/**
 * Anomaly Statistics Component
 * Displays summary statistics about detected anomalies
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Activity, Zap } from 'lucide-react';
import { getAnomalyStats, AnomalyStats as AnomalyStatsType } from '@/api/anomaly';

interface AnomalyStatsProps {
  track: string;
  race: number;
  vehicle?: number;
  lapStart?: number;
  lapEnd?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function AnomalyStats({
  track,
  race,
  vehicle,
  lapStart,
  lapEnd,
  autoRefresh = false,
  refreshInterval = 30000,
}: AnomalyStatsProps) {
  const [stats, setStats] = useState<AnomalyStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAnomalyStats(track, race, vehicle, lapStart, lapEnd);
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load anomaly statistics');
      console.error('Error fetching anomaly stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [track, race, vehicle, lapStart, lapEnd, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Anomaly Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading statistics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Anomaly Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Anomaly Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Points</p>
            <p className="text-2xl font-bold">{stats.total_points.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Anomalies</p>
            <p className="text-2xl font-bold text-red-500">{stats.anomaly_count.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Anomaly Rate</p>
            <p className="text-2xl font-bold">{stats.anomaly_rate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
            <p className="text-2xl font-bold">
              {(stats.avg_anomaly_score * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-3">Alert Breakdown</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Critical Alerts</span>
              </div>
              <span className="text-sm font-semibold">{stats.critical_alerts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Rate of Change</span>
              </div>
              <span className="text-sm font-semibold">{stats.rate_of_change_alerts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm">ML Detected</span>
              </div>
              <span className="text-sm font-semibold">{stats.ml_detected_anomalies}</span>
            </div>
          </div>
        </div>

        {stats.top_anomalous_sensors && stats.top_anomalous_sensors.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3">Top Anomalous Sensors</p>
            <div className="space-y-2">
              {stats.top_anomalous_sensors.slice(0, 5).map((sensor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{sensor.sensor}</span>
                  <span className="text-sm font-semibold">{sensor.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


