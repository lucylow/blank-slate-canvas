// src/components/PitConsole.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getBackendUrl } from "@/utils/backendUrl";
import { 
  generateMockRaceReplay, 
  generateMockSimulationResults,
  generateMockPitWindow 
} from "@/utils/mockPitWindowData";
import { PlayCircle, Upload, TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";

/**
 * PitConsole
 * - Upload CSV replay via POST /api/replay
 * - Shows simple metadata
 * - Fetches simulation scenarios via POST /api/replay/{id}/simulate_pit
 *
 * Usage: import PitConsole and render in App.jsx
 */

interface ReplayMeta {
  replay_id: string;
  file_name?: string;
  cars: string[];
  laps: number[];
  car_count?: number;
  lap_count?: number;
  n_rows?: number;
}

interface ScenarioResult {
  ordered: Array<{ car: string; pred_time: number }>;
  target_car: string;
  baseline_pos?: number;
  sim_pos?: number;
  error?: string;
  note?: string;
}

interface Scenarios {
  [key: string]: ScenarioResult;
}

interface SimulationResponse {
  sim_id: string;
  naive: Scenarios;
  model?: Scenarios;
  meta: {
    replay_id: string;
  };
}

export default function PitConsole() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replay, setReplay] = useState<ReplayMeta | null>(null);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [selectedLap, setSelectedLap] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<SimulationResponse | null>(null);
  const [confirming, setConfirming] = useState<string | false>(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [pitWindowRecommendation, setPitWindowRecommendation] = useState<any>(null);

  const apiBase = getBackendUrl();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a CSV file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${apiBase}/api/replay`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReplay(data.meta);
      // set defaults
      if (data.meta.cars && data.meta.cars.length > 0) {
        setSelectedCar(String(data.meta.cars[0]));
      }
      if (data.meta.laps && data.meta.laps.length > 0) {
        setSelectedLap(data.meta.laps[0]);
      }
    } catch (err) {
      console.error("Upload failed", err);
      setError("Upload failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  }

  async function loadDemoData() {
    setBusy(true);
    setError(null);
    setIsDemoMode(true);
    
    try {
      // Generate mock data
      const mockData = generateMockRaceReplay();
      
      // Create a File object from the CSV string
      const csvBlob = new Blob([mockData.csv], { type: 'text/csv' });
      const csvFile = new File([csvBlob], mockData.meta.file_name, { type: 'text/csv' });
      
      // Upload the mock CSV
      const form = new FormData();
      form.append("file", csvFile);
      
      const res = await fetch(`${apiBase}/api/replay`, {
        method: "POST",
        body: form,
      });
      
      if (!res.ok) {
        // If backend is not available, use mock data directly
        console.warn("Backend not available, using mock data directly");
        setReplay(mockData.meta);
        if (mockData.meta.cars && mockData.meta.cars.length > 0) {
          setSelectedCar(String(mockData.meta.cars[0]));
        }
        if (mockData.meta.laps && mockData.meta.laps.length > 0) {
          setSelectedLap(Math.floor(mockData.meta.laps.length / 2)); // Middle lap
        }
      } else {
        const data = await res.json();
        setReplay(data.meta);
        if (data.meta.cars && data.meta.cars.length > 0) {
          setSelectedCar(String(data.meta.cars[0]));
        }
        if (data.meta.laps && data.meta.laps.length > 0) {
          setSelectedLap(Math.floor(data.meta.laps.length / 2));
        }
      }
      
      // Generate pit window recommendation
      if (mockData.meta.cars && mockData.meta.cars.length > 0) {
        const car = String(mockData.meta.cars[0]);
        const lap = Math.floor(mockData.meta.laps.length / 2);
        const recommendation = generateMockPitWindow(car, lap);
        setPitWindowRecommendation(recommendation);
      }
    } catch (err) {
      console.error("Demo load failed", err);
      // Even if upload fails, set mock data for demo
      const mockData = generateMockRaceReplay();
      setReplay(mockData.meta);
      if (mockData.meta.cars && mockData.meta.cars.length > 0) {
        setSelectedCar(String(mockData.meta.cars[0]));
      }
      if (mockData.meta.laps && mockData.meta.laps.length > 0) {
        setSelectedLap(Math.floor(mockData.meta.laps.length / 2));
      }
    } finally {
      setBusy(false);
    }
  }

  async function runSim(action: string = "simulate_all") {
    if (!replay || !replay.replay_id || !selectedCar) {
      setError("Please upload a replay and select a car.");
      return;
    }
    setBusy(true);
    setError(null);
    
    // If in demo mode, use mock simulation results
    if (isDemoMode) {
      setTimeout(() => {
        const currentLap = selectedLap !== null ? selectedLap : Math.floor((replay.laps?.length || 25) / 2);
        const mockResults = generateMockSimulationResults(replay.replay_id, selectedCar, currentLap);
        setScenarios(mockResults);
        setBusy(false);
      }, 500); // Simulate API delay
      return;
    }
    
    try {
      const body = {
        car: selectedCar,
        lap: selectedLap !== null ? Number(selectedLap) : undefined,
        action: action,
      };
      const res = await fetch(`${apiBase}/api/replay/${replay.replay_id}/simulate_pit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      const data: SimulationResponse = await res.json();
      setScenarios(data);
    } catch (err) {
      console.error("Simulate failed", err);
      // Fallback to mock data if API fails
      if (!isDemoMode) {
        setIsDemoMode(true);
        const currentLap = selectedLap !== null ? selectedLap : Math.floor((replay.laps?.length || 25) / 2);
        const mockResults = generateMockSimulationResults(replay.replay_id, selectedCar, currentLap);
        setScenarios(mockResults);
      }
    } finally {
      setBusy(false);
    }
  }

  function prettyScenarioKey(k: string): string {
    if (k === "now") return "Box Now";
    if (k === "+1") return "+1 Lap";
    if (k === "+2") return "+2 Laps";
    if (k === "baseline") return "Baseline";
    return k;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h2 className="text-2xl font-bold mb-4">Pit Console (Monte Carlo Simulation)</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Race Replay Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Demo Mode Button */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
              <div className="flex-1">
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-blue-400" />
                  Interactive Demo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try the pit window optimization with realistic mock race data. No upload required!
                </p>
              </div>
              <Button 
                onClick={loadDemoData} 
                disabled={busy || uploading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {busy ? "Loading..." : "Load Demo Data"}
              </Button>
            </div>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or Upload Your Own</span>
              </div>
            </div>
            
            {/* Upload Form */}
            <form onSubmit={handleUpload}>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setIsDemoMode(false);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                <Button type="submit" disabled={uploading} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Replay"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {replay && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Race Information
                {isDemoMode && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">DEMO</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Replay ID</div>
                  <div className="text-sm font-mono">{replay.replay_id.substring(0, 20)}...</div>
                </div>
                {replay.file_name && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">File</div>
                    <div className="text-sm">{replay.file_name}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Cars</div>
                  <div className="text-sm font-semibold">{replay.car_count || replay.cars.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Laps</div>
                  <div className="text-sm font-semibold">{replay.lap_count || replay.laps.length}</div>
                </div>
              </div>
              
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Car</label>
                  <select
                    value={selectedCar || ""}
                    onChange={(e) => setSelectedCar(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    {replay.cars.map((c) => (
                      <option key={c} value={String(c)}>
                        Car #{c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Lap</label>
                  <select
                    value={selectedLap || ""}
                    onChange={(e) => setSelectedLap(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Auto (current)</option>
                    {replay.laps && replay.laps.map((lap) => (
                      <option key={lap} value={lap}>
                        Lap {lap}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {pitWindowRecommendation && (
            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Award className="w-5 h-5" />
                  Recommended Pit Window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    Lap {pitWindowRecommendation.recommended_lap}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Window: Laps {pitWindowRecommendation.window_start}-{pitWindowRecommendation.window_end}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${pitWindowRecommendation.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {Math.round(pitWindowRecommendation.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Key Factors:</div>
                  <ul className="space-y-1 text-xs">
                    {pitWindowRecommendation.reasoning.map((reason: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pit window & actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Pit Window</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tap "Simulate" to see recommended pit windows and outcome.
            </p>
            <Button onClick={() => runSim("simulate_all")} disabled={busy} className="w-full">
              {busy ? "Simulating..." : "Simulate All Scenarios"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setConfirming("box")}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Box Now
              </Button>
              <Button
                onClick={() => runSim("delay_1")}
                disabled={busy}
                variant="outline"
                className="w-full"
              >
                Delay 1 Lap
              </Button>
              <Button
                onClick={() => runSim("delay_2")}
                disabled={busy}
                variant="outline"
                className="w-full"
              >
                Delay 2 Laps
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenarios result */}
      {scenarios && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto">
              {Object.keys(scenarios.naive).map((k) => (
                <Card key={k} className="min-w-[260px]">
                  <CardHeader>
                    <CardTitle className="text-lg">{prettyScenarioKey(k)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <strong>Naive Simulation:</strong>
                        <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-48">
                          {JSON.stringify(scenarios.naive[k], null, 2)}
                        </pre>
                      </div>
                      {scenarios.model && scenarios.model[k] && (
                        <div>
                          <strong>Model Prediction:</strong>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-48">
                            {JSON.stringify(scenarios.model[k], null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm modal */}
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setConfirming(false)}
        >
          <div
            className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold mb-4">Confirm Pit Call</h4>
            <p className="mb-4">
              Are you sure you want to <strong>Box Now</strong> for car <strong>{selectedCar}</strong> on lap{" "}
              <strong>{selectedLap || "current"}</strong>?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  setConfirming(false);
                  await runSim("box_now");
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Yes — Execute
              </Button>
              <Button onClick={() => setConfirming(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


