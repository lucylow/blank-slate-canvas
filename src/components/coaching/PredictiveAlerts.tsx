import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, AlertTriangle, CheckCircle2, X, TrendingDown, Clock, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PredictiveAlert {
  id: string;
  type: 'risk' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  actions: {
    label: string;
    action: 'approve' | 'override' | 'dismiss';
  }[];
}

interface PredictiveAlertsProps {
  selectedDriver: string;
}

const mockAlerts: PredictiveAlert[] = [
  {
    id: '1',
    type: 'risk',
    title: 'Tire Wear Cliff Predicted',
    description: 'Tire degradation will accelerate significantly in next 3-4 laps. Current wear rate: 3.2%/lap, predicted: 5.8%/lap',
    confidence: 87,
    timeframe: 'Laps 12-15',
    impact: 'high',
    recommendation: 'Recommend pit stop on Lap 12 to avoid tire failure risk',
    actions: [
      { label: 'Approve Pit Strategy', action: 'approve' },
      { label: 'Override', action: 'override' },
    ],
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Overtaking Opportunity',
    description: 'Competitor ahead showing signs of tire degradation. Gap closing at 0.3s/lap. Overtake possible in 2-3 laps.',
    confidence: 72,
    timeframe: 'Laps 10-12',
    impact: 'medium',
    recommendation: 'Maintain current pace and prepare for overtake on Lap 11-12',
    actions: [
      { label: 'Approve Strategy', action: 'approve' },
      { label: 'Dismiss', action: 'dismiss' },
    ],
  },
  {
    id: '3',
    type: 'risk',
    title: 'Fatigue Spike Predicted',
    description: 'Driver stress levels trending upward. Predicted to reach critical threshold (75%) in next 8-10 minutes.',
    confidence: 65,
    timeframe: '8-10 minutes',
    impact: 'medium',
    recommendation: 'Implement breathing exercises and reduce aggressive maneuvers',
    actions: [
      { label: 'Send Instruction', action: 'approve' },
      { label: 'Monitor Only', action: 'override' },
    ],
  },
  {
    id: '4',
    type: 'recommendation',
    title: 'Optimal Fuel Strategy',
    description: 'Current fuel consumption is 2% above optimal. Adjust throttle application to improve efficiency.',
    confidence: 81,
    timeframe: 'Immediate',
    impact: 'low',
    recommendation: 'Reduce throttle by 3-5% on straight sections to conserve fuel',
    actions: [
      { label: 'Send Instruction', action: 'approve' },
      { label: 'Dismiss', action: 'dismiss' },
    ],
  },
];

export function PredictiveAlerts({ selectedDriver }: PredictiveAlertsProps) {
  const [alerts, setAlerts] = useState<PredictiveAlert[]>(mockAlerts);
  const [selectedAlert, setSelectedAlert] = useState<PredictiveAlert | null>(mockAlerts[0]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'opportunity':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'recommendation':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleAction = (alertId: string, action: string) => {
    if (action === 'dismiss') {
      setAlerts(alerts.filter(a => a.id !== alertId));
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(alerts.find(a => a.id !== alertId) || null);
      }
    } else {
      // Handle approve/override actions
      console.log(`Action ${action} taken on alert ${alertId}`);
    }
  };

  const criticalAlerts = alerts.filter(a => a.type === 'risk' && a.impact === 'high');

  return (
    <div className="space-y-4">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Predictive Alerts</AlertTitle>
          <AlertDescription>
            {criticalAlerts.length} high-risk prediction{criticalAlerts.length > 1 ? 's' : ''} requiring immediate attention
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AI Predictions & Recommendations</h3>
            <Badge variant="outline">{alerts.length} Active</Badge>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedAlert?.id === alert.id ? 'ring-2 ring-primary' : ''
                } ${getTypeColor(alert.type)}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <Badge className={getTypeColor(alert.type)}>
                        {alert.type}
                      </Badge>
                      <Badge variant="outline" className={getImpactColor(alert.impact)}>
                        {alert.impact} impact
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(alert.id, 'dismiss');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <h4 className="font-semibold mb-1">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{alert.timeframe}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Confidence:</span>
                      <span className="font-semibold">{alert.confidence}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Alert Details & Actions */}
        {selectedAlert && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedAlert.title}</CardTitle>
                <Badge className={getTypeColor(selectedAlert.type)}>
                  {selectedAlert.type}
                </Badge>
              </div>
              <CardDescription>
                AI Prediction • {selectedAlert.confidence}% Confidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Confidence Level</h4>
                    <span className="text-sm font-semibold">{selectedAlert.confidence}%</span>
                  </div>
                  <Progress value={selectedAlert.confidence} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Timeframe</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedAlert.timeframe}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Impact</p>
                    <Badge className={getImpactColor(selectedAlert.impact)}>
                      {selectedAlert.impact}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Recommendation
                  </h4>
                  <p className="text-sm">{selectedAlert.recommendation}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Quick Actions</h4>
                  {selectedAlert.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant={action.action === 'approve' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => handleAction(selectedAlert.id, action.action)}
                    >
                      {action.action === 'approve' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                      {action.action === 'override' && <AlertTriangle className="h-4 w-4 mr-2" />}
                      {action.action === 'dismiss' && <X className="h-4 w-4 mr-2" />}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

