import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ScrollToTop } from "@/components/ScrollToTop";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
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
          
          {/* Track Map - Track information and visualization */}
          <Route path="/tracks" element={<Tracks />} />
          
          {/* About - Information about the app */}
          <Route path="/about" element={<About />} />
          
          {/* Settings - App configuration */}
          <Route path="/settings" element={<Settings />} />
          
          {/* Legacy route redirects */}
          <Route path="/home" element={<Index />} />
          
          {/* 404 - Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
