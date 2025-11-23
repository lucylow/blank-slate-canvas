import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ScrollToTop } from "@/components/ScrollToTop";
import { DeliveryProvider } from "@/components/DeliveryProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { RouteLayout } from "@/components/layout/RouteLayout";

import Index from "./pages/Index";
import RaceStrategiesPage from "./pages/RaceStrategiesPage";
import DashboardPage from "./pages/DashboardPage";
import PitWallDashboard from "./pages/PitWallDashboard";
import ComprehensiveDashboard from "./pages/ComprehensiveDashboard";
import Analytics from "./pages/Analytics";
import Tracks from "./pages/Tracks";
import About from "./pages/About";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AgentDashboard from "./components/AgentDashboard/AgentDashboard";
import AgentReviewDashboard from "./pages/AgentReviewDashboard";
import DemoSandbox from "./pages/DemoSandbox";
import AgentInsightsDashboard from "./pages/AgentInsightsDashboard";
import AIAgentIntegration from "./pages/AIAgentIntegration";
import GRTelemetryDashboard from "./pages/GRTelemetryDashboard";
import AISummaryReports from "./pages/AISummaryReports";
import PitWindowOptimization from "./pages/PitWindowOptimization";
import GRCarsAndDrivers from "./pages/GRCarsAndDrivers";
import PostEventAnalysis from "./pages/PostEventAnalysis";
import PreEventAnalysis from "./pages/PreEventAnalysis";
import EdgeFunctionsPage from "./pages/EdgeFunctionsPage";
import RaceStoryGenerator from "./pages/RaceStoryGenerator";
import PredictiveExplanatory from "./pages/PredictiveExplanatory";
import CoachingPage from "./pages/CoachingPage";
import F1Benchmarking from "./components/F1Benchmarking";
import LiveInsightsDashboard from "./pages/LiveInsightsDashboard";
import LovableCloudConfig from "./pages/LovableCloudConfig";
import RaceStoryPage from "./pages/RaceStoryPage";
import GeminiFeaturesPage from "./pages/GeminiFeaturesPage";
import GoogleMapsPage from "./pages/GoogleMapsPage";
import AIDataAnalyticsPage from "./pages/AIDataAnalyticsPage";
import AnomalyDetectionPage from "./pages/AnomalyDetectionPage";
import DriverFingerprintingPage from "./pages/DriverFingerprintingPage";
import SlackIntegrationPage from "./pages/SlackIntegrationPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DeliveryProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <RouteLayout>
                  <Routes>
                    {/* ========== LANDING PAGE ========== */}
                    {/* Main landing page */}
                    <Route path="/" element={<Index />} />
                    
                    {/* ========== CORE PAGES ========== */}
                    {/* Dashboard - Main race dashboard with live data and telemetry */}
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* Track Map - Track information and visualization */}
                    <Route path="/tracks" element={<Tracks />} />
                    
                    {/* Analytics - Performance metrics and analysis */}
                    <Route path="/analytics" element={<Analytics />} />
                    
                    {/* ========== STRATEGY & AI ========== */}
                    {/* Race Strategies - Strategy selection and analysis */}
                    <Route path="/strategies" element={<RaceStrategiesPage />} />
                    
                    {/* Strategy - Race strategy console (PitWall dashboard) */}
                    <Route path="/pitwall" element={<PitWallDashboard />} />
                    
                    {/* Predictive & Explanatory A.I. - Unified telemetry and coaching with driver analysis */}
                    <Route path="/predictive-ai" element={<PredictiveExplanatory />} />
                    
                    {/* AI Summary Reports - View and export AI-generated race analysis reports */}
                    <Route path="/ai-summaries" element={<AISummaryReports />} />
                    
                    {/* Race Story Generator - Broadcast & Debrief - Automatically identifies key race moments */}
                    <Route path="/race-story" element={<RaceStoryGenerator />} />
                    
                    {/* Race Story Page - Alternative race story page */}
                    <Route path="/race-story-page" element={<RaceStoryPage />} />
                    
                    {/* ========== TOOLS ========== */}
                    {/* Pre-Event Analysis - Track analysis, weather forecasts, and strategy planning */}
                    <Route path="/pre-event-analysis" element={<PreEventAnalysis />} />
                    
                    {/* Post-Event Analysis - Comprehensive race analysis and comparisons */}
                    <Route path="/post-event-analysis" element={<PostEventAnalysis />} />
                    
                    {/* Pit Window Optimization - Monte Carlo simulation with traffic-aware recommendations */}
                    <Route path="/pit-window" element={<PitWindowOptimization />} />
                    
                    {/* GR Cars & Drivers - Car specifications and driver profiles */}
                    <Route path="/gr-cars-drivers" element={<GRCarsAndDrivers />} />
                    
                    {/* Coaching Dashboard - Comprehensive coaching tools and analytics */}
                    <Route path="/coaching" element={<CoachingPage />} />
                    
                    {/* F1 Benchmarking - Compare GR Cup strategies with F1 historical data (Free APIs) */}
                    <Route path="/f1-benchmarking" element={<F1Benchmarking />} />
                    
                    {/* ========== ADDITIONAL FEATURES ========== */}
                    {/* Demo Sandbox - Interactive demo with 7-track mock data */}
                    <Route path="/demo" element={<DemoSandbox />} />
                    
                    {/* Comprehensive Dashboard - All AI features integrated */}
                    <Route path="/comprehensive" element={<ComprehensiveDashboard />} />
                    
                    {/* AI Agents - Agent system dashboard */}
                    <Route path="/agents" element={<AgentDashboard />} />
                    
                    {/* Human-in-the-Loop - Review agent decisions */}
                    <Route path="/agents/review" element={<AgentReviewDashboard />} />
                    
                    {/* Agent Insights Dashboard - Live insights from Delivery agent */}
                    <Route path="/agent-insights" element={<AgentInsightsDashboard />} />
                    
                    {/* Live Insights Dashboard - Real-time insights dashboard */}
                    <Route path="/live-insights" element={<LiveInsightsDashboard />} />
                    
                    {/* AI Agent Integration - Three integration patterns showcase */}
                    <Route path="/agent-integration" element={<AIAgentIntegration />} />
                    
                    {/* GR Telemetry Comparison - Speed and G-force comparison dashboard */}
                    <Route path="/telemetry" element={<GRTelemetryDashboard />} />
                    
                    {/* Edge Functions - Real-time analytics functions dashboard */}
                    <Route path="/edge-functions" element={<EdgeFunctionsPage />} />
                    
                    {/* ========== EXTERNAL API AI FEATURES ========== */}
                    {/* Gemini AI Features - Showcase, Multimodal, and Zip Matcher */}
                    <Route path="/gemini-features" element={<GeminiFeaturesPage />} />
                    
                    {/* Google Maps Integration - Complete Maps Platform integration */}
                    <Route path="/google-maps" element={<GoogleMapsPage />} />
                    
                    {/* AI Data Analytics - Advanced AI-powered race data analysis */}
                    <Route path="/ai-analytics" element={<AIDataAnalyticsPage />} />
                    
                    {/* Anomaly Detection - Real-time telemetry anomaly detection */}
                    <Route path="/anomaly-detection" element={<AnomalyDetectionPage />} />
                    
                    {/* Driver Fingerprinting - AI-powered driver analysis and coaching */}
                    <Route path="/driver-fingerprinting" element={<DriverFingerprintingPage />} />
                    
                    {/* Slack Integration - Real-time race alerts and notifications */}
                    <Route path="/slack-integration" element={<SlackIntegrationPage />} />
                    
                    {/* ========== SETTINGS ========== */}
                    {/* About - Information about the app */}
                    <Route path="/about" element={<About />} />
                    
                    {/* Settings - App configuration */}
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Lovable Cloud Config - Configuration and debugging page */}
                    <Route path="/lovable-config" element={<LovableCloudConfig />} />
                    
                    {/* ========== LEGACY & FALLBACK ========== */}
                    {/* Legacy route redirects */}
                    <Route path="/home" element={<Index />} />
                    
                    {/* 404 - Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </RouteLayout>
              </ErrorBoundary>
            </Suspense>
          </BrowserRouter>
        </DeliveryProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
