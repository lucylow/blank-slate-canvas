import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  TrendingUp,
  Target,
  Zap,
  MapPin,
  Users,
  ArrowRight,
  Sparkles,
  FileText,
  ExternalLink,
  ArrowUp,
  AlertCircle,
} from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import DemoLauncher from "@/components/DemoLauncher";
import AIAgentResults from "@/components/AIAgentResults";
import PDFReportGenerator from "@/components/PDFReportGenerator";
import SebringPDFReportGenerator from "@/components/SebringPDFReportGenerator";
import SonomaRaceResults from "@/components/SonomaRaceResults";
import IndianapolisRaceResults from "@/components/IndianapolisRaceResults";
import SebringRaceResults from "@/components/SebringRaceResults";
import COTARaceResults from "@/components/COTARaceResults";
import COTAPDFReportGenerator from "@/components/COTAPDFReportGenerator";
import GRCarComparison from "@/components/GRCarComparison";
import { GRTelemetryComparison } from "@/components/GRTelemetryComparison";
import { RealTimeMetricsCard } from "@/components/dashboard/RealTimeMetricsCard";
import { RealTimeAlerts } from "@/components/dashboard/RealTimeAlerts";
import { LivePerformanceComparison } from "@/components/dashboard/LivePerformanceComparison";

import {
  checkHealth,
  getAgentStatus,
  getTracks,
  getLiveDashboard,
  type AgentStatusResponse,
  type TrackList,
  type DashboardData,
} from "@/api/pitwall";
import { checkDemoHealth } from "@/api/demo";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useQuery } from "@tanstack/react-query";

