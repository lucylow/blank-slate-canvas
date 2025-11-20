import { DashboardData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge } from 'lucide-react';

interface Props { 
  wear: DashboardData['tire_wear']; 
}

export function TireWearCard({ wear }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Tire Wear Prediction
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            {(wear.confidence * 100).toFixed(0)}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">FRONT LEFT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.front_left.toFixed(1)}%</div>
            <div className="text-xs font-mono text-muted-foreground">
              [{wear.ci_lower.front_left !== undefined ? wear.ci_lower.front_left.toFixed(1) : 'N/A'} - {wear.ci_upper.front_left !== undefined ? wear.ci_upper.front_left.toFixed(1) : 'N/A'}]
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">FRONT RIGHT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.front_right.toFixed(1)}%</div>
            <div className="text-xs font-mono text-muted-foreground">
              [{wear.ci_lower.front_right !== undefined ? wear.ci_lower.front_right.toFixed(1) : 'N/A'} - {wear.ci_upper.front_right !== undefined ? wear.ci_upper.front_right.toFixed(1) : 'N/A'}]
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">REAR LEFT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.rear_left.toFixed(1)}%</div>
            <div className="text-xs font-mono text-muted-foreground">
              [{wear.ci_lower.rear_left !== undefined ? wear.ci_lower.rear_left.toFixed(1) : 'N/A'} - {wear.ci_upper.rear_left !== undefined ? wear.ci_upper.rear_left.toFixed(1) : 'N/A'}]
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground font-semibold mb-2">REAR RIGHT</div>
            <div className="font-mono text-2xl font-bold mb-1">{wear.rear_right.toFixed(1)}%</div>
            <div className="text-xs font-mono text-muted-foreground">
              [{wear.ci_lower.rear_right !== undefined ? wear.ci_lower.rear_right.toFixed(1) : 'N/A'} - {wear.ci_upper.rear_right !== undefined ? wear.ci_upper.rear_right.toFixed(1) : 'N/A'}]
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

