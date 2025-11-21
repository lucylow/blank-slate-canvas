import { DashboardData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, Info, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props { 
  wear: DashboardData['tire_wear']; 
}

const formatFeatureName = (name: string): string => {
  const mapping: Record<string, string> = {
    'avg_lateral_g': 'Avg Lateral G',
    'avg_longitudinal_g': 'Avg Longitudinal G',
    'max_lateral_g': 'Max Lateral G',
    'avg_speed': 'Avg Speed',
    'heavy_braking_events': 'Heavy Braking',
    'hard_cornering_events': 'Hard Cornering'
  };
  return mapping[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function TireWearCard({ wear }: Props) {
  const confidence = wear.confidence ?? 0.7;
  const hasCI = wear.ci_lower && wear.ci_upper;
  const hasFeatures = wear.top_features && Object.keys(wear.top_features).length > 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Tire Wear Prediction
          </CardTitle>
          <div className="flex items-center gap-2">
            {wear.model_version && (
              <Badge variant="outline" className="text-xs">
                {wear.model_version}
              </Badge>
            )}
            <Badge 
              variant="secondary" 
              className={`${
                confidence >= 0.8 ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                confidence >= 0.6 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}
            >
              {(confidence * 100).toFixed(0)}% Confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">FRONT LEFT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.front_left.toFixed(1)}%</div>
            {hasCI && (
              <div className="text-xs font-mono text-muted-foreground">
                [{wear.ci_lower?.front_left?.toFixed(1) ?? 'N/A'} - {wear.ci_upper?.front_left?.toFixed(1) ?? 'N/A'}]
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">FRONT RIGHT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.front_right.toFixed(1)}%</div>
            {hasCI && (
              <div className="text-xs font-mono text-muted-foreground">
                [{wear.ci_lower?.front_right?.toFixed(1) ?? 'N/A'} - {wear.ci_upper?.front_right?.toFixed(1) ?? 'N/A'}]
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">REAR LEFT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.rear_left.toFixed(1)}%</div>
            {hasCI && (
              <div className="text-xs font-mono text-muted-foreground">
                [{wear.ci_lower!.rear_left?.toFixed(1) ?? 'N/A'} - {wear.ci_upper!.rear_left?.toFixed(1) ?? 'N/A'}]
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">REAR RIGHT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.rear_right.toFixed(1)}%</div>
            {hasCI && (
              <div className="text-xs font-mono text-muted-foreground">
                [{wear.ci_lower!.rear_right?.toFixed(1) ?? 'N/A'} - {wear.ci_upper!.rear_right?.toFixed(1) ?? 'N/A'}]
              </div>
            )}
          </div>
        </div>
        
        {wear.predicted_laps_remaining !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Predicted Laps Remaining:</span>
              <span className="font-semibold">{wear.predicted_laps_remaining} laps</span>
              {hasCI && wear.ci_lower!.predicted_laps_remaining !== undefined && (
                <span className="text-xs text-muted-foreground">
                  [{wear.ci_lower!.predicted_laps_remaining} - {wear.ci_upper!.predicted_laps_remaining}] laps
                </span>
              )}
            </div>
          </div>
        )}
        
        {hasFeatures && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Top Contributing Factors</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Feature importance shows which telemetry factors most influence tire wear prediction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1.5">
              {Object.entries(wear.top_features!)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([feature, importance]) => (
                  <div key={feature} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatFeatureName(feature)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${importance * 100}%` }}
                        />
                      </div>
                      <span className="font-mono w-12 text-right">{(importance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