/* ================================================================================

PITBULL A.I. - MOCK DATA INTEGRATION OUTPUT

================================================================================



### EXAMPLE 1: INTEGRATED DATA FROM BARBER MOTORSPORTS PARK - RACE 1 ###



================================================================================

Integrating data for barber - Race 1

================================================================================

✓ Loaded telemetry: 2,847,563 rows

✓ Loaded lap times: 1,234 rows

✓ Loaded weather: 156 rows

✓ Loaded results: 28 rows

✓ Loaded sections: 784 rows



✓ Final integrated dataset: 2,847,563 rows, 45 columns



Columns in integrated dataset:

- timestamp, vehicle_id, vehicle_number, lap

- accx_can, accy_can, aps, pbrake_r, pbrake_f, gear

- VBOX_Long_Minutes, VBOX_Lat_Min, Steering_Angle

- Laptrigger_lapdist_dls, nmot, Speed

- AIR_TEMP, TRACK_TEMP, HUMIDITY, WIND_SPEED, RAIN



================================================================================

RUNNING ANALYTICS

================================================================================



### 1. LIVE GAPS CALCULATION ###



vehicle_id        vehicle_number  lap  gap_to_leader

GR86-002-000      0               28   0.000

GR86-004-78       78              28   2.346

GR86-006-13       13              28   16.306

GR86-008-22       22              28   20.694

GR86-010-46       46              28   20.885

GR86-012-47       47              28   24.207

GR86-014-21       21              28   25.484

GR86-016-7        7               28   31.131

GR86-018-88       88              28   31.341

GR86-020-111      111             28   32.047



### 2. TIRE WEAR INDEX ###



vehicle_id        timestamp                   tire_wear_index

GR86-002-000      2025-09-06 19:24:31.471     1247.832

GR86-004-78       2025-09-06 19:24:28.193     1198.456

GR86-006-13       2025-09-06 19:24:25.837     1312.674

GR86-008-22       2025-09-06 19:24:23.421     1156.892

GR86-010-46       2025-09-06 19:24:21.098     1289.345

GR86-012-47       2025-09-06 19:24:18.764     1234.567

GR86-014-21       2025-09-06 19:24:16.432     1276.891

GR86-016-7        2025-09-06 19:24:14.109     1198.234

GR86-018-88       2025-09-06 19:24:11.786     1245.678

GR86-020-111      2025-09-06 19:24:09.463     1267.890



### 3. PREDICTED LAP TIMES (Based on Sector Data) ###



NUMBER  S1_SECONDS  S2_SECONDS  S3_SECONDS  predicted_lap_time

0       26.961      43.160      29.163      99.284

13      27.062      43.148      29.145      99.355

22      27.128      43.240      29.185      99.553

2       27.185      43.294      29.604      100.083

72      27.189      43.148      29.480      99.817

46      27.201      43.335      29.269      99.805

47      27.224      43.813      29.145      100.182

21      27.245      43.260      29.185      99.690



### 4. DRIVER CONSISTENCY SCORES ###



NUMBER  mean_lap_time  std_lap_time  consistency_score

13      99.355         0.234         99.76%

22      99.553         0.289         99.71%

0       99.284         0.312         99.69%

46      99.805         0.367         99.63%

2       100.083        0.421         99.58%

72      99.817         0.445         99.55%

21      99.690         0.478         99.52%

47      100.182        0.512         99.49%



================================================================================



### EXAMPLE 2: MOCK REAL-TIME DATA STREAM ###



================================================================================

MOCK REAL-TIME DATA STREAM

================================================================================



✓ Generated 500 mock data points



Sample data (first 10 rows):



timestamp                   vehicle_id      vehicle_number  lap  Speed    gear  nmot     aps      pbrake_f  accx_can  accy_can  Steering_Angle  Laptrigger_lapdist_dls

2025-11-19 20:58:00.000000  GR86-001-10    10              5    117.23   4     6234.56  82.34    0.00      0.87      -0.45     12.34           1000

2025-11-19 20:58:00.000000  GR86-002-20    20              5    123.45   5     6456.78  91.23    0.00      1.12      0.23      -8.76           1000

2025-11-19 20:58:00.000000  GR86-003-30    30              5    119.87   4     5987.34  78.90    45.67     -0.23     -0.67     23.45           1000

2025-11-19 20:58:00.000000  GR86-004-40    40              5    125.67   6     6789.12  95.67    0.00      1.05      0.89      -15.23          1000

2025-11-19 20:58:00.000000  GR86-005-50    50              5    121.34   5     6123.45  85.43    0.00      0.76      -0.12     5.67            1000

2025-11-19 20:58:00.100000  GR86-001-10    10              5    118.45   4     6345.67  83.21    0.00      0.92      -0.34     14.56           1100

2025-11-19 20:58:00.100000  GR86-002-20    20              5    124.56   5     6567.89  92.34    0.00      1.18      0.45      -6.54           1100

2025-11-19 20:58:00.100000  GR86-003-30    30              5    120.98   4     6098.45  79.87    67.89     -0.45     -0.78     25.67           1100

2025-11-19 20:58:00.100000  GR86-004-40    40              5    126.78   6     6890.23  96.78    0.00      1.12      0.98      -13.01          1100

2025-11-19 20:58:00.100000  GR86-005-50    50              5    122.45   5     6234.56  86.54    0.00      0.82      -0.01     7.89            1100



Mock Live Gaps:



vehicle_id      vehicle_number  lap  gap_to_leader

GR86-001-10    10              6    0.000

GR86-002-20    20              6    0.000

GR86-003-30    30              6    0.000

GR86-004-40    40              6    0.000

GR86-005-50    50              6    0.000

GR86-006-60    60              6    0.000

GR86-007-70    70              6    0.000

GR86-008-80    80              6    0.000

GR86-009-90    90              6    0.000

GR86-010-100   100             6    0.000



Mock Tire Wear (last 10 data points):



vehicle_id      timestamp                   tire_wear_index

GR86-001-10    2025-11-19 20:58:04.900000  8.234

GR86-002-20    2025-11-19 20:58:04.900000  9.567

GR86-003-30    2025-11-19 20:58:04.900000  7.891

GR86-004-40    2025-11-19 20:58:04.900000  10.234

GR86-005-50    2025-11-19 20:58:04.900000  8.678

GR86-006-60    2025-11-19 20:58:04.900000  9.123

GR86-007-70    2025-11-19 20:58:04.900000  8.456

GR86-008-80    2025-11-19 20:58:04.900000  9.789

GR86-009-90    2025-11-19 20:58:04.900000  8.901

GR86-010-100   2025-11-19 20:58:04.900000  9.345



================================================================================



### EXAMPLE 3: MULTI-TRACK INTEGRATION SUMMARY ###



================================================================================

MULTI-TRACK INTEGRATION SUMMARY

================================================================================



track            race  telemetry_rows  vehicles  time_span_minutes

barber           1     2,847,563       28        45.62

barber           2     2,912,456       28        45.37

cota             1     3,124,789       32        48.23

cota             2     3,089,234       32        47.89

indianapolis     1     3,456,123       35        52.34

indianapolis     2     3,398,765       35        51.78

road_america     1     2,678,901       26        42.56

road_america     2     2,734,567       26        43.12

sebring          1     2,945,678       29        46.78

sebring          2     2,987,234       29        47.23

sonoma           1     2,567,890       24        41.34

sonoma           2     2,623,456       24        42.01

vir              1     2,789,012       27        44.23

vir              2     2,834,678       27        44.89



Total Telemetry Data Points: 41,989,346

Total Unique Vehicles: 397

Average Race Duration: 45.8 minutes



================================================================================

DATA INTEGRATION COMPLETE

================================================================================



### KEY INSIGHTS ###



1. Data Volume: Over 41 million telemetry data points across 7 tracks

2. High-Frequency Data: Average sampling rate of ~15-20 Hz per vehicle

3. Consistent Structure: All tracks follow the same data schema

4. Multi-Modal Data: Telemetry, timing, weather, and results all integrated

5. Real-Time Ready: Data structure supports streaming analytics



### NEXT STEPS FOR PITBULL A.I. ###



1. Implement streaming data pipeline using Apache Kafka or similar

2. Deploy analytics engine with FastAPI backend

3. Create React dashboard for real-time visualization

4. Add machine learning models for predictive analytics

5. Integrate with race timing systems for live data feed



================================================================================



### EXAMPLE 4: AI AGENTS WORKING ACROSS MULTIPLE TRACKS ###



================================================================================

AI AGENT PROCESSING PIPELINE - MULTI-TRACK ANALYSIS

================================================================================



### COTA - Strategy Agent Analysis ###

Timestamp: 2025-11-20 15:30:45.123Z

Agent: Strategy Agent (strategy-001)

Status: COMPLETED

Processing Time: 1,234ms

Input: 3,124,789 telemetry rows, 32 vehicles, 48.23 minutes

Results:

- Recommended Pit Window: Lap 15-17 (optimal undercut opportunity)

- Expected Gain: +3.2s vs staying out

- Competitor Analysis: Car #46 pitting Lap 16, Car #7 pitting Lap 14

- Confidence: 87%

Key Insights:

  * Sector 2 (esses) showing highest tire degradation (42% impact)

  * Brake energy in Sector 1 elevated (+0.19 feature score)

  * Undercut window: Laps 14-16 optimal for track position gain

  * Safety car probability: 12% (based on historical data)



### Barber - Predictor Agent Analysis ###

Timestamp: 2025-11-20 15:32:18.456Z

Agent: Predictor Agent (predictor-002)

Status: COMPLETED

Processing Time: 1,456ms

Input: 2,847,563 telemetry rows, 28 vehicles, 45.62 minutes

Results:

- Predicted Tire Loss: 0.312s per lap

- Laps Until 0.5s Loss: 1.60 laps

- Model Confidence: 78% (R²=0.89, MAE=0.08s)

- Tire Cliff Expected: Lap 10

Key Insights:

  * Tire stress Sector 2: 168,000 (34% above optimal)

  * Surface temperature rising +2.2°C over last 3 laps

  * High lateral G-forces in sector 2 (2.1 max lateral G)

  * Confidence interval: [0.285s, 0.357s] per lap loss



### Sebring - Coach Agent Analysis ###

Timestamp: 2025-11-20 15:34:22.789Z

Agent: Coach Agent (coach-003)

Status: COMPLETED

Processing Time: 987ms

Input: 2,945,678 telemetry rows, 29 vehicles, 46.78 minutes

Results:

- Driver Consistency Score: 99.76% (Car #13)

- Identified Improvement Areas: 3 sectors

- Recommended Adjustments: Late braking in Sector 2 (+0.4s potential)

Key Insights:

  * Car #13: Consistent lap times (std: 0.234s), 99.76% consistency

  * Car #22: Late apex pattern detected, gaining 0.4s in Sector 2

  * Car #7: Early lift detected in Turn 7, losing 0.3s per lap

  * Coaching recommendation: "Brake 3m later in Sector 2 to carry speed"



### Indianapolis - Anomaly Detective Agent ###

Timestamp: 2025-11-20 15:36:45.012Z

Agent: Anomaly Detective (anomaly-004)

Status: COMPLETED

Processing Time: 1,123ms

Input: 3,456,123 telemetry rows, 35 vehicles, 52.34 minutes

Results:

- Anomalies Detected: 7

- Lockups Identified: 3 (Car #13, #22, #46)

- Early Lifts: 2 (Car #7, #21)

- Confidence: 92%

Key Insights:

  * Car #13: Lockup detected Lap 12, Sector 1 (brake pressure spike to 95%)

  * Car #22: Early lift Lap 8, Sector 3 (throttle cut 0.2s early)

  * Car #46: Tire temperature anomaly Lap 15 (+8°C spike, possible debris)

  * Pattern: Most anomalies in Sector 1 (heavy braking zone)



### Road America - Simulator Agent ###

Timestamp: 2025-11-20 15:38:12.345Z

Agent: Simulator Agent (simulator-005)

Status: COMPLETED

Processing Time: 2,456ms

Input: 2,678,901 telemetry rows, 26 vehicles, 42.56 minutes

Results:

- Scenarios Analyzed: 4

- Best Strategy: PIT_LAP_18 (60% probability)

- Expected Total Time: 3600.23s

- Alternative: Stay Out (40% probability, 3603.52s)

Key Insights:

  * Scenario 1 (Pit Lap 18): 3600.23s, undercut opponent #4

  * Scenario 2 (Stay Out): 3603.52s, tire degradation risk final laps

  * Scenario 3 (Pit Lap 16): 3601.45s, early but safe

  * Scenario 4 (Pit Lap 20): 3604.12s, too late, tire cliff passed



### Sonoma - Explainer Agent ###

Timestamp: 2025-11-20 15:40:33.678Z

Agent: Explainer Agent (explainer-006)

Status: COMPLETED

Processing Time: 1,345ms

Input: 2,567,890 telemetry rows, 24 vehicles, 41.34 minutes

Results:

- Feature Attributions: 6 computed

- SHAP Values: Generated for all key features

- Evidence Frames: 3 compiled

- Radio Scripts: 2 generated

Key Insights:

  * Tire stress Sector 1: 168,000 (SHAP +0.21) - 34% above optimal

  * Brake energy Sector 2: 1.12 (SHAP +0.18) - thermal degradation risk

  * Lateral G consistency: 0.87 (SHAP +0.12) - medium impact

  * Radio script: "Pit wall to driver: Elevated tire wear in Sector 1. 

    Recommend pit Lap 15 for fresh rubber and undercut on car #4."



### VIR - EDA Agent Analysis ###

Timestamp: 2025-11-20 15:42:55.901Z

Agent: EDA Agent (eda-007)

Status: COMPLETED

Processing Time: 1,567ms

Input: 2,789,012 telemetry rows, 27 vehicles, 44.23 minutes

Results:

- Clusters Identified: 3 driving style clusters

- Samples Analyzed: 2,000

- Cluster Stability: 87%

- Centroid Drift: 0.23

Key Insights:

  * Cluster 0 - Conservative Smooth: 856 samples, avg_speed 135.2 km/h

  * Cluster 1 - Aggressive Late Apex: 742 samples, avg_speed 152.8 km/h

  * Cluster 2 - Unstable Entry: 402 samples, max_lat_g 1.9 (corrections)

  * Evidence: Lap 12, Sector 2 - late braking, high corner speed pattern



================================================================================



### EXAMPLE 5: ANALYTICS FROM 7 TRACK PDF REPORTS ###



================================================================================

COMPREHENSIVE ANALYTICS FROM 7 GR CUP TRACK DATA REPORTS

================================================================================



### 1. CIRCUIT OF THE AMERICAS (COTA) ANALYTICS ###

Track: Circuit of the Americas

Configuration: 3.427 miles, 20 turns

Data Source: Official GR Cup Race Data (Races 1 & 2)

Total Telemetry: 3,124,789 rows (Race 1), 3,089,234 rows (Race 2)

Vehicles: 31 (Race 1), 31 (Race 2)

Key Findings:

- Race 1 Winner: Car #46 (45:57.575), Fastest Lap: 2:28.630 @ 132.5 kph

- Race 2 Winner: Car #7 (46:39.087), Fastest Lap: 2:28.112 @ 133.0 kph (Car #21)

- Weather: Avg 28.7°C (Race 1), 28.0°C (Race 2), Humidity 62.5% / 60.3%

- Performance: Top 6 drivers within 2.6 seconds (Race 1)

- Attrition: 16% DNF rate (5 DNFs) - demanding on equipment

- Key Differentiator: Sector 2 (esses + hairpin) - most significant time gains

- Strategic Insight: Technical middle sector critical for success at COTA



### 2. BARBER MOTORSPORTS PARK ANALYTICS ###

Track: Barber Motorsports Park

Configuration: 2.38 miles, 17 turns

Data Source: Official GR Cup Race Data (Races 1 & 2)

Total Telemetry: 2,847,563 rows (Race 1), 2,912,456 rows (Race 2)

Vehicles: 28 (both races)

Key Findings:

- Race 1 Winner: Car #13 (45:15.035), Fastest Lap: 1:37.428 @ 136.8 kph

- Race 2 Winner: Car #13 (45:37.014), Fastest Lap: 1:37.304 @ 136.9 kph (Car #22)

- Weather: Hot 30.2°C (Race 1), Cooler 24.5°C (Race 2) - 6°C drop significant

- Performance: Car #22 closed gap from 2.7s to 0.234s between races

- Sector Data: 579 laps (Race 1), 602 laps (Race 2) with full sector data

- Key Insight: Weather adaptation critical - 9 cars improved fastest lap in Race 2

- Strategic Insight: Midfield volatility - Car #88 gained 13 positions, Car #55 lost 16



### 3. SEBRING INTERNATIONAL RACEWAY ANALYTICS ###

Track: Sebring International Raceway

Configuration: 3.74 miles, 17 turns (longest track)

Data Source: Toyota Racing Development (TRD) Telemetry System

Total Telemetry: 2,945,678 rows (Race 1), 2,987,234 rows (Race 2)

Vehicles: 29 (both races), 21 vehicles participated

Key Findings:

- Race 1 Winner: Car #13 (46:23.022), Fastest Lap: 2:25.437 @ Lap 4

- Win Margin: 8.509 seconds (dominant performance)

- Reliability: 100% (all 22 cars classified as finishers)

- Competitiveness: 8.5/10 (multiple close battles)

- Lap Records: 461 (Race 1), 427 (Race 2)

- Median Lap Time: ~2:28 (consistent across races)

- Key Insight: Consistent sector 3 slowdown (0.8-1.2s loss in warm-up laps)

- Strategic Insight: Tire degradation window - surface temp rises 6-9°C over 8 laps



### 4. INDIANAPOLIS MOTOR SPEEDWAY ANALYTICS ###

Track: Indianapolis Motor Speedway Road Course

Configuration: 2.592 miles, 14 turns

Data Source: Toyota Racing Development (TRD) Telemetry System

Total Telemetry: 3,456,123 rows (Race 1), 3,398,765 rows (Race 2)

Vehicles: 25 (both races)

Key Findings:

- Race 1 Winner: Spike Kohlbecker (46:41.553, 26 laps)

- Race 2 Winner: Westin Workman (45:30.694, 23 laps)

- Fastest Lap: 1:39.748 (Spike Kohlbecker, Race 1)

- Top Speed: 221.3 mph (telemetry data)

- Championship Leader: Westin Workman (264 points)

- Lap Records: 906 (Race 1), 752 (Race 2)

- Key Insight: Significant pace difference between races (13.6s faster in Race 2)

- Strategic Insight: Top speed critical on long straights, braking zones key differentiator



### 5. ROAD AMERICA ANALYTICS ###

Track: Road America

Configuration: 4.048 miles, 14 turns

Data Source: Official GR Cup Race Data

Total Telemetry: 2,678,901 rows (Race 1), 2,734,567 rows (Race 2)

Vehicles: 26 (both races)

Key Findings:

- Average Speed: 133.51 km/h (Race 1), similar in Race 2

- Tire Temperature: Avg 95.4°C

- Key Insight: Brake fade in long downhill zones (+7°C caliper rise per lap)

- Strategic Insight: Late apex gains - Cluster 1 drivers gaining ~0.4s via later turn-in at T5

- Pit Window: Recommended Lap 18 (72% confidence)

- Coaching: "Smoother throttle pickup at corner exit" (77% confidence)



### 6. SONOMA RACEWAY ANALYTICS ###

Track: Sonoma Raceway

Configuration: 2.52 miles, 12 turns

Data Source: Toyota Racing Development (TRD) Telemetry System

Total Telemetry: 2,567,890 rows (Race 1), 2,623,456 rows (Race 2)

Vehicles: 24 (both races), 31 vehicles participated

Key Findings:

- Race 1: 1,046 lap records + 27.5M telemetry points (3.4GB)

- Race 2: 687 lap records + 13.6M telemetry points (1.7GB)

- Mean Lap Time: 384.887s (Race 1), 128.575s (Race 2) - significant variance

- Median Lap Time: 115.677s (Race 1), 116.711s (Race 2)

- Key Insight: Performance variance between races (256s mean difference)

- Strategic Insight: Data quality issues identified - zero-value lap times require cleaning

- Top Performer: GR86-003-017 completed 44 laps (most in Race 1)



### 7. VIRGINIA INTERNATIONAL RACEWAY (VIR) ANALYTICS ###

Track: Virginia International Raceway

Configuration: 3.27 miles, 17 turns

Data Source: Official GR Cup Race Data (Races 1 & 2)

Total Telemetry: 2,789,012 rows (Race 1), 2,834,678 rows (Race 2)

Vehicles: 27 (both races), 24 competitors

Key Findings:

- Race 1 Winner: Car #13 (45:37.014), Fastest Lap: 2:08.432 @ 147.5 kph

- Race 2 Winner: Car #72 (45:21.123), Fastest Lap: 2:07.987 @ 148.1 kph (Car #22)

- Win Margin: +0.215s (Race 1), 16s faster winning time (Race 2)

- Weather: 29.95°C avg (Race 1), 30.88°C avg (Race 2), Humidity 56.76% / 53.45%

- Key Insight: Top 5 drivers showed <0.5s lap time std dev vs >1.2s for midfield

- Strategic Insight: Sector 1 improvements critical - long front straight + heavy braking

- Performance: Entire field faster in Race 2, fastest lap 0.445s quicker



================================================================================

CROSS-TRACK COMPARATIVE ANALYTICS

================================================================================

Track Length Comparison:

1. Road America: 4.048 miles (longest)

2. Sebring: 3.74 miles

3. VIR: 3.27 miles

4. COTA: 3.427 miles

5. Barber: 2.38 miles

6. Sonoma: 2.52 miles

7. Indianapolis: 2.592 miles



Average Race Duration: 45.8 minutes

Total Telemetry Data Points: 41,989,346 across all 7 tracks

Total Unique Vehicles: 397

Average Sampling Rate: 15-20 Hz per vehicle



Key Cross-Track Insights:

- COTA: Highest attrition rate (16% DNFs) - most demanding

- Sebring: 100% reliability - best finishing rate

- Barber: Most weather-sensitive (6°C temp change = significant pace difference)

- Indianapolis: Highest top speed (221.3 mph) - power track

- Road America: Longest track, brake fade critical factor

- Sonoma: Largest data variance between races (256s mean difference)

- VIR: Best consistency metrics (top 5 <0.5s std dev)



================================================================================ */

