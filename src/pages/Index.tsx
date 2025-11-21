import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, TrendingUp, Target, Zap, MapPin, Users, ArrowRight, Sparkles, Menu, X, FileText, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import DemoLauncher from "@/components/DemoLauncher";

import { checkHealth } from "@/api/pitwall";
import { checkDemoHealth } from "@/api/demo";
import { useDemoMode } from "@/hooks/useDemoMode";

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

================================================================================ */

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<{ ok: boolean }>({ ok: false });
  const location = useLocation();
  const { isDemoMode } = useDemoMode();

  // Smooth scroll handler for anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMobileMenuOpen(false);
      }
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Add smooth scroll CSS
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Backend health check (demo or real backend)
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        if (isDemoMode) {
          // Check demo server health
          const health = await checkDemoHealth();
          setBackendHealth({ ok: health.ok || health.status === "healthy" || false });
        } else {
          // Check real backend health
          const health = await checkHealth();
          setBackendHealth({ ok: health.ok || health.status === "healthy" || false });
        }
      } catch (error) {
        setBackendHealth({ ok: false });
      }
    };

    // Check immediately and then every 10 seconds
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-Time Analytics",
      description: "Process live telemetry data to provide instant insights on car performance, tire wear, and race strategy.",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Predictive Tire Models",
      description: "AI algorithms forecast tire degradation and recommend optimal pit stop windows with 95% accuracy.",
      gradient: "from-primary/20 to-red-500/20"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Driver Performance",
      description: "Analyze driver inputs and provide actionable feedback to improve lap times and consistency.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Strategy Optimization",
      description: "Simulate race scenarios to determine the optimal strategy for qualifying and race conditions.",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Track-Specific Models",
      description: "Custom AI models trained on data from all 7 GR Cup tracks for circuit-specific insights.",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: <Flag className="w-6 h-6" />,
      title: "Live Gap Analysis",
      description: "Monitor real-time gaps to competitors and calculate overtaking opportunities.",
      gradient: "from-indigo-500/20 to-blue-500/20"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Explainable AI & Trust",
      description: "Research-backed confidence intervals, uncertainty bands, and feature attribution for transparent decision-making.",
      gradient: "from-emerald-500/20 to-teal-500/20"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Driver Coaching Insights",
      description: "Corner-by-corner analysis with anomaly detection (lockups, early lifts) and actionable coaching feedback.",
      gradient: "from-violet-500/20 to-purple-500/20"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Competitor Modeling",
      description: "Predict competitor pit timing and identify undercut/overcut windows for strategic advantage.",
      gradient: "from-rose-500/20 to-pink-500/20"
    }
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

  const tracks = [
    { name: "Circuit of the Americas", location: "Austin, Texas", length: "3.427 miles", turns: 20, id: "cota" },
    { name: "Road America", location: "Elkhart Lake, Wisconsin", length: "4.048 miles", turns: 14, id: "road-america" },
    { name: "Sebring International", location: "Sebring, Florida", length: "3.74 miles", turns: 17, id: "sebring" },
    { name: "Sonoma Raceway", location: "Sonoma, California", length: "2.52 miles", turns: 12, id: "sonoma" },
    { name: "Barber Motorsports Park", location: "Birmingham, Alabama", length: "2.38 miles", turns: 17, id: "barber" },
    { name: "Virginia International", location: "Alton, Virginia", length: "3.27 miles", turns: 17, id: "vir" },
    { name: "Indianapolis Motor Speedway", location: "Indianapolis, Indiana", length: "2.439 miles", turns: 14, id: "indianapolis" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
              <Flag className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold tracking-tight">
              PitWall<span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">AI</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="Main navigation">
            <a 
              href="#features" 
              onClick={(e) => handleAnchorClick(e, '#features')}
              className="text-sm font-medium hover:text-primary transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </a>
            <Link 
              to="/tracks" 
              className="text-sm font-medium hover:text-primary transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
            >
              Tracks
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link 
              to="/analytics" 
              className="text-sm font-medium hover:text-primary transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
            >
              Analytics
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link 
              to="/dashboard" 
              className="text-sm font-medium hover:text-primary transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
            >
              Dashboard
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link 
              to="/about" 
              className="text-sm font-medium hover:text-primary transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="hidden sm:block">
              <Button 
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-3 focus:ring-primary/50"
                aria-label="View Dashboard - Opens interactive dashboard"
              >
                View Dashboard
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
          
          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg md:hidden"
              >
              <nav className="container mx-auto px-6 py-4 flex flex-col gap-2" role="navigation" aria-label="Mobile navigation">
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  href="#features" 
                  onClick={(e) => handleAnchorClick(e, '#features')}
                  className="text-base font-medium hover:text-primary transition-all duration-200 py-3 px-3 rounded-lg hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  Features
                </motion.a>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <Link 
                    to="/tracks" 
                    className="text-base font-medium hover:text-primary transition-all duration-200 py-3 px-3 rounded-lg hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 block"
                  >
                    Tracks
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.14 }}
                >
                  <Link 
                    to="/analytics" 
                    className="text-base font-medium hover:text-primary transition-all duration-200 py-3 px-3 rounded-lg hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 block"
                  >
                    Analytics
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.16 }}
                >
                  <Link 
                    to="/dashboard" 
                    className="text-base font-medium hover:text-primary transition-all duration-200 py-3 px-3 rounded-lg hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 block"
                  >
                    Dashboard
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  <Link 
                    to="/about" 
                    className="text-base font-medium hover:text-primary transition-all duration-200 py-3 px-3 rounded-lg hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 block"
                  >
                    About
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2"
                >
                  <Link to="/dashboard" className="block">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
                      aria-label="View Dashboard - Opens interactive dashboard"
                    >
                      View Dashboard
                    </Button>
                  </Link>
                </motion.div>
              </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden" role="main" aria-label="Hero section">
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
            <span className="text-sm font-medium text-primary">AI-Powered Race Intelligence</span>
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
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Predict tire loss, recommend pit windows, and get explainable radio-ready guidance — live.
          </p>
          
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
                Driver fingerprinting + actionable coaching alerts
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-3 focus:ring-primary/50 group"
                aria-label="Run Demo - Opens interactive dashboard"
              >
                Run Demo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-3 focus:ring-primary/50 backdrop-blur-sm"
              aria-label="Watch 3-minute demo video"
            >
              Watch 3-min Video
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Launcher Section */}
      <section className="py-12 px-6">
        <DemoLauncher />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-accent via-accent/50 to-background relative overflow-hidden" aria-label="Features section">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.05),transparent_70%)]" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Powerful Racing Intelligence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              PitWall AI combines telemetry data, predictive modeling, and real-time analytics to give your team the competitive edge.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group bg-card/60 backdrop-blur-md hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 overflow-hidden relative"
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <CardContent className="p-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-5 text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section id="tracks" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              GR Cup Track Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprehensive data and models for all 7 tracks in the Toyota GR Cup North America series.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track, index) => (
              <Card 
                key={index} 
                className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 bg-card/60 backdrop-blur-sm"
              >
                <div className="h-48 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/50 flex items-center justify-center relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <MapPin className="w-20 h-20 text-primary relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">{track.name}</h3>
                  <p className="text-muted-foreground mb-5 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {track.location}
                  </p>
                  {TRACK_PDF_MAP[track.name] && (
                    <div className="mb-4">
                      <a
                        href={`/track-maps/${TRACK_PDF_MAP[track.name]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="w-4 h-4" />
                        View Track Map
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Length</span>
                      <span className="text-sm font-semibold">{track.length}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Turns</span>
                      <span className="text-sm font-semibold">{track.turns}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience the power of PitWall AI with our real-time analytics dashboard.
            </p>
          </div>
          <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-md shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-300">
            <div className="bg-gradient-to-r from-card via-card/95 to-card border-b border-border/50 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">PitWall AI - Live Race Analytics</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Circuit of the Americas - Lap 12/25
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                  <span className="text-sm font-semibold text-primary">Live Data</span>
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
                      <span className="font-bold text-lg text-primary">71%</span>
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
                      <span className="font-bold text-lg font-mono">2:04.56</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Best Lap</span>
                      <span className="font-bold text-lg font-mono">2:03.12</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50">
                      <span className="text-sm font-medium">Gap to Leader</span>
                      <span className="font-bold text-lg font-mono">+1.24s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Predicted Finish</span>
                      <span className="font-bold text-lg text-primary">P3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="p-6 border-t border-border/50 text-center bg-gradient-to-r from-card/50 via-card/30 to-card/50">
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
                >
                  Open Full Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden" aria-label="Call to action section">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))] bg-[size:40px_40px] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to Transform Your Race Strategy?
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed max-w-2xl mx-auto">
            Join the Toyota GR Cup hackathon or request early access to PitWall AI for your racing team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90 shadow-xl hover:scale-105 transition-all duration-300 group focus:outline-none focus:ring-3 focus:ring-primary-foreground/50"
              aria-label="Join Hackathon"
            >
              Join Hackathon
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-transparent border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm focus:outline-none focus:ring-3 focus:ring-primary-foreground/50"
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
                  PitWall<span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">AI</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time analytics and strategy platform for the Toyota GR Cup series.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-5 text-primary">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => handleAnchorClick(e, '#features')}
                    className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link to="/tracks" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
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
                  <a href="#" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
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
                  <Link to="/about" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Settings
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-200"></span>
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 PitWall AI. Created for the Toyota GR Cup "Hack the Track" Hackathon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
