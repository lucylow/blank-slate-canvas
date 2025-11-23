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
import LovableCloudConfig from "./pages/LovableCloudConfig";
import GRCarsAndDrivers from "./pages/GRCarsAndDrivers";
import PostEventAnalysis from "./pages/PostEventAnalysis";
import EdgeFunctionsPage from "./pages/EdgeFunctionsPage";
import RaceStoryGenerator from "./pages/RaceStoryGenerator";
import PredictiveExplanatory from "./pages/PredictiveExplanatory";
import CoachingPage from "./pages/CoachingPage";

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
                    {/* Main landing page */}
                    <Route path="/" element={<Index />} />
                    
                    {/* Dashboard - Main race dashboard with live data and telemetry */}
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* Comprehensive Dashboard - All AI features integrated */}
                    <Route path="/comprehensive" element={<ComprehensiveDashboard />} />
                    
                    {/* Strategy - Race strategy console (PitWall dashboard) */}
                    <Route path="/pitwall" element={<PitWallDashboard />} />
                    
                    {/* Analytics - Performance metrics and analysis */}
                    <Route path="/analytics" element={<Analytics />} />
                    
                    {/* AI Agents - Agent system dashboard */}
                    <Route path="/agents" element={<AgentDashboard />} />
                    
                    {/* Human-in-the-Loop - Review agent decisions */}
                    <Route path="/agents/review" element={<AgentReviewDashboard />} />
                    
                    {/* Demo Sandbox - Interactive demo with 7-track mock data */}
                    <Route path="/demo" element={<DemoSandbox />} />
                    
                    {/* Track Map - Track information and visualization */}
                    <Route path="/tracks" element={<Tracks />} />
                    
                    {/* About - Information about the app */}
                    <Route path="/about" element={<About />} />
                    
                    {/* Settings - App configuration */}
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Legacy route redirects */}
                    <Route path="/home" element={<Index />} />
                    
                    {/* Agent Insights Dashboard - Live insights from Delivery agent */}
                    <Route path="/agent-insights" element={<AgentInsightsDashboard />} />
                    
                    {/* AI Agent Integration - Three integration patterns showcase */}
                    <Route path="/agent-integration" element={<AIAgentIntegration />} />
                    
                    {/* GR Telemetry Comparison - Speed and G-force comparison dashboard */}
                    <Route path="/telemetry" element={<GRTelemetryDashboard />} />
                    
                    {/* AI Summary Reports - View and export AI-generated race analysis reports */}
                    <Route path="/ai-summaries" element={<AISummaryReports />} />
                    
                    {/* Pit Window Optimization - Monte Carlo simulation with traffic-aware recommendations */}
                    <Route path="/pit-window" element={<PitWindowOptimization />} />
                    
                    {/* GR Cars & Drivers - Car specifications and driver profiles */}
                    <Route path="/gr-cars-drivers" element={<GRCarsAndDrivers />} />
                    
                    {/* Post-Event Analysis - Comprehensive race analysis and comparisons */}
                    <Route path="/post-event-analysis" element={<PostEventAnalysis />} />
                    
                    {/* Edge Functions - Real-time analytics functions dashboard */}
                    <Route path="/edge-functions" element={<EdgeFunctionsPage />} />
                    
                    {/* Race Story Generator - Broadcast & Debrief - Automatically identifies key race moments */}
                    <Route path="/race-story" element={<RaceStoryGenerator />} />
                    
                    {/* Predictive & Explanatory A.I. - Unified telemetry and coaching with driver analysis */}
                    <Route path="/predictive-ai" element={<PredictiveExplanatory />} />
                    
                    {/* Coaching Dashboard - Comprehensive coaching tools and analytics */}
                    <Route path="/coaching" element={<CoachingPage />} />
                    
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
