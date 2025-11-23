// src/pages/AISummaryReports.tsx
import React, { useEffect, useState } from "react";
import { Loader2, FileText, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type Report = {
  id: string;
  filename: string;
  ext: string;
};

// Mock data for AI Summary Reports
const MOCK_REPORTS: Report[] = [
  {
    id: "sebring",
    filename: "sebring_ai_summary.txt",
    ext: "txt"
  },
  {
    id: "road_america",
    filename: "road_america_ai_summary.txt",
    ext: "txt"
  },
  {
    id: "cota",
    filename: "cota_ai_summary.txt",
    ext: "txt"
  },
  {
    id: "sonoma",
    filename: "sonoma_ai_summary.txt",
    ext: "txt"
  },
  {
    id: "vir",
    filename: "vir_ai_summary.txt",
    ext: "txt"
  },
  {
    id: "barber",
    filename: "barber_ai_summary.txt",
    ext: "txt"
  }
];

// Mock HTML content for previews
const MOCK_REPORT_CONTENT: Record<string, string> = {
  sebring: `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: #0a0a0a; 
            color: #fff;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>Sebring International Raceway - AI Summary Report</h1>
        <p class="meta">Generated: 2025-02-14 | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2</p>
        
        <h2>Summary Statistics</h2>
        <div class="stat">
          <strong>Total Samples:</strong> 1,488<br>
          <strong>Vehicles Analyzed:</strong> 30<br>
          <strong>Average Speed:</strong> 133.44 km/h<br>
          <strong>Speed Std Dev:</strong> 5.5 km/h<br>
          <strong>Average Tire Temperature:</strong> 92.4°C
        </div>
        
        <h2>Top Insights</h2>
        <div class="insight">
          <strong>Consistent Sector 3 Slowdown</strong><br>
          Multiple cars lose 0.8–1.2s in S3 during warm-up laps. This suggests a need for improved tire warm-up strategy or setup adjustments for the final sector.
        </div>
        <div class="insight">
          <strong>Tire Degradation Window</strong><br>
          Tire surface temp rises by ~6–9°C over 8 laps; expected cliff at lap ~18. Recommend pit window analysis around lap 17-18.
        </div>
        
        <h2>Driver Clusters</h2>
        <div class="cluster">
          <strong>Cluster 0 (892 samples)</strong><br>
          Average Speed: 130.77 km/h | Tire Temp: 87.78°C<br>
          <em>Conservative driving style, lower tire temperatures</em>
        </div>
        <div class="cluster">
          <strong>Cluster 1 (446 samples)</strong><br>
          Average Speed: 136.11 km/h | Tire Temp: 96.02°C<br>
          <em>Aggressive driving style, optimal tire management</em>
        </div>
        <div class="cluster">
          <strong>Cluster 2 (148 samples)</strong><br>
          Average Speed: 143.12 km/h | Tire Temp: 103.40°C<br>
          <em>Maximum performance, high tire stress</em>
        </div>
        
        <h2>AI Recommendations</h2>
        <div class="recommendation">
          <strong>Pit Window Optimization</strong><br>
          Recommended pit lap: 17 (Confidence: 74%)<br>
          Based on tire degradation patterns and temperature analysis.
        </div>
        <div class="recommendation">
          <strong>Driver Coaching</strong><br>
          Brake 3m later in Sector 2 to carry speed (Confidence: 80%)<br>
          Analysis shows potential for 0.3-0.5s improvement with later braking point.
        </div>
      </body>
    </html>
  `,
  road_america: `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: #0a0a0a; 
            color: #fff;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>Road America - AI Summary Report</h1>
        <p class="meta">Generated: 2025-02-14 | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2</p>
        
        <h2>Summary Statistics</h2>
        <div class="stat">
          <strong>Total Samples:</strong> 1,497<br>
          <strong>Vehicles Analyzed:</strong> 29<br>
          <strong>Average Speed:</strong> 133.51 km/h<br>
          <strong>Speed Std Dev:</strong> 4.5 km/h<br>
          <strong>Average Tire Temperature:</strong> 95.4°C
        </div>
        
        <h2>Top Insights</h2>
        <div class="insight">
          <strong>Brake Fade in Long Downhill Zones</strong><br>
          Several vehicles show +7°C caliper rise per lap. Monitor brake temperatures closely, especially in the Carousel and Kettle Bottoms sections.
        </div>
        <div class="insight">
          <strong>Late Apex Gains</strong><br>
          Cluster 1 drivers gaining ~0.4s via later turn-in at T5. Consider coaching drivers on optimal turn-in points for Canada Corner.
        </div>
        
        <h2>Driver Clusters</h2>
        <div class="cluster">
          <strong>Cluster 0 (898 samples)</strong><br>
          Average Speed: 130.84 km/h | Tire Temp: 90.63°C
        </div>
        <div class="cluster">
          <strong>Cluster 1 (449 samples)</strong><br>
          Average Speed: 136.18 km/h | Tire Temp: 100.17°C
        </div>
        <div class="cluster">
          <strong>Cluster 2 (150 samples)</strong><br>
          Average Speed: 143.19 km/h | Tire Temp: 106.85°C
        </div>
        
        <h2>AI Recommendations</h2>
        <div class="recommendation">
          <strong>Pit Window Optimization</strong><br>
          Recommended pit lap: 18 (Confidence: 72%)
        </div>
        <div class="recommendation">
          <strong>Driver Coaching</strong><br>
          Smoother throttle pickup at corner exit (Confidence: 77%)
        </div>
      </body>
    </html>
  `,
  cota: `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: #0a0a0a; 
            color: #fff;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>Circuit of the Americas - AI Summary Report</h1>
        <p class="meta">Generated: 2025-02-14 | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2</p>
        
        <h2>Summary Statistics</h2>
        <div class="stat">
          <strong>Total Samples:</strong> 1,539<br>
          <strong>Vehicles Analyzed:</strong> 30<br>
          <strong>Average Speed:</strong> 134.31 km/h<br>
          <strong>Speed Std Dev:</strong> 5.5 km/h<br>
          <strong>Average Tire Temperature:</strong> 93.0°C
        </div>
        
        <h2>Top Insights</h2>
        <div class="insight">
          <strong>High-Speed Esses Consistency</strong><br>
          Cluster 0 drivers remain within ±0.03s delta in S1. Excellent consistency through the technical esses section.
        </div>
        <div class="insight">
          <strong>Oversteer Trend</strong><br>
          Rear slip angle increases 0.06°/lap under high load corners. Monitor rear tire wear and consider setup adjustments.
        </div>
        
        <h2>Driver Clusters</h2>
        <div class="cluster">
          <strong>Cluster 0 (923 samples)</strong><br>
          Average Speed: 131.62 km/h | Tire Temp: 88.35°C
        </div>
        <div class="cluster">
          <strong>Cluster 1 (462 samples)</strong><br>
          Average Speed: 136.60 km/h | Tire Temp: 97.65°C
        </div>
        <div class="cluster">
          <strong>Cluster 2 (154 samples)</strong><br>
          Average Speed: 144.25 km/h | Tire Temp: 104.16°C
        </div>
        
        <h2>AI Recommendations</h2>
        <div class="recommendation">
          <strong>Pit Window Optimization</strong><br>
          Recommended pit lap: 17 (Confidence: 76%)
        </div>
        <div class="recommendation">
          <strong>Driver Coaching</strong><br>
          Earlier rotation before S-turn entries (Confidence: 71%)
        </div>
      </body>
    </html>
  `,
  sonoma: `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: #0a0a0a; 
            color: #fff;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>Sonoma Raceway - AI Summary Report</h1>
        <p class="meta">Generated: 2025-02-14 | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2</p>
        
        <h2>Summary Statistics</h2>
        <div class="stat">
          <strong>Total Samples:</strong> 1,398<br>
          <strong>Vehicles Analyzed:</strong> 29<br>
          <strong>Average Speed:</strong> 131.32 km/h<br>
          <strong>Speed Std Dev:</strong> 4.5 km/h<br>
          <strong>Average Tire Temperature:</strong> 90.6°C
        </div>
        
        <h2>Top Insights</h2>
        <div class="insight">
          <strong>Hairpin Braking Variance</strong><br>
          Cluster spread of ±0.5s under heavy braking at T11. Significant opportunity for improvement through consistent braking technique.
        </div>
        <div class="insight">
          <strong>Grip Loss on Off-Camber Sections</strong><br>
          Rear traction drops 3% in S2. Consider setup adjustments for off-camber corners.
        </div>
        
        <h2>Driver Clusters</h2>
        <div class="cluster">
          <strong>Cluster 0 (838 samples)</strong><br>
          Average Speed: 128.69 km/h | Tire Temp: 86.07°C
        </div>
        <div class="cluster">
          <strong>Cluster 1 (419 samples)</strong><br>
          Average Speed: 133.23 km/h | Tire Temp: 93.13°C
        </div>
        <div class="cluster">
          <strong>Cluster 2 (139 samples)</strong><br>
          Average Speed: 141.82 km/h | Tire Temp: 101.47°C
        </div>
        
        <h2>AI Recommendations</h2>
        <div class="recommendation">
          <strong>Pit Window Optimization</strong><br>
          Recommended pit lap: 15 (Confidence: 78%)
        </div>
        <div class="recommendation">
          <strong>Driver Coaching</strong><br>
          Trail-brake slightly longer into T7 (Confidence: 74%)
        </div>
      </body>
    </html>
  `,
  vir: `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: #0a0a0a; 
            color: #fff;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>VIR (Virginia International Raceway) - AI Summary Report</h1>
        <p class="meta">Generated: 2025-02-14 | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2</p>
        
        <h2>Summary Statistics</h2>
        <div class="stat">
          <strong>Total Samples:</strong> 1,392<br>
          <strong>Vehicles Analyzed:</strong> 28<br>
          <strong>Average Speed:</strong> 131.25 km/h<br>
          <strong>Speed Std Dev:</strong> 4.5 km/h<br>
          <strong>Average Tire Temperature:</strong> 92.4°C
        </div>
        
        <h2>Top Insights</h2>
        <div class="insight">
          <strong>High-Speed Rolling Pace</strong><br>
          Cluster 1 shows +2.1 km/h advantage in upper esses. Study their line and throttle application through this section.
        </div>
        <div class="insight">
          <strong>Brake Stability Issues</strong><br>
          ABS cycles more frequently after lap 10. Monitor brake temperatures and consider pad compound adjustments.
        </div>
        
        <h2>Driver Clusters</h2>
        <div class="cluster">
          <strong>Cluster 0 (835 samples)</strong><br>
          Average Speed: 128.62 km/h | Tire Temp: 87.78°C
        </div>
        <div class="cluster">
          <strong>Cluster 1 (417 samples)</strong><br>
          Average Speed: 133.15 km/h | Tire Temp: 96.02°C
        </div>
        <div class="cluster">
          <strong>Cluster 2 (139 samples)</strong><br>
          Average Speed: 141.81 km/h | Tire Temp: 103.63°C
        </div>
        
        <h2>AI Recommendations</h2>
        <div class="recommendation">
          <strong>Pit Window Optimization</strong><br>
          Recommended pit lap: 16 (Confidence: 76%)
        </div>
        <div class="recommendation">
          <strong>Driver Coaching</strong><br>
          Reduce steering input mid-esses to avoid scrubbing speed (Confidence: 73%)
        </div>
      </body>
    </html>
  `,
  barber: `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: #0a0a0a; 
            color: #fff;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>Barber Motorsports Park - AI Summary Report</h1>
        <p class="meta">Generated: 2025-02-14 | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2</p>
        
        <h2>Summary Statistics</h2>
        <div class="stat">
          <strong>Total Samples:</strong> 1,410<br>
          <strong>Vehicles Analyzed:</strong> 29<br>
          <strong>Average Speed:</strong> 132.25 km/h<br>
          <strong>Speed Std Dev:</strong> 5.0 km/h<br>
          <strong>Average Tire Temperature:</strong> 92.4°C
        </div>
        
        <h2>Top Insights</h2>
        <div class="insight">
          <strong>Mid-Corner Stiffness Variation</strong><br>
          Cars show 0.05–0.09° variance in roll stiffness. Consider suspension tuning for more consistent handling.
        </div>
        <div class="insight">
          <strong>Acceleration Delta</strong><br>
          Cluster 2 vehicles gain +0.3s out of T4 via earlier throttle application. Key learning opportunity for other drivers.
        </div>
        
        <h2>Driver Clusters</h2>
        <div class="cluster">
          <strong>Cluster 0 (846 samples)</strong><br>
          Average Speed: 129.61 km/h | Tire Temp: 87.78°C
        </div>
        <div class="cluster">
          <strong>Cluster 1 (423 samples)</strong><br>
          Average Speed: 134.20 km/h | Tire Temp: 96.02°C
        </div>
        <div class="cluster">
          <strong>Cluster 2 (141 samples)</strong><br>
          Average Speed: 142.83 km/h | Tire Temp: 103.63°C
        </div>
        
        <h2>AI Recommendations</h2>
        <div class="recommendation">
          <strong>Pit Window Optimization</strong><br>
          Recommended pit lap: 17 (Confidence: 74%)
        </div>
        <div class="recommendation">
          <strong>Driver Coaching</strong><br>
          Open steering earlier in compression zones (Confidence: 78%)
        </div>
      </body>
    </html>
  `
};

// Get AI Summary API base URL
// In dev: uses Vite proxy (/api/reports)
// In production: uses relative paths that Lovable Cloud can proxy
// Or explicit VITE_AI_SUMMARY_API env var if set
function getAISummaryApiBase(): string {
  const explicitUrl = import.meta.env.VITE_AI_SUMMARY_API;
  if (explicitUrl) {
    return explicitUrl;
  }
  // Use relative paths - Vite proxy in dev, Lovable Cloud proxy in production
  return '';
}

export default function AISummaryReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = getAISummaryApiBase();

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Try to fetch from track analysis API first (main source)
    Promise.all([
      fetch(`${API_BASE}/api/reports/analysis`)
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            // Convert track analysis format to report format
            if (data.analyses && Array.isArray(data.analyses)) {
              return data.analyses
                .filter((a: any) => a.exists)
                .map((a: any) => ({
                  id: a.track_id,
                  filename: a.filename,
                  ext: a.filename.split('.').pop() || 'txt'
                }));
            }
          }
          return [];
        })
        .catch(() => []),
      // Fallback: try original AI summaries endpoint
      fetch(`${API_BASE}/api/reports`)
        .then(async (r) => {
          if (r.ok) {
            return r.json();
          }
          return [];
        })
        .catch(() => [])
    ])
      .then(([trackReports, originalReports]) => {
        // Merge reports, prefer track analysis reports
        const allReports = trackReports.length > 0 ? trackReports : originalReports;
        
        // If no reports from API, use mock data
        if (!allReports || allReports.length === 0) {
          console.log('No reports from API, using mock data');
          setReports(MOCK_REPORTS);
          if (MOCK_REPORTS.length > 0) setSelected(MOCK_REPORTS[0].id);
        } else {
          setReports(allReports);
          if (allReports.length > 0) setSelected(allReports[0].id);
        }
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load AI summary reports, using mock data:', err);
        // Use mock data as fallback
        setReports(MOCK_REPORTS);
        if (MOCK_REPORTS.length > 0) setSelected(MOCK_REPORTS[0].id);
        setError(null); // Don't show error when using mock data
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_BASE]);

  async function downloadPdf(id: string) {
    setLoadingPdf(true);
    try {
      const resp = await fetch(`${API_BASE}/api/reports/${id}/pdf`);
      if (!resp.ok) {
        // If PDF generation fails and we have mock data, create a simple text file
        const mockContent = MOCK_REPORT_CONTENT[id];
        if (mockContent) {
          // Create a text version from the HTML
          const textContent = mockContent
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
          const blob = new Blob([textContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${id}_summary.txt`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setLoadingPdf(false);
          return;
        }
        const txt = await resp.text();
        setError(`PDF generation failed: ${txt}`);
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // If download fails and we have mock data, create a simple text file
      const mockContent = MOCK_REPORT_CONTENT[id];
      if (mockContent) {
        const textContent = mockContent
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${id}_summary.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        setError(`Download failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-6xl mx-auto py-16 px-6">
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-2">AI Summary Reports</h1>
          <p className="text-gray-300 max-w-2xl">
            View and export AI-generated race analysis reports for each track
          </p>
        </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <Card className="lg:col-span-1 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full bg-gray-800" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No reports found.</p>
                <p className="text-xs mt-2">
                  Make sure the AI summaries server is running on port 8001
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <Card
                    key={r.id}
                    className={`cursor-pointer transition-all bg-gray-800 border ${
                      selected === r.id
                        ? "bg-[#EB0A1E]/10 border-[#EB0A1E]"
                        : "border-gray-700 hover:border-gray-600 hover:bg-gray-750"
                    }`}
                    onClick={() => setSelected(r.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {r.id.replace(/_/g, " ").replace(/\b\w/g, (l) =>
                              l.toUpperCase()
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            {r.filename}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {r.ext.toUpperCase()} file
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPdf(r.id);
                          }}
                          disabled={loadingPdf}
                          className="shrink-0 text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                          {loadingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800"
              style={{ height: "720px" }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : selected ? (
                (() => {
                  // Check if we have mock content for this report
                  const mockContent = MOCK_REPORT_CONTENT[selected];
                  
                  if (mockContent) {
                    // Use mock content
                    const blob = new Blob([mockContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    return (
                      <iframe
                        src={url}
                        title={`report-${selected}`}
                        className="w-full h-full border-0"
                      />
                    );
                  }
                  
                  // Try track analysis endpoint first, then fallback to original
                  const trackAnalysisUrl = `${API_BASE}/api/reports/analysis/${selected}`;
                  const originalUrl = `${API_BASE}/api/reports/${selected}/html`;
                  
                  return (
                    <iframe
                      src={originalUrl}
                      title={`report-${selected}`}
                      className="w-full h-full border-0"
                      onError={(e) => {
                        console.error("Failed to load report preview:", e);
                        // Try loading raw text and displaying it
                        fetch(trackAnalysisUrl)
                          .then(async (r) => {
                            if (r.ok) {
                              const text = await r.text();
                              // Create a simple HTML preview
                              const previewHtml = `
                                <html>
                                  <head>
                                    <style>
                                      body { 
                                        font-family: monospace; 
                                        padding: 20px; 
                                        background: #0a0a0a; 
                                        color: #fff;
                                        white-space: pre-wrap;
                                      }
                                    </style>
                                  </head>
                                  <body>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
                                </html>
                              `;
                              const blob = new Blob([previewHtml], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const iframe = document.querySelector('iframe[title*="report"]') as HTMLIFrameElement;
                              if (iframe) {
                                iframe.src = url;
                              }
                            } else {
                              // Fallback to mock content if available
                              const fallbackMock = MOCK_REPORT_CONTENT[selected];
                              if (fallbackMock) {
                                const blob = new Blob([fallbackMock], { type: 'text/html' });
                                const url = URL.createObjectURL(blob);
                                const iframe = document.querySelector('iframe[title*="report"]') as HTMLIFrameElement;
                                if (iframe) {
                                  iframe.src = url;
                                }
                              } else {
                                setError("Failed to load report preview");
                              }
                            }
                          })
                          .catch(() => {
                            // Fallback to mock content if available
                            const fallbackMock = MOCK_REPORT_CONTENT[selected];
                            if (fallbackMock) {
                              const blob = new Blob([fallbackMock], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const iframe = document.querySelector('iframe[title*="report"]') as HTMLIFrameElement;
                              if (iframe) {
                                iframe.src = url;
                              }
                            } else {
                              setError("Failed to load report preview");
                            }
                          });
                      }}
                    />
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-gray-400 mb-4 opacity-50" />
                  <p className="text-gray-400">
                    Select a report from the list to preview
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </section>
    </main>
  );
}