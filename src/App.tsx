import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ScrollToTop } from "@/components/ScrollToTop";

import Index from "./pages/Index";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import { Dashboard } from "./pages/Dashboard";
import PitWallDashboard from "./pages/PitWallDashboard";
import Analytics from "./pages/Analytics";
import Tracks from "./pages/Tracks";
import About from "./pages/About";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard-old" element={<DashboardPage />} />
          <Route path="/pitwall" element={<PitWallDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
