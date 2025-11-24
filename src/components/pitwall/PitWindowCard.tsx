import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Insight {
  predictions?: {
    pit_now_delta?: number;
    predicted_loss_per_lap_seconds?: number;
    pit_now_risk?: number;
    stay_out_delta?: number;
    stay_out_risk?: number;
    pit_now?: {
      time_delta?: number;
      position_delta?: number;
      risk?: number;
      tire_wear?: number;
      traffic_risk?: number;
      advantages?: string[];
      disadvantages?: string[];
    };
    stay_out?: {
      time_delta?: number;
      position_delta?: number;
      risk?: number;
      projected_final_tire_wear?: number;
      undercut_risk?: number;
      advantages?: string[];
      disadvantages?: string[];
    };
  };
  explanation?: {
    top_features?: Array<{ name: string; value: number }>;
  };
  model_version?: string;
}

interface PitWindowCardProps {
  insight?: Insight | null;
}

export default function PitWindowCard({ insight }: PitWindowCardProps) {
  if (!insight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pit Window</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No insight available</div>
        </CardContent>
      </Card>
    );
  }

  const { predictions, explanation, model_version } = insight;
  const pitNow = predictions?.pit_now;
  const stayOut = predictions?.stay_out;

  return (
    <Card className="pit-window">
      <CardHeader>
        <CardTitle>Pit Window Analysis</CardTitle>
        {model_version && (
          <div className="text-sm text-muted-foreground">
            <strong>Model:</strong> {model_version}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Pit Now Analysis */}
          <div className={`p-4 border-2 rounded-lg ${
            (pitNow?.time_delta ?? predictions?.pit_now_delta ?? 0) < 0
              ? 'border-green-500/50 bg-green-900/10'
              : 'border-red-500/50 bg-red-900/10'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">Pit Now</h4>
              {(pitNow?.time_delta ?? predictions?.pit_now_delta ?? 0) < 0 ? (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Not Optimal
                </Badge>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time Δ:</span>
                <span className={`font-bold ${
                  (pitNow?.time_delta ?? predictions?.pit_now_delta ?? 0) < 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {(pitNow?.time_delta ?? predictions?.pit_now_delta ?? predictions?.predicted_loss_per_lap_seconds ?? 0).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Position Δ:</span>
                <span className={`font-bold ${
                  (pitNow?.position_delta ?? 0) < 0
                    ? 'text-green-400'
                    : (pitNow?.position_delta ?? 0) > 0
                    ? 'text-red-400'
                    : ''
                }`}>
                  {(pitNow?.position_delta ?? 0) > 0 ? '+' : ''}{pitNow?.position_delta ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Risk:</span>
                <span className={`font-bold ${
                  (pitNow?.risk ?? predictions?.pit_now_risk ?? 0) < 25
                    ? 'text-green-400'
                    : (pitNow?.risk ?? predictions?.pit_now_risk ?? 0) < 40
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {(pitNow?.risk ?? predictions?.pit_now_risk ?? 0).toFixed(0)}%
                </span>
              </div>
              {pitNow?.tire_wear && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tire Wear:</span>
                  <span className={`font-bold ${
                    pitNow.tire_wear > 80
                      ? 'text-red-400'
                      : pitNow.tire_wear > 60
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>
                    {pitNow.tire_wear.toFixed(0)}%
                  </span>
                </div>
              )}
              {pitNow?.traffic_risk && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Traffic Risk:</span>
                  <span className="font-semibold">
                    {pitNow.traffic_risk.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            {pitNow?.advantages && pitNow.advantages.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Advantages:</div>
                <ul className="space-y-1 text-xs">
                  {pitNow.advantages.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pitNow?.disadvantages && pitNow.disadvantages.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Disadvantages:</div>
                <ul className="space-y-1 text-xs">
                  {pitNow.disadvantages.map((dis, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{dis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Stay Out Analysis */}
          <div className={`p-4 border-2 rounded-lg ${
            (stayOut?.time_delta ?? predictions?.stay_out_delta ?? 0) < 0
              ? 'border-green-500/50 bg-green-900/10'
              : 'border-red-500/50 bg-red-900/10'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">Stay Out</h4>
              {(stayOut?.time_delta ?? predictions?.stay_out_delta ?? 0) < 0 ? (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  High Risk
                </Badge>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time Δ:</span>
                <span className={`font-bold ${
                  (stayOut?.time_delta ?? predictions?.stay_out_delta ?? 0) < 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {(stayOut?.time_delta ?? predictions?.stay_out_delta ?? 0).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Position Δ:</span>
                <span className={`font-bold ${
                  (stayOut?.position_delta ?? 0) < 0
                    ? 'text-green-400'
                    : (stayOut?.position_delta ?? 0) > 0
                    ? 'text-red-400'
                    : ''
                }`}>
                  {(stayOut?.position_delta ?? 0) > 0 ? '+' : ''}{stayOut?.position_delta ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Risk:</span>
                <span className={`font-bold ${
                  (stayOut?.risk ?? predictions?.stay_out_risk ?? 0) < 25
                    ? 'text-green-400'
                    : (stayOut?.risk ?? predictions?.stay_out_risk ?? 0) < 40
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {(stayOut?.risk ?? predictions?.stay_out_risk ?? 0).toFixed(0)}%
                </span>
              </div>
              {stayOut?.projected_final_tire_wear && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Final Tire Wear:</span>
                  <span className={`font-bold ${
                    stayOut.projected_final_tire_wear > 85
                      ? 'text-red-400'
                      : stayOut.projected_final_tire_wear > 70
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>
                    {stayOut.projected_final_tire_wear.toFixed(0)}%
                  </span>
                </div>
              )}
              {stayOut?.undercut_risk && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Undercut Risk:</span>
                  <span className="font-semibold">
                    {stayOut.undercut_risk.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            {stayOut?.advantages && stayOut.advantages.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Advantages:</div>
                <ul className="space-y-1 text-xs">
                  {stayOut.advantages.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stayOut?.disadvantages && stayOut.disadvantages.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Disadvantages:</div>
                <ul className="space-y-1 text-xs">
                  {stayOut.disadvantages.map((dis, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{dis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {explanation?.top_features && explanation.top_features.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <strong className="text-sm">Top Contributing Factors:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              {explanation.top_features.map((f, idx) => (
                <li key={idx}>
                  {f.name} ({(f.value * 100).toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