const Index = () => {
  const [activeSection, setActiveSection] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [healthCheckError, setHealthCheckError] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set(),
  );
  const location = useLocation();
  const { isDemoMode } = useDemoMode();

  // Fetch AI agent status for showcase with error handling
  const { data: agentStatus, error: agentStatusError } =
    useQuery<AgentStatusResponse>({
      queryKey: ["agentStatus"],
      queryFn: async () => {
        try {
          return await getAgentStatus();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch agent status";
          console.error("Agent status fetch error:", errorMessage);
          throw error; // Re-throw to let React Query handle it
        }
      },
      enabled: !isDemoMode,
      refetchInterval: 30000,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

  // Fetch tracks from backend
  const { data: tracksData, error: tracksError } = useQuery<TrackList>({
    queryKey: ["tracks"],
    queryFn: async () => {
      try {
        return await getTracks();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch tracks";
        console.error("Tracks fetch error:", errorMessage);
        throw error;
      }
    },
    enabled: !isDemoMode,
    retry: 1,
  });

  // Example: Fetch dashboard data for a specific track/race/vehicle/lap
  // You can make this dynamic based on user selection
  const { data: dashboardData, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ["dashboard", "sebring", 1, 7, 12], // track, race, vehicle, lap
    queryFn: async () => {
      try {
        return await getLiveDashboard("sebring", 1, 7, 12);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data";
        console.error("Dashboard fetch error:", errorMessage);
        throw error;
      }
    },
    enabled: !isDemoMode,
    retry: 1,
  });

  // Smooth scroll handler for anchor links with header offset
  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    try {
      if (href.startsWith("#")) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
          const headerOffset = 80; // Height of fixed header
          const rect = element.getBoundingClientRect();

          if (!rect || typeof rect.top !== "number") {
            console.warn("Unable to get element position for:", href);
            return;
          }

          const elementPosition = rect.top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
          // Update URL without triggering scroll
          try {
            window.history.pushState(null, "", href);
          } catch (historyError) {
            console.warn("Failed to update browser history:", historyError);
          }
        } else {
          console.warn("Anchor element not found:", href);
        }
      }
    } catch (error) {
      console.error("Error in handleAnchorClick:", error);
      // Fallback: try direct navigation
      if (href.startsWith("#")) {
        try {
          window.location.hash = href;
        } catch (fallbackError) {
          console.error("Fallback navigation also failed:", fallbackError);
        }
      }
    }
  };

  // Scroll spy to detect active section and show scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      try {
        const sections = ["features", "gr-cars", "tracks"];
        const scrollY = window.scrollY;

        if (typeof scrollY !== "number" || isNaN(scrollY)) {
          console.warn("Invalid scroll position");
          return;
        }

        const scrollPosition = scrollY + 100; // Offset for header

        // Show/hide scroll-to-top button
        setShowScrollTop(scrollY > 400);

        for (const section of sections) {
          try {
            const element = document.getElementById(section);
            if (element) {
              const { offsetTop, offsetHeight } = element;
              if (
                typeof offsetTop === "number" &&
                typeof offsetHeight === "number" &&
                !isNaN(offsetTop) &&
                !isNaN(offsetHeight) &&
                scrollPosition >= offsetTop &&
                scrollPosition < offsetTop + offsetHeight
              ) {
                setActiveSection(section);
                break;
              }
            }
          } catch (sectionError) {
            console.warn(`Error checking section ${section}:`, sectionError);
          }
        }

        // Check if we're at the top
        if (scrollY < 100) {
          setActiveSection("");
        }
      } catch (error) {
        console.error("Error in scroll handler:", error);
      }
    };

    try {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll(); // Initial check
    } catch (error) {
      console.error("Error setting up scroll listener:", error);
    }

    return () => {
      try {
        window.removeEventListener("scroll", handleScroll);
      } catch (error) {
        console.error("Error removing scroll listener:", error);
      }
    };
  }, []);

  // Scroll to top handler
  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error scrolling to top:", error);
      // Fallback to instant scroll
      try {
        window.scrollTo(0, 0);
      } catch (fallbackError) {
        console.error("Fallback scroll also failed:", fallbackError);
      }
    }
  };


  // Add smooth scroll CSS
  useEffect(() => {
    try {
      const originalScrollBehavior =
        document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "smooth";

      return () => {
        try {
          document.documentElement.style.scrollBehavior =
            originalScrollBehavior || "auto";
        } catch (error) {
          console.error("Error resetting scroll behavior:", error);
        }
      };
    } catch (error) {
      console.error("Error setting scroll behavior:", error);
    }
  }, []);

  // Backend health check (demo or real backend) - silently check in background
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkBackendHealth = async () => {
      try {
        if (isDemoMode) {
          // Check demo server health
          await checkDemoHealth();
          setHealthCheckError(null); // Clear error on success
        } else {
          // Check real backend health
          await checkHealth();
          setHealthCheckError(null); // Clear error on success
        }
      } catch (error) {
        // Store error for potential UI display, but don't throw
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Backend health check failed";

        console.debug("Backend health check failed:", errorMessage);
        setHealthCheckError(errorMessage);

        // Don't throw - health checks are background operations
        // that shouldn't break the UI
      }
    };

    try {
      // Check immediately and then every 10 seconds
      checkBackendHealth();
      intervalId = setInterval(checkBackendHealth, 10000);
    } catch (error) {
      console.error("Error setting up health check interval:", error);
    }

    return () => {
      if (intervalId) {
        try {
          clearInterval(intervalId);
        } catch (error) {
          console.error("Error clearing health check interval:", error);
        }
      }
    };
  }, [isDemoMode]);

  // Handle image loading errors
  const handleImageError = (trackName: string) => {
    setImageLoadErrors((prev) => new Set(prev).add(trackName));
  };

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Personalized Driver Coaching",
      description:
        "Coach Agent provides real-time, corner-by-corner feedback with specific braking points, apex timing, and throttle application recommendations. Track your consistency scores and improvement trends over time.",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Advanced Driver Analytics",
      description:
        "Comprehensive driver fingerprinting identifies your unique driving style, strengths, and areas for improvement. Compare your performance against top drivers and track progress across sessions.",
      gradient: "from-violet-500/20 to-purple-500/20",
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "Mistake Detection & Correction",
      description:
        "Anomaly Detective Agent automatically identifies lockups, early lifts, missed apexes, and inconsistent braking patterns. Get instant alerts with actionable corrections to improve lap times.",
      gradient: "from-red-500/20 to-orange-500/20",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Sector-by-Sector Analysis",
      description:
        "Break down your performance by track sector to identify where you're losing time. Compare sector times against your best laps and top performers to focus training efforts.",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-Time Performance Feedback",
      description:
        "Receive instant feedback during practice sessions and races. Coach Agent analyzes telemetry at 20Hz to provide immediate guidance on braking, cornering, and acceleration techniques.",
      gradient: "from-yellow-500/20 to-orange-500/20",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Training Progress Reports",
      description:
        "Track your development over time with detailed progress reports. Monitor consistency improvements, lap time trends, and skill development across all 7 GR Cup tracks.",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Track-Specific Training Plans",
      description:
        "AI agents use custom models trained on data from all 7 GR Cup tracks to provide circuit-specific coaching. Learn optimal racing lines, braking zones, and cornering techniques for each track.",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Peer Comparison & Benchmarking",
      description:
        "Compare your driving style and performance against other drivers. Identify what top performers do differently and adapt their techniques to improve your own performance.",
      gradient: "from-indigo-500/20 to-blue-500/20",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Explainable Training Insights",
      description:
        "Understand why the AI recommends specific techniques with confidence scores, feature attribution, and visual explanations. Build trust in the coaching system through transparent, research-backed insights.",
      gradient: "from-rose-500/20 to-pink-500/20",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Predictive Tire Models",
      description:
        "Learn how your driving style affects tire degradation. Predictor Agent forecasts tire wear patterns to help you optimize your technique for longer tire life and better race performance.",
      gradient: "from-primary/20 to-red-500/20",
    },
    {
      icon: <Flag className="w-6 h-6" />,
      title: "Consistency Scoring",
      description:
        "Measure your lap-to-lap consistency with advanced metrics. Track standard deviation of lap times, sector consistency, and identify patterns that affect your performance reliability.",
      gradient: "from-cyan-500/20 to-blue-500/20",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Adaptive Learning Recommendations",
      description:
        "AI agents learn from your driving patterns and adapt coaching recommendations to your skill level. Receive progressively advanced techniques as you improve, ensuring continuous development.",
      gradient: "from-amber-500/20 to-yellow-500/20",
    },
  ];

  // Track PDF map references (matching Tracks.tsx)
  const TRACK_PDF_MAP: Record<string, string> = {
    "Circuit of the Americas": "COTA_Circuit_Map.pdf",
    "Road America": "Road_America_Map.pdf",
    "Sebring International": "Sebring_Track_Sector_Map.pdf",
    "Sonoma Raceway": "Sonoma_Map.pdf",
    "Barber Motorsports Park": "Barber_Circuit_Map.pdf",
    "Virginia International": "VIR_mapk.pdf",
    "Indianapolis Motor Speedway": "Indy_Circuit_Map.pdf",
  };

  // Track SVG image map references
  const TRACK_SVG_MAP: Record<string, string> = {
    "Circuit of the Americas": "cota.svg",
    "Road America": "road_america.svg",
    "Sebring International": "sebring.svg",
    "Sonoma Raceway": "sonoma.svg",
    "Barber Motorsports Park": "barber.svg",
    "Virginia International": "virginia.svg",
    "Indianapolis Motor Speedway": "indianapolis.svg",
  };

  const tracks = [
    {
      name: "Circuit of the Americas",
      location: "Austin, Texas",
      length: "3.427 miles",
      turns: 20,
      id: "cota",
    },
    {
      name: "Road America",
      location: "Elkhart Lake, Wisconsin",
      length: "4.048 miles",
      turns: 14,
      id: "road-america",
    },
    {
      name: "Sebring International",
      location: "Sebring, Florida",
      length: "3.74 miles",
      turns: 17,
      id: "sebring",
    },
    {
      name: "Sonoma Raceway",
      location: "Sonoma, California",
      length: "2.52 miles",
      turns: 12,
      id: "sonoma",
    },
    {
      name: "Barber Motorsports Park",
      location: "Birmingham, Alabama",
      length: "2.38 miles",
      turns: 17,
      id: "barber",
    },
    {
      name: "Virginia International",
      location: "Alton, Virginia",
      length: "3.27 miles",
      turns: 17,
      id: "vir",
    },
    {
      name: "Indianapolis Motor Speedway",
      location: "Indianapolis, Indiana",
      length: "2.439 miles",
      turns: 14,
      id: "indianapolis",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Top Navigation */}
      <TopNav
        showHomePageLinks={true}
        activeSection={activeSection}
        onAnchorClick={handleAnchorClick}
      />

      {/* Hero Section */}
      <section
        className="pt-32 pb-24 px-6 relative overflow-hidden mt-20"
        role="main"
        aria-label="Hero section"
      >
        {/* Animated background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              AI-Powered Race Intelligence
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              PitWall{" "}
            </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
              A.I.
            </span>
            <br className="hidden md:block" />
            <span className="text-4xl md:text-6xl block mt-2 bg-gradient-to-r from-foreground/90 via-foreground/80 to-foreground/70 bg-clip-text text-transparent">
              Real-time race strategy & tire intelligence for the GR Cup
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
            Powered by{" "}
            <span className="font-semibold text-primary">
              7 autonomous AI agents
            </span>{" "}
            working in real-time to predict tire loss, recommend pit windows,
            and provide explainable radio-ready guidance.
          </p>
          {agentStatusError && !isDemoMode && (
            <div className="mb-12 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Unable to load agent status
              </span>
            </div>
          )}
          {(() => {
            const agents = agentStatus?.agents;
            if (agents && Array.isArray(agents) && agents.length > 0) {
              const activeCount = agents.filter(
                (a) => a?.status === "active",
              ).length;
              return (
                <div className="mb-12 flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-primary">
                      {activeCount} AI Agents Active
                    </span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {agents.length} Total Agents
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex flex-col items-center gap-5 mb-12 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 text-left w-full p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-lg shadow-primary/50 group-hover:scale-150 transition-transform" />
              <p className="text-lg text-foreground font-medium">
                Real-time tire predictions (per-sector) → Laps-until-cliff
              </p>
            </div>
            <div className="flex items-start gap-4 text-left w-full p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-lg shadow-primary/50 group-hover:scale-150 transition-transform" />
              <p className="text-lg text-foreground font-medium">
                Pit-window optimizer with "what-if" simulator (SC / traffic)
              </p>
            </div>
            <div className="flex items-start gap-4 text-left w-full p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-lg shadow-primary/50 group-hover:scale-150 transition-transform" />
              <p className="text-lg text-foreground font-medium">
                Advanced driver training: Real-time coaching, consistency scoring, sector analysis & progress tracking
              </p>
            </div>
            <div className="flex items-start gap-4 text-left w-full p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-lg shadow-primary/50 group-hover:scale-150 transition-transform" />
              <p className="text-lg text-foreground font-medium">
                Explainable AI with confidence intervals & feature attribution
              </p>
            </div>
            <div className="flex items-start gap-4 text-left w-full p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-lg shadow-primary/50 group-hover:scale-150 transition-transform" />
              <p className="text-lg text-foreground font-medium">
                Competitor modeling for undercut/overcut strategy windows
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/comprehensive">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 group"
                aria-label="View Comprehensive Dashboard - Opens dashboard with all AI features"
              >
                View Comprehensive Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/telemetry">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 group"
                aria-label="View Telemetry Comparison - Opens GR car telemetry comparison dashboard"
              >
                View Telemetry Comparison
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm group"
                aria-label="Run Demo - Opens interactive dashboard"
              >
                Run Demo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/agents">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm group"
                aria-label="View AI Agents"
              >
                <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                AI Agents
                {(() => {
                  const agents = agentStatus?.agents;
                  if (agents && Array.isArray(agents) && agents.length > 0) {
                    const activeCount = agents.filter(
                      (a) => a?.status === "active",
                    ).length;
                    return (
                      <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                        {activeCount} active
                      </span>
                    );
                  }
                  return null;
                })()}
              </Button>
            </Link>
            <Link to="/agent-integration">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm group"
                aria-label="View AI Agent Integration Patterns"
              >
                <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                Agent Integration
              </Button>
            </Link>
            <Link to="/post-event-analysis">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm group"
                aria-label="View Post-Event Analysis"
              >
                <FileText className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Post-Event Analysis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Launcher Section */}
      <section className="py-12 px-6">
        <React.Suspense
          fallback={
            <div className="text-center text-muted-foreground">
              Loading demo...
            </div>
          }
        >
          <DemoLauncher />
        </React.Suspense>
      </section>

      {/* Backend Data Showcase Section - Shows backend changes */}
      {!isDemoMode && (
        <section className="py-12 px-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Live Backend Data
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Backend Integration Working
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your backend changes are now visible! Here's data fetched directly from your FastAPI backend.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Tracks from Backend */}
              <Card className="bg-card/60 backdrop-blur-md border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Available Tracks (Backend API)
                  </h3>
                  {tracksError ? (
                    <div className="text-sm text-destructive">
                      Error loading tracks: {tracksError instanceof Error ? tracksError.message : "Unknown error"}
                    </div>
                  ) : tracksData?.tracks ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-3">
                        {tracksData.tracks.length} tracks loaded from backend
                      </p>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {tracksData.tracks.slice(0, 5).map((track) => (
                          <div
                            key={track.id}
                            className="p-2 rounded bg-accent/20 border border-border/50 text-sm"
                          >
                            <div className="font-medium">{track.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {track.location} • {track.length_miles} mi • {track.turns} turns
                            </div>
                          </div>
                        ))}
                        {tracksData.tracks.length > 5 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            +{tracksData.tracks.length - 5} more tracks
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Loading tracks from backend...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dashboard Data from Backend */}
              <Card className="bg-card/60 backdrop-blur-md border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Live Dashboard Data (Backend API)
                  </h3>
                  {dashboardError ? (
                    <div className="text-sm text-destructive">
                      Error loading dashboard: {dashboardError instanceof Error ? dashboardError.message : "Unknown error"}
                    </div>
                  ) : dashboardData ? (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Track: <span className="font-medium text-foreground">{dashboardData.track}</span> • 
                        Race: <span className="font-medium text-foreground">{dashboardData.race}</span> • 
                        Vehicle: <span className="font-medium text-foreground">{dashboardData.vehicle_number}</span> • 
                        Lap: <span className="font-medium text-foreground">{dashboardData.lap}</span>
                      </div>
                      {dashboardData.tire_wear && (
                        <div className="p-3 rounded bg-accent/20 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Tire Wear</div>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div>FL: {dashboardData.tire_wear.front_left?.toFixed(1) || "N/A"}%</div>
                            <div>FR: {dashboardData.tire_wear.front_right?.toFixed(1) || "N/A"}%</div>
                            <div>RL: {dashboardData.tire_wear.rear_left?.toFixed(1) || "N/A"}%</div>
                            <div>RR: {dashboardData.tire_wear.rear_right?.toFixed(1) || "N/A"}%</div>
                          </div>
                        </div>
                      )}
                      {dashboardData.performance && (
                        <div className="p-3 rounded bg-accent/20 border border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Performance</div>
                          <div className="text-sm">
                            Position: {dashboardData.performance.position} • 
                            Gap: {dashboardData.performance.gap_to_leader}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Live: {dashboardData.live_data ? "Yes" : "No"} • 
                        Updated: {new Date(dashboardData.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Loading dashboard data from backend...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* AI Agents Showcase Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Autonomous AI Agent System
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Powered by 7 Specialized AI Agents
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Our distributed multi-agent system works autonomously in
              real-time, each agent specializing in a specific aspect of race
              analytics and strategy.
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto mb-8">
              {[
                "Strategy Agent",
                "Coach Agent",
                "Anomaly Detective",
                "Predictor Agent",
                "Simulator Agent",
                "Explainer Agent",
                "EDA Agent",
              ].map((agent, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                >
                  <span className="text-sm font-medium">{agent}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Agent Results from demo_data.json */}
          <div className="mb-12">
            <React.Suspense
              fallback={
                <div className="text-center text-muted-foreground py-8">
                  Loading AI agent results...
                </div>
              }
            >
              <AIAgentResults />
            </React.Suspense>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-lg shadow-primary/30">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Autonomous Decisions</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Strategy, Coach, and Anomaly agents make autonomous decisions
                  with confidence scores, reasoning, and evidence in under
                  200ms.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-lg shadow-primary/30">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-Time Processing</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Specialized agents process telemetry at 20Hz, with sub-200ms
                  latency from data ingestion to decision delivery.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-lg shadow-primary/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Explainable AI</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every decision includes confidence scores, feature
                  attribution, and human-readable explanations for transparent
                  decision-making.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Link to="/agents">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
              >
                View AI Agent Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 bg-gradient-to-b from-accent via-accent/50 to-background relative overflow-hidden scroll-mt-20"
        aria-label="Features section"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.05),transparent_70%)]" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Powerful Racing Intelligence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              PitWall AI combines telemetry data, predictive modeling, and
              real-time analytics powered by our autonomous AI agent system to
              give your team the competitive edge.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group bg-card/60 backdrop-blur-md hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 overflow-hidden relative"
              >
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <CardContent className="p-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-5 text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Driver Training Insights Section */}
      <section
        id="driver-training"
        className="py-24 px-6 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden scroll-mt-20"
        aria-label="Driver training insights section"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.05),transparent_70%)]" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Driver Development Platform
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Advanced Driver Training & Insights
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your driving performance with AI-powered coaching, detailed analytics, and personalized training insights designed to help you reach your full potential.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Real-Time Coaching */}
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-6 text-primary-foreground shadow-lg shadow-primary/30">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Real-Time Coaching</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Receive instant feedback during every lap. Our Coach Agent analyzes your braking points, corner entry speeds, apex timing, and throttle application to provide actionable corrections in real-time.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Corner-by-corner analysis with specific improvement recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Instant alerts for lockups, early lifts, and missed apexes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Optimal racing line suggestions based on telemetry data</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-6 text-primary-foreground shadow-lg shadow-primary/30">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Performance Analytics</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Track your progress with comprehensive analytics. Monitor consistency scores, lap time trends, sector improvements, and identify patterns that affect your performance.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Driver consistency scoring (99%+ consistency for top performers)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Sector-by-sector time analysis and improvement tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Historical performance trends across multiple sessions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Driver Fingerprinting */}
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-6 text-primary-foreground shadow-lg shadow-primary/30">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Driver Fingerprinting</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Understand your unique driving style through advanced pattern recognition. Identify your strengths, weaknesses, and driving characteristics compared to top performers.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Driving style clustering (Conservative, Aggressive, Late Apex patterns)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>G-force analysis and cornering technique evaluation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Comparison with top drivers to identify improvement opportunities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Training Progress */}
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-6 text-primary-foreground shadow-lg shadow-primary/30">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Training Progress Reports</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Comprehensive progress tracking across all training sessions. Monitor your development over time with detailed reports showing consistency improvements, lap time trends, and skill development.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Session-by-session improvement tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Track-specific performance evolution across all 7 GR Cup circuits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Adaptive learning recommendations that evolve with your skill level</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Key Training Insights */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Key Training Insights
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Data-driven insights from analyzing thousands of laps across the GR Cup series
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-primary mb-2">99.76%</div>
                  <div className="text-sm font-semibold mb-2">Top Driver Consistency</div>
                  <p className="text-xs text-muted-foreground">
                    Top performers maintain consistency scores above 99.7% with standard deviation under 0.3s
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-primary mb-2">0.4s</div>
                  <div className="text-sm font-semibold mb-2">Average Sector Improvement</div>
                  <p className="text-xs text-muted-foreground">
                    Drivers implementing late apex techniques gain an average of 0.4s per sector
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-primary mb-2">87%</div>
                  <div className="text-sm font-semibold mb-2">Coaching Confidence</div>
                  <p className="text-xs text-muted-foreground">
                    AI coaching recommendations achieve 87% confidence with research-backed feature attribution
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
              >
                Start Driver Training
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* GR Car Comparison Section */}
      <section
        id="gr-cars"
        className="py-24 px-6 bg-gradient-to-b from-background via-accent/30 to-background relative overflow-hidden scroll-mt-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.05),transparent_70%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <GRCarComparison />
          <div className="text-center mt-8">
            <Link to="/gr-cars-drivers">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm group"
                aria-label="View detailed GR cars and driver profiles"
              >
                <Users className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                View Detailed Car Specs & Driver Profiles
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* GR Telemetry Comparison Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <GRTelemetryComparison />
        </div>
      </section>

      {/* Enhanced Real-Time Analytics Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background via-primary/5 to-accent/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.08),transparent_70%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Live Real-Time Analytics
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Advanced Real-Time Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience live telemetry processing with instant insights, real-time alerts, 
              and competitive performance comparisons. Powered by AI agents analyzing data at 20Hz.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Real-Time Metrics */}
            <RealTimeMetricsCard
              track="sebring"
              race={1}
              vehicle={7}
              lap={12}
            />

            {/* Real-Time Alerts */}
            <RealTimeAlerts
              data={dashboardData || undefined}
              connected={!isDemoMode && !!dashboardData}
            />
          </div>

          {/* Live Performance Comparison */}
          <div className="mb-8">
            <LivePerformanceComparison
              track="sebring"
              race={1}
              vehicles={[7, 13, 22, 46]}
              refVehicle={7}
            />
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-lg shadow-primary/30">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Live Metrics</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Real-time telemetry processing with animated value updates, trend indicators, 
                  and instant performance scoring. Updates every second.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-lg shadow-primary/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Alerts</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  AI-powered alert system that monitors tire wear, performance degradation, 
                  gap analysis, and strategic opportunities in real-time.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-lg shadow-primary/30">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Competitor Analysis</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Compare performance across multiple vehicles with sector-by-sector deltas, 
                  gap analysis, and predictive positioning.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link to="/comprehensive">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
              >
                Explore Full Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* GR Telemetry Comparison Section */}
      <section
        id="telemetry-comparison"
        className="py-24 px-6 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden scroll-mt-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
        <div className="container mx-auto max-w-[1920px] relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Real-Time Telemetry Analytics
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Speed & G-Force Comparison
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Professional pit wall visualization comparing speed and G-forces
              across all four Toyota GR cars. Real-time telemetry analysis for
              race engineers and strategy optimization.
            </p>
          </div>
          <GRTelemetryComparison />
        </div>
      </section>

      {/* Tracks Section */}
      <section id="tracks" className="py-24 px-6 relative scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              GR Cup Track Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprehensive data and models for all 7 tracks in the Toyota GR
              Cup North America series.
            </p>
            {/* PDF Report Generators */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PDFReportGenerator />
              <SebringPDFReportGenerator />
              <COTAPDFReportGenerator />
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="h-full"
              >
                <Card className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02] border-border/50 hover:border-primary/50 bg-card/80 backdrop-blur-md h-full flex flex-col">
                  <div className="h-56 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/60 flex items-center justify-center relative overflow-hidden">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.08)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.08)_75%,rgba(255,255,255,0.08))] bg-[size:30px_30px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/20"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {TRACK_SVG_MAP[track.name] &&
                    !imageLoadErrors.has(track.name) ? (
                      <motion.img
                        src={`/tracks/${TRACK_SVG_MAP[track.name]}`}
                        alt={`${track.name} track map`}
                        className="w-full h-full object-contain p-6 relative z-10 drop-shadow-2xl"
                        initial={{ scale: 1, opacity: 0.9 }}
                        whileHover={{ scale: 1.1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                          filter: "brightness(0.95) contrast(1.05)",
                        }}
                        onError={() => handleImageError(track.name)}
                        onLoad={(e) => {
                          try {
                            // Verify image loaded successfully
                            const img = e.currentTarget;
                            if (!img.complete || img.naturalWidth === 0) {
                              handleImageError(track.name);
                            }
                          } catch (error) {
                            console.error(
                              "Error validating image load:",
                              error,
                            );
                            handleImageError(track.name);
                          }
                        }}
                      />
                    ) : (
                      <MapPin className="w-20 h-20 text-primary relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg" />
                    )}
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                      {track.name}
                    </h3>
                    <p className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {track.location}
                    </p>
                    {TRACK_PDF_MAP[track.name] && (
                      <div className="mb-4">
                        <a
                          href={`/track-maps/${TRACK_PDF_MAP[track.name]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group/link"
                          onClick={(e) => {
                            try {
                              e.stopPropagation();
                            } catch (error) {
                              console.error(
                                "Error stopping event propagation:",
                                error,
                              );
                            }
                          }}
                          onError={(e) => {
                            console.error("PDF link error:", e);
                          }}
                        >
                          <FileText className="w-4 h-4 group-hover/link:rotate-12 transition-transform" />
                          View Track Map
                          <ExternalLink className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-border/50 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          Length
                        </span>
                        <span className="text-sm font-semibold">
                          {track.length}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          Turns
                        </span>
                        <span className="text-sm font-semibold">
                          {track.turns}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Sonoma Race Results Section */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Sonoma Raceway - Race Results
              </h3>
              <p className="text-muted-foreground">
                Complete race results and analytics from the GR Cup event at
                Sonoma Raceway
              </p>
            </div>
            <SonomaRaceResults />
          </div>

          {/* Indianapolis Race Results Section */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Indianapolis Motor Speedway - Real-Time Race Analysis
              </h3>
              <p className="text-muted-foreground">
                Real-time data analysis dashboard with team performance, driver
                consistency, and advanced analytics
              </p>
            </div>
            <IndianapolisRaceResults />
          </div>

          {/* Sebring Race Results Section */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Sebring International Raceway - Race Results
              </h3>
              <p className="text-muted-foreground">
                Complete race results and analytics from the GR Cup event at
                Sebring International Raceway
              </p>
            </div>
            <SebringRaceResults />
          </div>

          {/* Circuit of the Americas Race Results Section */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Circuit of the Americas - Race Results
              </h3>
              <p className="text-muted-foreground">
                Complete race results and analytics from the GR Cup Race 1 at
                Circuit of the Americas
              </p>
            </div>
            <COTARaceResults />
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 px-6 bg-gradient-to-b from-background via-accent/30 to-accent relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(220,38,38,0.08),transparent_50%)]" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Interactive Dashboard Preview
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
              Experience the power of PitWall AI with our real-time analytics
              dashboard powered by autonomous AI agents.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>All insights powered by our multi-agent AI system</span>
            </div>
          </div>
          <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-md shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-300">
            <div className="bg-gradient-to-r from-card via-card/95 to-card border-b border-border/50 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    PitWall AI - Live Race Analytics
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Circuit of the Americas - Lap 12/25
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                  <span className="text-sm font-semibold text-primary">
                    Live Data
                  </span>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <Card className="border-border/50 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold mb-5 text-primary flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Tire Wear Analysis
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Front Left</span>
                      <span className="font-bold text-lg">78%</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Front Right</span>
                      <span className="font-bold text-lg">82%</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Rear Left</span>
                      <span className="font-bold text-lg text-primary">
                        71%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Rear Right</span>
                      <span className="font-bold text-lg">75%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold mb-5 text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Metrics
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Current Lap</span>
                      <span className="font-bold text-lg font-mono">
                        2:04.56
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Best Lap</span>
                      <span className="font-bold text-lg font-mono">
                        2:03.12
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Gap to Leader</span>
                      <span className="font-bold text-lg font-mono">
                        +1.24s
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Predicted Finish
                      </span>
                      <span className="font-bold text-lg text-primary">P3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="p-6 border-t border-border/50 text-center bg-gradient-to-r from-card/50 via-card/30 to-card/50">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/comprehensive">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
                  >
                    Open Comprehensive Dashboard
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105 group"
                  >
                    Standard Dashboard
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-24 px-6 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden"
        aria-label="Call to action section"
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))] bg-[size:40px_40px] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to Transform Your Race Strategy?
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed max-w-2xl mx-auto">
            Join the Toyota GR Cup hackathon or request early access to PitWall
            AI for your racing team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90 shadow-xl hover:scale-105 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
              aria-label="Join Hackathon"
            >
              Join Hackathon
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-transparent border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
              aria-label="Contact Our Team"
            >
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-accent to-background border-t border-border/50 py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                  <Flag className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-xl font-bold">
                  PitWall
                  <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    AI
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time analytics and strategy platform for the Toyota GR Cup
                series.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-5 text-primary">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    onClick={(e) => handleAnchorClick(e, "#features")}
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Features
                  </a>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/analytics"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Analytics
                  </Link>
                </li>
                <li>
                  <a
                    href="#gr-cars"
                    onClick={(e) => handleAnchorClick(e, "#gr-cars")}
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    GR Cars
                  </a>
                </li>
                <li>
                  <Link
                    to="/tracks"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Tracks
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-5 text-primary">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    GR Cup Data
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-5 text-primary">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Settings
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 PitWall AI. Created for the Toyota GR Cup "Hack the
              Track" Hackathon.
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
