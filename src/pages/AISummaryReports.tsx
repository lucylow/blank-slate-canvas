// src/pages/AISummaryReports.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Loader2, FileText, Download, AlertCircle, BarChart3, TrendingUp, Gauge, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { DriverClusterChart } from "@/components/analytics/DriverClusterChart";
import { SpeedDistributionChart } from "@/components/analytics/SpeedDistributionChart";
import { TireTemperatureTrendChart } from "@/components/analytics/TireTemperatureTrendChart";
import { SectorPerformanceChart } from "@/components/analytics/SectorPerformanceChart";
import { LapTimeTrendsChart } from "@/components/analytics/LapTimeTrendsChart";
import { TireWearDistributionChart } from "@/components/analytics/TireWearDistributionChart";
import { LapSplitDeltaChart } from "@/components/analytics/LapSplitDeltaChart";

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
            max-width: 1400px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; border-bottom: 1px solid #333; padding-bottom: 8px; }
          h3 { color: #EB0A1E; margin-top: 20px; font-size: 1.1em; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
          .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 15px 0; }
          .metric-item { background: #252525; padding: 12px; border-radius: 6px; border: 1px solid #333; }
          .metric-label { color: #888; font-size: 0.85em; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { color: #fff; font-size: 1.3em; font-weight: bold; font-family: 'Courier New', monospace; }
          .metric-sub { color: #aaa; font-size: 0.8em; margin-top: 4px; }
          .section { margin: 30px 0; }
          .highlight { background: #2a1a1a; border-left: 4px solid #EB0A1E; padding: 15px; margin: 12px 0; border-radius: 4px; }
          .warning { background: #2a1a1a; border-left: 4px solid #ffa500; padding: 15px; margin: 12px 0; border-radius: 4px; }
          .success { background: #1a2a1a; border-left: 4px solid #00ff00; padding: 15px; margin: 12px 0; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; background: #1a1a1a; border-radius: 8px; overflow: hidden; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
          th { background: #252525; color: #EB0A1E; font-weight: bold; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.5px; }
          tr:hover { background: #252525; }
          .confidence { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.85em; font-weight: bold; margin-left: 8px; }
          .confidence-high { background: #00ff00; color: #000; }
          .confidence-medium { background: #ffa500; color: #000; }
          .confidence-low { background: #ff4444; color: #fff; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; margin-left: 6px; }
          .badge-success { background: #00ff00; color: #000; }
          .badge-warning { background: #ffa500; color: #000; }
          .badge-danger { background: #ff4444; color: #fff; }
          .badge-info { background: #4488ff; color: #fff; }
        </style>
      </head>
      <body>
        <h1>Sebring International Raceway - Comprehensive AI Intelligence Report</h1>
        <p class="meta">Generated: 2025-02-14 14:32:18 UTC | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2 / Strategy Agent v1.5 / Coach Agent v1.3</p>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="highlight">
            <strong>Key Finding:</strong> Analysis of 1,488 telemetry samples across 30 vehicles reveals significant performance optimization opportunities, particularly in Sector 3 where consistent 0.8-1.2s losses occur during warm-up phases. Tire degradation modeling indicates optimal pit window at Lap 17-18 with 87% confidence. Driver clustering identifies three distinct performance profiles with Cluster 1 showing optimal balance between speed and tire management.
          </div>
        </div>

        <div class="section">
          <h2>Comprehensive Performance Statistics</h2>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-label">Total Telemetry Samples</div>
              <div class="metric-value">1,488,563</div>
              <div class="metric-sub">Across 30 vehicles, 45.6 min race</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Vehicles Analyzed</div>
              <div class="metric-value">30</div>
              <div class="metric-sub">100% field coverage</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Average Speed</div>
              <div class="metric-value">133.44 km/h</div>
              <div class="metric-sub">Std Dev: 5.5 km/h</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Best Lap Time</div>
              <div class="metric-value">2:03.847</div>
              <div class="metric-sub">Car #13, Lap 8</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Average Lap Time</div>
              <div class="metric-value">2:05.234</div>
              <div class="metric-sub">±0.312s consistency</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Average Tire Temperature</div>
              <div class="metric-value">92.4°C</div>
              <div class="metric-sub">Peak: 103.4°C (Cluster 2)</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Tire Degradation Rate</div>
              <div class="metric-value">0.047s/lap</div>
              <div class="metric-sub">Predicted cliff: Lap 18.2</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Brake Temperature Avg</div>
              <div class="metric-value">487°C</div>
              <div class="metric-sub">Peak: 623°C (Turn 17)</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Fuel Consumption</div>
              <div class="metric-value">3.2 L/lap</div>
              <div class="metric-sub">Estimated range: 24.5 laps</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Sector Performance Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Sector</th>
                <th>Best Time</th>
                <th>Average Time</th>
                <th>Std Dev</th>
                <th>Improvement Potential</th>
                <th>Consistency Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sector 1</strong></td>
                <td>26.850s</td>
                <td>26.961s</td>
                <td>0.089s</td>
                <td>0.111s <span class="badge badge-info">High</span></td>
                <td>99.2%</td>
              </tr>
              <tr>
                <td><strong>Sector 2</strong></td>
                <td>42.980s</td>
                <td>43.160s</td>
                <td>0.124s</td>
                <td>0.180s <span class="badge badge-warning">Medium</span></td>
                <td>98.8%</td>
              </tr>
              <tr>
                <td><strong>Sector 3</strong></td>
                <td>29.050s</td>
                <td>29.163s</td>
                <td>0.156s</td>
                <td>0.113s <span class="badge badge-danger">Critical</span></td>
                <td>99.5%</td>
              </tr>
            </tbody>
          </table>
          <div class="warning">
            <strong>⚠️ Sector 3 Performance Gap:</strong> Analysis reveals consistent 0.8-1.2s losses in Sector 3 during warm-up laps (Laps 1-3). This represents the largest single-lap time loss opportunity. Root cause analysis suggests tire warm-up strategy and potential setup adjustments for the final sector's technical sections.
          </div>
        </div>

        <div class="section">
          <h2>Detailed Driver Cluster Intelligence</h2>
          <div class="cluster">
            <h3>Cluster 0: Conservative Performance Profile (892 samples, 60.0%)</h3>
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-label">Average Speed</div>
                <div class="metric-value">130.77 km/h</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Tire Temperature</div>
                <div class="metric-value">87.78°C</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Lap Time Avg</div>
                <div class="metric-value">2:06.123</div>
              </div>
            </div>
            <p><strong>Characteristics:</strong> Conservative driving style with lower tire temperatures. Excellent tire preservation but sacrificing 2.3s per lap on average. Best suited for endurance racing or when tire conservation is critical.</p>
            <p><strong>Key Metrics:</strong> Brake pressure avg: 45.2 bar | Throttle application: 78% avg | Steering angle variance: ±2.1°</p>
          </div>
          <div class="cluster">
            <h3>Cluster 1: Optimal Performance Profile (446 samples, 30.0%)</h3>
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-label">Average Speed</div>
                <div class="metric-value">136.11 km/h</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Tire Temperature</div>
                <div class="metric-value">96.02°C</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Lap Time Avg</div>
                <div class="metric-value">2:04.456</div>
              </div>
            </div>
            <p><strong>Characteristics:</strong> Aggressive driving style with optimal tire management. Best balance between speed and tire preservation. This cluster represents the target performance profile.</p>
            <p><strong>Key Metrics:</strong> Brake pressure avg: 52.8 bar | Throttle application: 89% avg | Steering angle variance: ±1.8° | Tire wear rate: 0.041s/lap</p>
            <div class="success">
              <strong>✓ Recommended Profile:</strong> Drivers should aim to match Cluster 1 characteristics for optimal race performance.
            </div>
          </div>
          <div class="cluster">
            <h3>Cluster 2: Maximum Performance Profile (148 samples, 10.0%)</h3>
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-label">Average Speed</div>
                <div class="metric-value">143.12 km/h</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Tire Temperature</div>
                <div class="metric-value">103.40°C</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Lap Time Avg</div>
                <div class="metric-value">2:03.234</div>
              </div>
            </div>
            <p><strong>Characteristics:</strong> Maximum performance driving with high tire stress. Fastest lap times but unsustainable tire degradation rate of 0.062s/lap. Suitable only for qualifying or short sprint scenarios.</p>
            <p><strong>Key Metrics:</strong> Brake pressure avg: 61.3 bar | Throttle application: 96% avg | Steering angle variance: ±2.4° | Tire wear rate: 0.062s/lap <span class="badge badge-danger">High</span></p>
            <div class="warning">
              <strong>⚠️ Sustainability Warning:</strong> Cluster 2 performance is unsustainable beyond 8-10 laps. Tire degradation accelerates significantly after Lap 10.
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Tire Degradation Intelligence</h2>
          <table>
            <thead>
              <tr>
                <th>Tire Position</th>
                <th>Current Wear %</th>
                <th>Degradation Rate</th>
                <th>Predicted Cliff Lap</th>
                <th>Temperature Avg</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Front Left</strong></td>
                <td>68%</td>
                <td>0.043s/lap</td>
                <td>Lap 19.2</td>
                <td>91.2°C</td>
                <td><span class="badge badge-success">Optimal</span></td>
              </tr>
              <tr>
                <td><strong>Front Right</strong></td>
                <td>72%</td>
                <td>0.047s/lap</td>
                <td>Lap 18.5</td>
                <td>93.8°C</td>
                <td><span class="badge badge-warning">Monitor</span></td>
              </tr>
              <tr>
                <td><strong>Rear Left</strong></td>
                <td>76%</td>
                <td>0.052s/lap</td>
                <td>Lap 17.8</td>
                <td>95.4°C</td>
                <td><span class="badge badge-warning">Critical</span></td>
              </tr>
              <tr>
                <td><strong>Rear Right</strong></td>
                <td>71%</td>
                <td>0.045s/lap</td>
                <td>Lap 19.0</td>
                <td>92.1°C</td>
                <td><span class="badge badge-success">Optimal</span></td>
              </tr>
            </tbody>
          </table>
          <div class="highlight">
            <strong>AI Prediction Model:</strong> Based on physics-informed ML analysis, tire performance will degrade significantly after Lap 18.2. The rear left tire shows the highest degradation rate (0.052s/lap) and is predicted to reach critical wear threshold at Lap 17.8. <strong>Recommended pit window: Lap 17-18</strong> with 87% confidence.
          </div>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-label">Laps Until 0.5s Loss</div>
              <div class="metric-value">10.6 laps</div>
              <div class="metric-sub">From current position</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Optimal Pit Lap</div>
              <div class="metric-value">Lap 17</div>
              <div class="metric-sub">Confidence: 87%</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Tire Life Remaining</div>
              <div class="metric-value">28%</div>
              <div class="metric-sub">At optimal performance</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Strategic Intelligence & Recommendations</h2>
          
          <div class="recommendation">
            <h3>1. Pit Window Optimization <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommended Pit Lap:</strong> Lap 17 (Confidence: 87%)</p>
            <p><strong>Reasoning:</strong> Tire degradation modeling indicates performance cliff at Lap 18.2. Pitting on Lap 17 provides optimal balance between tire life and track position. Analysis of competitor pit windows suggests minimal traffic impact at this lap.</p>
            <p><strong>Expected Impact:</strong> Maintain competitive pace, avoid tire degradation penalty of 0.8-1.2s per lap after cliff point.</p>
            <p><strong>Risk Assessment:</strong> Low risk. Early pit (Lap 16) risks undercut opportunity loss. Late pit (Lap 19+) risks significant tire degradation penalty.</p>
            <p><strong>Alternative Strategy:</strong> If leading by >5s, consider extending to Lap 18 for track position advantage.</p>
          </div>

          <div class="recommendation">
            <h3>2. Sector 2 Braking Optimization <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Brake 3.2m later in Sector 2 to carry additional speed through Turn 5-7 complex</p>
            <p><strong>Confidence:</strong> 82%</p>
            <p><strong>Data Support:</strong> Cluster 1 drivers show 0.3-0.5s improvement with later braking points. Analysis of 446 samples indicates optimal braking point is 3.2m later than current average.</p>
            <p><strong>Expected Improvement:</strong> 0.3-0.5s per lap improvement potential</p>
            <p><strong>Implementation:</strong> Focus on Turn 5 entry. Current braking point: 145m marker. Recommended: 141.8m marker.</p>
            <p><strong>Risk:</strong> Low. Requires driver confidence but data shows consistent gains across Cluster 1 profile.</p>
          </div>

          <div class="recommendation">
            <h3>3. Sector 3 Warm-up Strategy <span class="confidence confidence-medium">MEDIUM CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Implement aggressive tire warm-up protocol for Sector 3 during first 3 laps</p>
            <p><strong>Confidence:</strong> 74%</p>
            <p><strong>Data Support:</strong> Analysis reveals consistent 0.8-1.2s losses in Sector 3 during warm-up phase. This represents largest single-lap time loss opportunity.</p>
            <p><strong>Expected Improvement:</strong> 0.8-1.2s per lap during warm-up phase, 0.3-0.4s per lap after tires are up to temperature</p>
            <p><strong>Implementation:</strong> Increase tire temperature by 4-6°C through more aggressive cornering in Sectors 1-2 during warm-up laps. Consider setup adjustment: reduce rear wing by 1 click for better Sector 3 performance.</p>
          </div>

          <div class="recommendation">
            <h3>4. Driver Consistency Coaching <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Focus on matching Cluster 1 performance profile characteristics</p>
            <p><strong>Confidence:</strong> 89%</p>
            <p><strong>Key Focus Areas:</strong></p>
            <ul>
              <li>Throttle application: Increase from current 78% to target 89% (Cluster 1 average)</li>
              <li>Brake pressure: Optimize to 52.8 bar average (currently 45.2 bar)</li>
              <li>Steering consistency: Reduce variance from ±2.1° to ±1.8°</li>
            </ul>
            <p><strong>Expected Impact:</strong> 1.7s per lap improvement potential by matching Cluster 1 profile</p>
          </div>
        </div>

        <div class="section">
          <h2>Competitor Analysis & Strategy</h2>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Car #</th>
                <th>Last Pit</th>
                <th>Predicted Next Pit</th>
                <th>Gap</th>
                <th>Strategy Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P1</td>
                <td>#13</td>
                <td>Lap 12</td>
                <td>Lap 20-21</td>
                <td>Leader</td>
                <td><span class="badge badge-success">Low</span></td>
              </tr>
              <tr>
                <td>P2</td>
                <td>#22</td>
                <td>Lap 11</td>
                <td>Lap 19-20</td>
                <td>+1.24s</td>
                <td><span class="badge badge-warning">Medium</span></td>
              </tr>
              <tr>
                <td>P3</td>
                <td>#7</td>
                <td>Lap 13</td>
                <td>Lap 21-22</td>
                <td>+2.18s</td>
                <td><span class="badge badge-info">Undercut Opportunity</span></td>
              </tr>
            </tbody>
          </table>
          <div class="highlight">
            <strong>Strategic Opportunity:</strong> P2 (Car #22) predicted to pit Lap 19-20. Early pit on Lap 17 provides undercut opportunity with estimated 0.8s advantage. Monitor P2 tire degradation closely - if they extend beyond Lap 20, undercut becomes highly favorable.
          </div>
        </div>

        <div class="section">
          <h2>Weather & Track Conditions Impact</h2>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-label">Track Temperature</div>
              <div class="metric-value">42°C</div>
              <div class="metric-sub">Peak: 48°C (Lap 12)</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Air Temperature</div>
              <div class="metric-value">28°C</div>
              <div class="metric-sub">Stable throughout race</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Humidity</div>
              <div class="metric-value">65%</div>
              <div class="metric-sub">Moderate</div>
            </div>
          </div>
          <p><strong>Impact Analysis:</strong> High track temperature (42-48°C) accelerates tire degradation by approximately 12% compared to baseline. This factor is already incorporated into the Lap 17 pit recommendation. Track grip remains consistent throughout race duration.</p>
        </div>

        <div class="section">
          <h2>Risk Assessment Matrix</h2>
          <table>
            <thead>
              <tr>
                <th>Risk Factor</th>
                <th>Severity</th>
                <th>Probability</th>
                <th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tire Degradation Cliff</td>
                <td><span class="badge badge-danger">High</span></td>
                <td>87%</td>
                <td>Pit before Lap 18</td>
              </tr>
              <tr>
                <td>Rear Left Tire Failure</td>
                <td><span class="badge badge-danger">High</span></td>
                <td>23%</td>
                <td>Monitor closely, pit early if degradation accelerates</td>
              </tr>
              <tr>
                <td>Brake Fade (Turn 17)</td>
                <td><span class="badge badge-warning">Medium</span></td>
                <td>34%</td>
                <td>Reduce brake pressure by 5% in Turn 17</td>
              </tr>
              <tr>
                <td>Traffic Impact (Pit Window)</td>
                <td><span class="badge badge-warning">Medium</span></td>
                <td>28%</td>
                <td>Lap 17 pit minimizes traffic risk</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Performance Prediction Model</h2>
          <div class="highlight">
            <strong>Lap Time Forecast (Next 5 Laps):</strong><br>
            Lap 14: 2:04.892 (predicted) | Lap 15: 2:05.234 | Lap 16: 2:05.567 | Lap 17: 2:05.901 | Lap 18: 2:06.456 (degradation impact)
          </div>
          <p><strong>Model Confidence:</strong> 84% | <strong>Based on:</strong> Historical degradation patterns, current tire wear, track temperature, and driver performance profile</p>
        </div>

        <div class="section">
          <h2>Action Items Summary</h2>
          <ol>
            <li><strong>IMMEDIATE:</strong> Prepare for pit stop on Lap 17. Confirm pit crew readiness and tire set selection.</li>
            <li><strong>HIGH PRIORITY:</strong> Coach driver on Sector 2 braking optimization (3.2m later braking point).</li>
            <li><strong>MEDIUM PRIORITY:</strong> Implement Sector 3 warm-up strategy for next race session.</li>
            <li><strong>MONITOR:</strong> Rear left tire degradation rate. If exceeds 0.055s/lap, consider early pit on Lap 16.</li>
            <li><strong>STRATEGIC:</strong> Monitor P2 pit window. If they pit after Lap 20, undercut opportunity becomes highly favorable.</li>
          </ol>
        </div>

        <div class="section">
          <p class="meta" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
            Report generated by PitWall A.I. Multi-Agent System | Model Version: v1.2.3 | Data Processing Time: 2.34s | Confidence Score: 87%
          </p>
        </div>
      </body>
    </html>
  `,
  road_america: `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #0a0a0a; color: #fff; line-height: 1.6; max-width: 1400px; margin: 0 auto; }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; border-bottom: 1px solid #333; padding-bottom: 8px; }
          h3 { color: #EB0A1E; margin-top: 20px; font-size: 1.1em; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
          .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 15px 0; }
          .metric-item { background: #252525; padding: 12px; border-radius: 6px; border: 1px solid #333; }
          .metric-label { color: #888; font-size: 0.85em; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { color: #fff; font-size: 1.3em; font-weight: bold; font-family: 'Courier New', monospace; }
          .metric-sub { color: #aaa; font-size: 0.8em; margin-top: 4px; }
          .section { margin: 30px 0; }
          .highlight { background: #2a1a1a; border-left: 4px solid #EB0A1E; padding: 15px; margin: 12px 0; border-radius: 4px; }
          .warning { background: #2a1a1a; border-left: 4px solid #ffa500; padding: 15px; margin: 12px 0; border-radius: 4px; }
          .success { background: #1a2a1a; border-left: 4px solid #00ff00; padding: 15px; margin: 12px 0; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; background: #1a1a1a; border-radius: 8px; overflow: hidden; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
          th { background: #252525; color: #EB0A1E; font-weight: bold; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.5px; }
          tr:hover { background: #252525; }
          .confidence { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.85em; font-weight: bold; margin-left: 8px; }
          .confidence-high { background: #00ff00; color: #000; }
          .confidence-medium { background: #ffa500; color: #000; }
          .confidence-low { background: #ff4444; color: #fff; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; margin-left: 6px; }
          .badge-success { background: #00ff00; color: #000; }
          .badge-warning { background: #ffa500; color: #000; }
          .badge-danger { background: #ff4444; color: #fff; }
          .badge-info { background: #4488ff; color: #fff; }
        </style>
      </head>
      <body>
        <h1>Road America - Comprehensive AI Intelligence Report</h1>
        <p class="meta">Generated: 2025-02-14 16:45:23 UTC | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2 / Strategy Agent v1.5 / Coach Agent v1.3</p>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="highlight">
            <strong>Key Finding:</strong> Analysis of 1,497 telemetry samples across 29 vehicles reveals critical brake fade issues in long downhill zones (+7°C caliper rise per lap), particularly in Carousel and Kettle Bottoms sections. Late apex technique at Turn 5 (Canada Corner) shows 0.4s improvement potential. Tire degradation modeling indicates optimal pit window at Lap 18 with 79% confidence. High-speed sections require careful brake management strategy.
          </div>
        </div>

        <div class="section">
          <h2>Comprehensive Performance Statistics</h2>
          <div class="metric-grid">
            <div class="metric-item"><div class="metric-label">Total Telemetry Samples</div><div class="metric-value">1,497,892</div><div class="metric-sub">Across 29 vehicles, 43.1 min race</div></div>
            <div class="metric-item"><div class="metric-label">Vehicles Analyzed</div><div class="metric-value">29</div><div class="metric-sub">100% field coverage</div></div>
            <div class="metric-item"><div class="metric-label">Average Speed</div><div class="metric-value">133.51 km/h</div><div class="metric-sub">Std Dev: 4.5 km/h</div></div>
            <div class="metric-item"><div class="metric-label">Best Lap Time</div><div class="metric-value">2:08.234</div><div class="metric-sub">Car #22, Lap 7</div></div>
            <div class="metric-item"><div class="metric-label">Average Lap Time</div><div class="metric-value">2:10.567</div><div class="metric-sub">±0.298s consistency</div></div>
            <div class="metric-item"><div class="metric-label">Average Tire Temperature</div><div class="metric-value">95.4°C</div><div class="metric-sub">Peak: 106.9°C (Cluster 2)</div></div>
            <div class="metric-item"><div class="metric-label">Tire Degradation Rate</div><div class="metric-value">0.044s/lap</div><div class="metric-sub">Predicted cliff: Lap 19.1</div></div>
            <div class="metric-item"><div class="metric-label">Brake Temperature Avg</div><div class="metric-value">523°C</div><div class="metric-sub">Peak: 712°C (Carousel)</div></div>
            <div class="metric-item"><div class="metric-label">Fuel Consumption</div><div class="metric-value">3.1 L/lap</div><div class="metric-sub">Estimated range: 25.2 laps</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Critical Brake Analysis</h2>
          <div class="warning">
            <strong>⚠️ Brake Fade Alert:</strong> Analysis reveals significant brake temperature rise of +7°C per lap in long downhill zones. Carousel (Turn 12) and Kettle Bottoms (Turn 5) show peak temperatures of 712°C and 689°C respectively. This represents critical risk factor requiring immediate attention.
          </div>
          <table>
            <thead>
              <tr>
                <th>Turn</th>
                <th>Brake Temp Avg</th>
                <th>Peak Temp</th>
                <th>Rise Rate</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Turn 5 (Canada Corner)</strong></td>
                <td>645°C</td>
                <td>689°C</td>
                <td>+6.2°C/lap</td>
                <td><span class="badge badge-warning">High</span></td>
              </tr>
              <tr>
                <td><strong>Turn 12 (Carousel)</strong></td>
                <td>678°C</td>
                <td>712°C</td>
                <td>+7.1°C/lap</td>
                <td><span class="badge badge-danger">Critical</span></td>
              </tr>
              <tr>
                <td><strong>Turn 14 (Kettle Bottoms)</strong></td>
                <td>623°C</td>
                <td>667°C</td>
                <td>+5.8°C/lap</td>
                <td><span class="badge badge-warning">High</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Strategic Intelligence & Recommendations</h2>
          
          <div class="recommendation">
            <h3>1. Pit Window Optimization <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommended Pit Lap:</strong> Lap 18 (Confidence: 79%)</p>
            <p><strong>Reasoning:</strong> Tire degradation modeling indicates performance cliff at Lap 19.1. Pitting on Lap 18 provides optimal balance and allows brake cooling opportunity. Long straights provide natural brake cooling between braking zones.</p>
            <p><strong>Expected Impact:</strong> Maintain competitive pace, avoid tire degradation penalty, provide brake cooling window.</p>
          </div>

          <div class="recommendation">
            <h3>2. Late Apex Technique - Canada Corner <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Later turn-in at Turn 5 (Canada Corner) to optimize exit speed</p>
            <p><strong>Confidence:</strong> 83%</p>
            <p><strong>Data Support:</strong> Cluster 1 drivers show 0.4s improvement with later turn-in technique. Analysis of 449 samples indicates optimal turn-in point is 2.8m later than current average.</p>
            <p><strong>Expected Improvement:</strong> 0.4s per lap improvement potential</p>
            <p><strong>Implementation:</strong> Focus on Turn 5 entry. Current turn-in: 78m marker. Recommended: 75.2m marker. Maintain throttle through apex for optimal exit speed.</p>
          </div>

          <div class="recommendation">
            <h3>3. Brake Management Strategy <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Reduce brake pressure by 8-10% in Carousel and Kettle Bottoms sections</p>
            <p><strong>Confidence:</strong> 88%</p>
            <p><strong>Data Support:</strong> Brake temperature rise of +7°C per lap in downhill zones indicates excessive brake usage. Reducing pressure by 8-10% should limit temperature rise to +4°C per lap.</p>
            <p><strong>Expected Impact:</strong> Reduce brake fade risk, extend brake pad life, maintain consistent braking performance throughout race.</p>
            <p><strong>Risk:</strong> Low. Requires driver confidence but data shows consistent benefits across field.</p>
          </div>

          <div class="recommendation">
            <h3>4. Throttle Application Optimization <span class="confidence confidence-medium">MEDIUM CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Smoother throttle pickup at corner exit to reduce tire stress</p>
            <p><strong>Confidence:</strong> 77%</p>
            <p><strong>Data Support:</strong> Analysis shows aggressive throttle application at corner exit increases tire temperature by 3-5°C and accelerates degradation.</p>
            <p><strong>Expected Improvement:</strong> Reduce tire degradation rate by 6-8%, improve tire life by 1-2 laps</p>
          </div>
        </div>

        <div class="section">
          <h2>Driver Cluster Intelligence</h2>
          <div class="cluster">
            <h3>Cluster 0: Conservative Pace (898 samples, 60.0%)</h3>
            <p><strong>Average Speed:</strong> 130.84 km/h | <strong>Tire Temp:</strong> 90.63°C | <strong>Lap Time Avg:</strong> 2:11.234</p>
            <p><strong>Characteristics:</strong> Conservative pace with excellent brake and tire preservation. Best suited for endurance scenarios.</p>
          </div>
          <div class="cluster">
            <h3>Cluster 1: Optimal Performance (449 samples, 30.0%)</h3>
            <p><strong>Average Speed:</strong> 136.18 km/h | <strong>Tire Temp:</strong> 100.17°C | <strong>Lap Time Avg:</strong> 2:09.567</p>
            <p><strong>Characteristics:</strong> Fast pace with optimal brake and tire management. Late apex technique at Canada Corner provides 0.4s advantage. <span class="badge badge-success">Target Profile</span></p>
          </div>
          <div class="cluster">
            <h3>Cluster 2: Maximum Performance (150 samples, 10.0%)</h3>
            <p><strong>Average Speed:</strong> 143.19 km/h | <strong>Tire Temp:</strong> 106.85°C | <strong>Lap Time Avg:</strong> 2:08.123</p>
            <p><strong>Characteristics:</strong> Maximum performance but high brake and tire stress. Unsustainable beyond 8-10 laps.</p>
          </div>
        </div>

        <div class="section">
          <h2>Risk Assessment Matrix</h2>
          <table>
            <thead>
              <tr>
                <th>Risk Factor</th>
                <th>Severity</th>
                <th>Probability</th>
                <th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Brake Fade (Carousel)</td>
                <td><span class="badge badge-danger">Critical</span></td>
                <td>78%</td>
                <td>Reduce brake pressure 8-10% in downhill zones</td>
              </tr>
              <tr>
                <td>Tire Degradation Cliff</td>
                <td><span class="badge badge-warning">High</span></td>
                <td>79%</td>
                <td>Pit before Lap 19</td>
              </tr>
              <tr>
                <td>Brake Pad Failure</td>
                <td><span class="badge badge-danger">High</span></td>
                <td>34%</td>
                <td>Monitor brake temps, consider pad compound change</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Action Items Summary</h2>
          <ol>
            <li><strong>IMMEDIATE:</strong> Implement brake management strategy - reduce pressure 8-10% in Carousel and Kettle Bottoms.</li>
            <li><strong>HIGH PRIORITY:</strong> Coach driver on late apex technique at Turn 5 (Canada Corner) - 0.4s improvement potential.</li>
            <li><strong>HIGH PRIORITY:</strong> Prepare for pit stop on Lap 18.</li>
            <li><strong>MEDIUM PRIORITY:</strong> Optimize throttle application at corner exit for tire preservation.</li>
            <li><strong>MONITOR:</strong> Brake temperatures in Carousel and Kettle Bottoms sections - critical risk areas.</li>
          </ol>
        </div>

        <div class="section">
          <p class="meta" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
            Report generated by PitWall A.I. Multi-Agent System | Model Version: v1.2.3 | Data Processing Time: 2.51s | Confidence Score: 79%
          </p>
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
            max-width: 1400px;
            margin: 0 auto;
          }
          h1 { color: #EB0A1E; border-bottom: 2px solid #EB0A1E; padding-bottom: 10px; }
          h2 { color: #EB0A1E; margin-top: 30px; border-bottom: 1px solid #333; padding-bottom: 8px; }
          h3 { color: #EB0A1E; margin-top: 20px; font-size: 1.1em; }
          .stat { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .insight { background: #1a1a1a; padding: 15px; border-left: 4px solid #EB0A1E; margin: 15px 0; }
          .cluster { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .recommendation { background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .meta { color: #888; font-size: 0.9em; }
          .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 15px 0; }
          .metric-item { background: #252525; padding: 12px; border-radius: 6px; border: 1px solid #333; }
          .metric-label { color: #888; font-size: 0.85em; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { color: #fff; font-size: 1.3em; font-weight: bold; font-family: 'Courier New', monospace; }
          .metric-sub { color: #aaa; font-size: 0.8em; margin-top: 4px; }
          .section { margin: 30px 0; }
          .highlight { background: #2a1a1a; border-left: 4px solid #EB0A1E; padding: 15px; margin: 12px 0; border-radius: 4px; }
          .warning { background: #2a1a1a; border-left: 4px solid #ffa500; padding: 15px; margin: 12px 0; border-radius: 4px; }
          .success { background: #1a2a1a; border-left: 4px solid #00ff00; padding: 15px; margin: 12px 0; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; background: #1a1a1a; border-radius: 8px; overflow: hidden; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
          th { background: #252525; color: #EB0A1E; font-weight: bold; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.5px; }
          tr:hover { background: #252525; }
          .confidence { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.85em; font-weight: bold; margin-left: 8px; }
          .confidence-high { background: #00ff00; color: #000; }
          .confidence-medium { background: #ffa500; color: #000; }
          .confidence-low { background: #ff4444; color: #fff; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; margin-left: 6px; }
          .badge-success { background: #00ff00; color: #000; }
          .badge-warning { background: #ffa500; color: #000; }
          .badge-danger { background: #ff4444; color: #fff; }
          .badge-info { background: #4488ff; color: #fff; }
        </style>
      </head>
      <body>
        <h1>Circuit of the Americas - Comprehensive AI Intelligence Report</h1>
        <p class="meta">Generated: 2025-02-14 15:18:42 UTC | Source: EDA Cluster Agent v0.9 / Predictor Agent v1.2 / Strategy Agent v1.5 / Coach Agent v1.3</p>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="highlight">
            <strong>Key Finding:</strong> Analysis of 1,539 telemetry samples across 30 vehicles reveals exceptional consistency in Sector 1 (high-speed esses) with ±0.03s delta, indicating optimal setup and driver technique. However, rear slip angle analysis shows concerning oversteer trend (+0.06°/lap) requiring setup attention. Tire degradation modeling indicates optimal pit window at Lap 17 with 84% confidence. The technical esses section (S1) represents a key competitive advantage area.
          </div>
        </div>

        <div class="section">
          <h2>Comprehensive Performance Statistics</h2>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-label">Total Telemetry Samples</div>
              <div class="metric-value">1,539,234</div>
              <div class="metric-sub">Across 30 vehicles, 48.2 min race</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Vehicles Analyzed</div>
              <div class="metric-value">30</div>
              <div class="metric-sub">100% field coverage</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Average Speed</div>
              <div class="metric-value">134.31 km/h</div>
              <div class="metric-sub">Std Dev: 5.5 km/h</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Best Lap Time</div>
              <div class="metric-value">2:12.456</div>
              <div class="metric-sub">Car #22, Lap 9</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Average Lap Time</div>
              <div class="metric-value">2:14.123</div>
              <div class="metric-sub">±0.287s consistency</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Average Tire Temperature</div>
              <div class="metric-value">93.0°C</div>
              <div class="metric-sub">Peak: 104.2°C (Cluster 2)</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Tire Degradation Rate</div>
              <div class="metric-value">0.051s/lap</div>
              <div class="metric-sub">Predicted cliff: Lap 17.8</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Brake Temperature Avg</div>
              <div class="metric-value">512°C</div>
              <div class="metric-sub">Peak: 678°C (Turn 1)</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Fuel Consumption</div>
              <div class="metric-value">3.4 L/lap</div>
              <div class="metric-sub">Estimated range: 23.2 laps</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Sector Performance Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Sector</th>
                <th>Best Time</th>
                <th>Average Time</th>
                <th>Std Dev</th>
                <th>Improvement Potential</th>
                <th>Consistency Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sector 1 (Esses)</strong></td>
                <td>28.234s</td>
                <td>28.267s</td>
                <td>0.023s</td>
                <td>0.033s <span class="badge badge-success">Excellent</span></td>
                <td>99.9%</td>
              </tr>
              <tr>
                <td><strong>Sector 2</strong></td>
                <td>45.123s</td>
                <td>45.456s</td>
                <td>0.134s</td>
                <td>0.333s <span class="badge badge-warning">Medium</span></td>
                <td>98.7%</td>
              </tr>
              <tr>
                <td><strong>Sector 3</strong></td>
                <td>40.234s</td>
                <td>40.567s</td>
                <td>0.156s</td>
                <td>0.333s <span class="badge badge-info">Opportunity</span></td>
                <td>98.6%</td>
              </tr>
            </tbody>
          </table>
          <div class="success">
            <strong>✓ Sector 1 Excellence:</strong> Exceptional consistency in the high-speed esses section with ±0.03s delta. This represents best-in-class performance and should be maintained. The technical nature of this section provides significant competitive advantage when executed consistently.
          </div>
          <div class="warning">
            <strong>⚠️ Oversteer Trend Detected:</strong> Rear slip angle analysis shows progressive increase of 0.06°/lap under high-load corners (Turns 3, 6, 12, 19). This indicates rear tire wear acceleration and potential setup imbalance. Monitor closely and consider rear wing adjustment.
          </div>
        </div>

        <div class="section">
          <h2>Detailed Driver Cluster Intelligence</h2>
          <div class="cluster">
            <h3>Cluster 0: Steady Performance Profile (923 samples, 60.0%)</h3>
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-label">Average Speed</div>
                <div class="metric-value">131.62 km/h</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Tire Temperature</div>
                <div class="metric-value">88.35°C</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Lap Time Avg</div>
                <div class="metric-value">2:15.234</div>
              </div>
            </div>
            <p><strong>Characteristics:</strong> Steady pace with excellent tire preservation. Sector 1 consistency is exceptional (±0.03s), demonstrating strong technical driving skills. Best suited for long stints and tire conservation strategies.</p>
            <p><strong>Key Metrics:</strong> Brake pressure avg: 48.3 bar | Throttle application: 81% avg | Steering angle variance: ±1.9° | Sector 1 consistency: 99.9%</p>
          </div>
          <div class="cluster">
            <h3>Cluster 1: Fast Pace Profile (462 samples, 30.0%)</h3>
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-label">Average Speed</div>
                <div class="metric-value">136.60 km/h</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Tire Temperature</div>
                <div class="metric-value">97.65°C</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Lap Time Avg</div>
                <div class="metric-value">2:13.567</div>
              </div>
            </div>
            <p><strong>Characteristics:</strong> Fast pace with optimal tire management. Maintains excellent Sector 1 performance while pushing harder in Sectors 2-3. This cluster represents the target performance profile for competitive racing.</p>
            <p><strong>Key Metrics:</strong> Brake pressure avg: 54.2 bar | Throttle application: 91% avg | Steering angle variance: ±2.0° | Tire wear rate: 0.048s/lap</p>
            <div class="success">
              <strong>✓ Recommended Profile:</strong> Cluster 1 demonstrates optimal balance between speed and tire preservation. Target this profile for race performance.
            </div>
          </div>
          <div class="cluster">
            <h3>Cluster 2: Peak Performance Profile (154 samples, 10.0%)</h3>
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-label">Average Speed</div>
                <div class="metric-value">144.25 km/h</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Tire Temperature</div>
                <div class="metric-value">104.16°C</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Lap Time Avg</div>
                <div class="metric-value">2:11.890</div>
              </div>
            </div>
            <p><strong>Characteristics:</strong> Maximum performance driving with high tire stress. Fastest lap times but unsustainable tire degradation rate of 0.068s/lap. Oversteer trend more pronounced (+0.08°/lap). Suitable only for qualifying or short sprint scenarios.</p>
            <p><strong>Key Metrics:</strong> Brake pressure avg: 63.8 bar | Throttle application: 97% avg | Steering angle variance: ±2.6° | Tire wear rate: 0.068s/lap <span class="badge badge-danger">High</span> | Rear slip angle: +0.08°/lap</p>
            <div class="warning">
              <strong>⚠️ Sustainability Warning:</strong> Cluster 2 performance shows accelerated rear tire wear and oversteer progression. Unsustainable beyond 7-9 laps. Oversteer trend requires immediate setup attention.
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Tire Degradation Intelligence</h2>
          <table>
            <thead>
              <tr>
                <th>Tire Position</th>
                <th>Current Wear %</th>
                <th>Degradation Rate</th>
                <th>Predicted Cliff Lap</th>
                <th>Temperature Avg</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Front Left</strong></td>
                <td>71%</td>
                <td>0.049s/lap</td>
                <td>Lap 18.5</td>
                <td>92.3°C</td>
                <td><span class="badge badge-success">Optimal</span></td>
              </tr>
              <tr>
                <td><strong>Front Right</strong></td>
                <td>69%</td>
                <td>0.047s/lap</td>
                <td>Lap 19.2</td>
                <td>91.8°C</td>
                <td><span class="badge badge-success">Optimal</span></td>
              </tr>
              <tr>
                <td><strong>Rear Left</strong></td>
                <td>78%</td>
                <td>0.056s/lap</td>
                <td>Lap 17.2</td>
                <td>96.4°C</td>
                <td><span class="badge badge-warning">Critical</span></td>
              </tr>
              <tr>
                <td><strong>Rear Right</strong></td>
                <td>76%</td>
                <td>0.054s/lap</td>
                <td>Lap 17.6</td>
                <td>95.1°C</td>
                <td><span class="badge badge-warning">Critical</span></td>
              </tr>
            </tbody>
          </table>
          <div class="highlight">
            <strong>AI Prediction Model:</strong> Rear tire degradation is accelerating faster than front tires (0.056s/lap vs 0.049s/lap), consistent with oversteer trend analysis. Performance cliff predicted at Lap 17.8. <strong>Recommended pit window: Lap 17</strong> with 84% confidence. Rear tire temperatures 3-4°C higher than front, indicating setup imbalance.
          </div>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-label">Laps Until 0.5s Loss</div>
              <div class="metric-value">9.8 laps</div>
              <div class="metric-sub">From current position</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Optimal Pit Lap</div>
              <div class="metric-value">Lap 17</div>
              <div class="metric-sub">Confidence: 84%</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Tire Life Remaining</div>
              <div class="metric-value">24%</div>
              <div class="metric-sub">At optimal performance</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Strategic Intelligence & Recommendations</h2>
          
          <div class="recommendation">
            <h3>1. Pit Window Optimization <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommended Pit Lap:</strong> Lap 17 (Confidence: 84%)</p>
            <p><strong>Reasoning:</strong> Rear tire degradation modeling indicates performance cliff at Lap 17.8. Pitting on Lap 17 provides optimal balance and avoids rear tire degradation penalty. Analysis accounts for oversteer trend acceleration.</p>
            <p><strong>Expected Impact:</strong> Maintain competitive pace, avoid 0.9-1.3s per lap degradation penalty after cliff point.</p>
            <p><strong>Risk Assessment:</strong> Low risk. Early pit (Lap 16) risks undercut opportunity. Late pit (Lap 18+) risks significant rear tire degradation and oversteer issues.</p>
          </div>

          <div class="recommendation">
            <h3>2. Setup Adjustment: Rear Wing Configuration <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Increase rear wing by 1-2 clicks to reduce oversteer trend and rear tire degradation</p>
            <p><strong>Confidence:</strong> 86%</p>
            <p><strong>Data Support:</strong> Rear slip angle increasing 0.06°/lap indicates setup imbalance. Rear tire temperatures 3-4°C higher than front, and rear tire degradation rate 14% faster than front.</p>
            <p><strong>Expected Impact:</strong> Reduce rear tire degradation rate by 8-12%, extend tire life by 1-2 laps, improve rear stability in high-load corners.</p>
            <p><strong>Trade-off:</strong> Potential 0.1-0.2s per lap loss in top speed, but gain in tire life and consistency more than compensates.</p>
          </div>

          <div class="recommendation">
            <h3>3. S-Turn Entry Rotation Optimization <span class="confidence confidence-medium">MEDIUM CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Earlier rotation before S-turn entries (Turns 3-6, 12-15) to improve mid-corner speed</p>
            <p><strong>Confidence:</strong> 71%</p>
            <p><strong>Data Support:</strong> Cluster 1 drivers show 0.2-0.4s improvement with earlier rotation technique. Analysis of 462 samples indicates optimal rotation point is 0.3-0.5s earlier than current average.</p>
            <p><strong>Expected Improvement:</strong> 0.2-0.4s per lap improvement potential in S-turn sections</p>
            <p><strong>Implementation:</strong> Focus on Turn 3-6 complex. Begin rotation 0.3s earlier, maintain throttle through rotation phase.</p>
          </div>

          <div class="recommendation">
            <h3>4. Maintain Sector 1 Excellence <span class="confidence confidence-high">HIGH CONFIDENCE</span></h3>
            <p><strong>Recommendation:</strong> Continue current Sector 1 (esses) technique - it represents competitive advantage</p>
            <p><strong>Confidence:</strong> 95%</p>
            <p><strong>Data Support:</strong> Sector 1 consistency of ±0.03s is exceptional and best-in-class. This technical section provides significant competitive advantage.</p>
            <p><strong>Action:</strong> No changes needed. Maintain current approach and setup for Sector 1.</p>
          </div>
        </div>

        <div class="section">
          <h2>Competitor Analysis & Strategy</h2>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Car #</th>
                <th>Last Pit</th>
                <th>Predicted Next Pit</th>
                <th>Gap</th>
                <th>Strategy Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P1</td>
                <td>#13</td>
                <td>Lap 11</td>
                <td>Lap 19-20</td>
                <td>Leader</td>
                <td><span class="badge badge-success">Low</span></td>
              </tr>
              <tr>
                <td>P2</td>
                <td>#22</td>
                <td>Lap 12</td>
                <td>Lap 20-21</td>
                <td>+0.89s</td>
                <td><span class="badge badge-info">Target</span></td>
              </tr>
              <tr>
                <td>P3</td>
                <td>#7</td>
                <td>Lap 10</td>
                <td>Lap 18-19</td>
                <td>+2.34s</td>
                <td><span class="badge badge-warning">Monitor</span></td>
              </tr>
            </tbody>
          </table>
          <div class="highlight">
            <strong>Strategic Opportunity:</strong> P2 (Car #22) predicted to pit Lap 20-21. Early pit on Lap 17 provides strong undercut opportunity with estimated 1.1s advantage. P3 (Car #7) pitting earlier (Lap 18-19) may create traffic window - monitor closely.
          </div>
        </div>

        <div class="section">
          <h2>Risk Assessment Matrix</h2>
          <table>
            <thead>
              <tr>
                <th>Risk Factor</th>
                <th>Severity</th>
                <th>Probability</th>
                <th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rear Tire Degradation Cliff</td>
                <td><span class="badge badge-danger">High</span></td>
                <td>84%</td>
                <td>Pit before Lap 18, adjust rear wing</td>
              </tr>
              <tr>
                <td>Oversteer Progression</td>
                <td><span class="badge badge-danger">High</span></td>
                <td>67%</td>
                <td>Increase rear wing 1-2 clicks</td>
              </tr>
              <tr>
                <td>Brake Fade (Turn 1)</td>
                <td><span class="badge badge-warning">Medium</span></td>
                <td>41%</td>
                <td>Reduce brake pressure by 6% in Turn 1</td>
              </tr>
              <tr>
                <td>Traffic Impact (Pit Window)</td>
                <td><span class="badge badge-warning">Medium</span></td>
                <td>32%</td>
                <td>Lap 17 pit minimizes traffic risk</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Performance Prediction Model</h2>
          <div class="highlight">
            <strong>Lap Time Forecast (Next 5 Laps):</strong><br>
            Lap 14: 2:13.890 (predicted) | Lap 15: 2:14.234 | Lap 16: 2:14.567 | Lap 17: 2:14.901 | Lap 18: 2:15.678 (degradation impact)
          </div>
          <p><strong>Model Confidence:</strong> 84% | <strong>Based on:</strong> Historical degradation patterns, current tire wear, oversteer trend, track temperature, and driver performance profile</p>
        </div>

        <div class="section">
          <h2>Action Items Summary</h2>
          <ol>
            <li><strong>IMMEDIATE:</strong> Prepare for pit stop on Lap 17. Confirm pit crew readiness and tire set selection.</li>
            <li><strong>HIGH PRIORITY:</strong> Adjust rear wing by 1-2 clicks to address oversteer trend and rear tire degradation.</li>
            <li><strong>HIGH PRIORITY:</strong> Monitor rear tire degradation closely. If exceeds 0.060s/lap, consider early pit on Lap 16.</li>
            <li><strong>MEDIUM PRIORITY:</strong> Coach driver on earlier rotation technique for S-turn entries (Turns 3-6, 12-15).</li>
            <li><strong>MAINTAIN:</strong> Continue current Sector 1 (esses) technique - it's providing competitive advantage.</li>
            <li><strong>STRATEGIC:</strong> Monitor P2 pit window. Early pit on Lap 17 provides strong undercut opportunity.</li>
          </ol>
        </div>

        <div class="section">
          <p class="meta" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
            Report generated by PitWall A.I. Multi-Agent System | Model Version: v1.2.3 | Data Processing Time: 2.67s | Confidence Score: 84%
          </p>
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

// Mock data generators for charts based on report content
function generateMockClusterData(trackId: string) {
  const baseData = {
    sebring: [
      { cluster: 0, avgSpeed: 130.77, tireTemp: 87.78, sampleCount: 892, description: "Conservative driving style, lower tire temperatures" },
      { cluster: 1, avgSpeed: 136.11, tireTemp: 96.02, sampleCount: 446, description: "Aggressive driving style, optimal tire management" },
      { cluster: 2, avgSpeed: 143.12, tireTemp: 103.40, sampleCount: 148, description: "Maximum performance, high tire stress" },
    ],
    road_america: [
      { cluster: 0, avgSpeed: 130.84, tireTemp: 90.63, sampleCount: 898, description: "Conservative pace" },
      { cluster: 1, avgSpeed: 136.18, tireTemp: 100.17, sampleCount: 449, description: "Optimal performance" },
      { cluster: 2, avgSpeed: 143.19, tireTemp: 106.85, sampleCount: 150, description: "Maximum effort" },
    ],
    cota: [
      { cluster: 0, avgSpeed: 131.62, tireTemp: 88.35, sampleCount: 923, description: "Steady pace" },
      { cluster: 1, avgSpeed: 136.60, tireTemp: 97.65, sampleCount: 462, description: "Fast pace" },
      { cluster: 2, avgSpeed: 144.25, tireTemp: 104.16, sampleCount: 154, description: "Peak performance" },
    ],
  };
  return baseData[trackId as keyof typeof baseData] || baseData.sebring;
}

function generateMockSpeedDistribution(trackId: string) {
  const ranges = ["100-110", "110-120", "120-130", "130-140", "140-150", "150-160", "160+"];
  const baseFreq = {
    sebring: [45, 120, 280, 420, 380, 200, 63],
    road_america: [42, 115, 275, 415, 375, 195, 60],
    cota: [48, 125, 290, 430, 390, 205, 68],
  };
  const frequencies = baseFreq[trackId as keyof typeof baseFreq] || baseFreq.sebring;
  const total = frequencies.reduce((a, b) => a + b, 0);
  
  return ranges.map((range, i) => ({
    speedRange: range,
    frequency: frequencies[i],
    percentage: (frequencies[i] / total) * 100,
  }));
}

function generateMockTireTempTrend(trackId: string) {
  const laps = Array.from({ length: 20 }, (_, i) => i + 1);
  const baseTemp = trackId === 'sebring' ? 87 : trackId === 'cota' ? 88 : 90;
  
  return laps.map(lap => ({
    lap,
    temperature: baseTemp + (lap * 0.4) + Math.sin(lap / 3) * 2,
    predicted: lap > 15 ? baseTemp + (lap * 0.45) + Math.sin(lap / 3) * 2 : undefined,
    threshold: 100,
  }));
}

function generateMockSectorData(trackId: string) {
  return [
    { sector: "Sector 1", avgTime: 26.961, bestTime: 26.850, consistency: 99.2, improvement: 0.111 },
    { sector: "Sector 2", avgTime: 43.160, bestTime: 42.980, consistency: 98.8, improvement: 0.180 },
    { sector: "Sector 3", avgTime: 29.163, bestTime: 29.050, consistency: 99.5, improvement: 0.113 },
  ];
}

export default function AISummaryReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const API_BASE = getAISummaryApiBase();

  // Generate mock chart data based on selected report
  const chartData = useMemo(() => {
    if (!selected) return null;
    
    return {
      clusterData: generateMockClusterData(selected),
      speedDistribution: generateMockSpeedDistribution(selected),
      tireTempTrend: generateMockTireTempTrend(selected),
      sectorData: generateMockSectorData(selected),
      avgSpeed: selected === 'sebring' ? 133.44 : selected === 'cota' ? 134.31 : 133.51,
      stdDev: selected === 'sebring' ? 5.5 : selected === 'cota' ? 5.5 : 4.5,
    };
  }, [selected]);

  // Manage preview URL for mock content
  useEffect(() => {
    if (selected) {
      const mockContent = MOCK_REPORT_CONTENT[selected];
      if (mockContent) {
        const blob = new Blob([mockContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        // For API-based reports, use the API URL directly
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [selected]);

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
                previewUrl ? (
                  // Use mock content from blob URL
                  <iframe
                    src={previewUrl}
                    title={`report-${selected}`}
                    className="w-full h-full border-0"
                  />
                ) : (
                  // Try API endpoint
                  (() => {
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
                                  setPreviewUrl(url);
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
                                setPreviewUrl(url);
                              } else {
                                setError("Failed to load report preview");
                              }
                            });
                        }}
                      />
                    );
                  })()
                )
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

      {/* Enhanced Data Analysis Charts Section */}
      {selected && chartData && (
        <section className="max-w-7xl mx-auto py-12 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Data Analysis & Visualizations</h2>
                <p className="text-gray-300 text-sm mt-1">
                  Comprehensive performance metrics and trends for {selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="tires" className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Tires & Temperature
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <DriverClusterChart
                    data={chartData.clusterData}
                    trackName={selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SpeedDistributionChart
                    data={chartData.speedDistribution}
                    trackName={selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    avgSpeed={chartData.avgSpeed}
                    stdDev={chartData.stdDev}
                  />
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SectorPerformanceChart
                  data={chartData.sectorData}
                  trackName={selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-card/60 backdrop-blur-md border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Lap Time Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <LapTimeTrendsChart />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SectorPerformanceChart
                  data={chartData.sectorData}
                  trackName={selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="tires" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <TireTemperatureTrendChart
                    data={chartData.tireTempTrend}
                    trackName={selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    showPrediction={true}
                    warningThreshold={100}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-card/60 backdrop-blur-md border-border/50 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary" />
                        Tire Wear Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <TireWearDistributionChart />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <LapSplitDeltaChart
                  track={selected}
                  race={1}
                  cars={[7, 13, 22]}
                  refCar={7}
                />
              </motion.div>
              <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <DriverClusterChart
                    data={chartData.clusterData}
                    trackName={selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SpeedDistributionChart
                    data={chartData.speedDistribution}
                    trackName={selected.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    avgSpeed={chartData.avgSpeed}
                    stdDev={chartData.stdDev}
                  />
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>

          {/* AI Insights Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI-Powered Insights Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <div className="text-sm font-semibold text-muted-foreground mb-2">Driver Clusters</div>
                    <div className="text-2xl font-bold">{chartData.clusterData.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {chartData.clusterData.reduce((sum, c) => sum + c.sampleCount, 0)} total samples analyzed
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <div className="text-sm font-semibold text-muted-foreground mb-2">Average Speed</div>
                    <div className="text-2xl font-bold">{chartData.avgSpeed.toFixed(2)} km/h</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Std Dev: {chartData.stdDev.toFixed(2)} km/h
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <div className="text-sm font-semibold text-muted-foreground mb-2">Sectors Analyzed</div>
                    <div className="text-2xl font-bold">{chartData.sectorData.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Performance metrics across all sectors
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}
    </main>
  );
}