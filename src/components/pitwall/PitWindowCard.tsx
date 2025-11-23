import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Insight {
  predictions?: {
    pit_now_delta?: number;
    predicted_loss_per_lap_seconds?: number;
    pit_now_risk?: number;
    stay_out_delta?: number;
    stay_out_risk?: number;
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

  return (
    <Card className="pit-window">
      <CardHeader>
        <CardTitle>Pit Window</CardTitle>
        {model_version && (
          <div className="text-sm text-muted-foreground">
            <strong>Model:</strong> {model_version}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Pit Now</h4>
            <div className="space-y-1 text-sm">
              <div>
                Δ time:{" "}
                {predictions?.pit_now_delta?.toFixed(2) ??
                  predictions?.predicted_loss_per_lap_seconds?.toFixed(2) ??
                  "—"}
                s
              </div>
              <div>
                Risk: {predictions?.pit_now_risk ?? "—"}%
              </div>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Stay Out</h4>
            <div className="space-y-1 text-sm">
              <div>
                Δ time: {predictions?.stay_out_delta ?? "—"}s
              </div>
              <div>
                Risk: {predictions?.stay_out_risk ?? "—"}%
              </div>
            </div>
          </div>
        </div>
        {explanation?.top_features && explanation.top_features.length > 0 && (
          <div className="mt-4">
            <strong className="text-sm">Top reasons:</strong>
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


