import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DriverFingerprintProps {
  driverId: string;
  onReplay?: (evidence: any) => void;
}

export default function DriverFingerprint({ driverId, onReplay }: DriverFingerprintProps) {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const r = await fetch(`${backendUrl}/api/insights/${driverId}`);
      if (!r.ok) {
        throw new Error(`Failed to load: ${r.statusText}`);
      }
      const json = await r.json();
      setInsight(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load driver fingerprint");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Fingerprint</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={load} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load driver fingerprint"
          )}
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded">
            {error}
          </div>
        )}

        {insight && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold">{insight.title || insight.insight_id}</h3>
            <pre className="p-4 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(insight, null, 2)}
            </pre>
            {onReplay && (
              <Button
                onClick={() => onReplay(insight.payload?.evidence || insight.payload)}
                variant="outline"
              >
                Replay anomaly
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

