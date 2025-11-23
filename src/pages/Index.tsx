import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  Target, 
  BrainCircuit,
  FileText, 
  Sparkles, 
  BarChart3,
  Users,
  Zap,
  Search,
  X,
  ArrowRight,
  Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DemoLauncher from "@/components/DemoLauncher";
import ExplainModal from "@/components/ExplainModal";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  description: string;
  category: string;
  keywords: string[];
}

const Index: React.FC = () => {
  const [explainOpen, setExplainOpen] = useState(false);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Mock evidence data for demo - in your app you'll fetch these from /predict_tire
  const mockEvidenceSets = [
    [
      "High tire_stress in S2 (braking-dominant sector) - 0.95 stress factor detected",
      "Average speed on long straight increased 3.2 mph over last 3 laps",
      "Driver brake bias changed from 52/48 to 55/45 -> increased rear slip by 12%"
    ],
    [
      "Front-left tire temperature elevated to 202°F (optimal range: 185-195°F)",
      "Lateral G-forces in Turn 3 exceeded 2.5G threshold for 4 consecutive laps",
      "Tire pressure differential: FL 29.3psi vs FR 28.9psi indicates camber wear pattern"
    ],
    [
      "Rear tire degradation rate increased 15% compared to baseline lap",
      "Brake temperature spike in S2: 650°F (normal: 580°F) suggests late braking",
      "Fuel consumption rate up 8% - potential drag from tire wear affecting efficiency"
    ],
    [
      "Tire stress accumulation in S1-S2 transition zone: 0.88 cumulative factor",
      "Steering angle variance increased 18% indicating reduced grip confidence",
      "RPM drop in S3 suggests power delivery affected by tire condition"
    ]
  ];

  const openExplain = () => {
    // Randomly select one of the mock evidence sets for variety
    const randomSet = mockEvidenceSets[Math.floor(Math.random() * mockEvidenceSets.length)];
    setEvidence(randomSet);
    setExplainOpen(true);
  };

  // Navigation items with icons and metadata
  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Live Dashboard', to: '/dashboard', description: 'Real-time race data, telemetry, and live insights', category: 'Core Pages', keywords: ['dashboard', 'live', 'real-time', 'telemetry', 'data'] },
    { icon: Map, label: 'Track Map', to: '/tracks', description: 'Track information and visualization', category: 'Core Pages', keywords: ['track', 'map', 'circuit', 'layout'] },
    { icon: TrendingUp, label: 'Analytics', to: '/analytics', description: 'Performance metrics and detailed analysis', category: 'Core Pages', keywords: ['analytics', 'metrics', 'performance', 'analysis', 'stats'] },
    { icon: Target, label: 'Race Strategies', to: '/strategies', description: 'Explore winning strategies and pit window optimization', category: 'Strategy & AI', keywords: ['strategy', 'strategies', 'race', 'pit', 'optimization'] },
    { icon: Target, label: 'PitWall Console', to: '/pitwall', description: 'Strategy console with AI-powered recommendations', category: 'Strategy & AI', keywords: ['pitwall', 'console', 'strategy', 'recommendations'] },
    { icon: BrainCircuit, label: 'Predictive AI', to: '/predictive-ai', description: 'Unified telemetry and coaching with driver analysis', category: 'Strategy & AI', keywords: ['predictive', 'ai', 'machine learning', 'coaching', 'driver'] },
    { icon: FileText, label: 'AI Summaries', to: '/ai-summaries', description: 'View and export AI-generated race analysis reports', category: 'Strategy & AI', keywords: ['ai', 'summaries', 'reports', 'analysis', 'export'] },
    { icon: Sparkles, label: 'Race Story', to: '/race-story', description: 'Broadcast & Debrief - Automatically identifies key race moments', category: 'Strategy & AI', keywords: ['race', 'story', 'broadcast', 'debrief', 'moments'] },
    { icon: BarChart3, label: 'Post-Event Analysis', to: '/post-event-analysis', description: 'Comprehensive race analysis and comparisons', category: 'Tools', keywords: ['post-event', 'analysis', 'comparison', 'review'] },
    { icon: Zap, label: 'Pit Window', to: '/pit-window', description: 'Monte Carlo simulation with traffic-aware recommendations', category: 'Tools', keywords: ['pit', 'window', 'monte carlo', 'simulation', 'traffic'] },
    { icon: Users, label: 'Cars & Drivers', to: '/gr-cars-drivers', description: 'Car specifications and driver profiles', category: 'Tools', keywords: ['cars', 'drivers', 'profiles', 'specifications'] },
    { icon: Users, label: 'Coaching', to: '/coaching', description: 'Driver coaching tools and insights', category: 'Tools', keywords: ['coaching', 'driver', 'training', 'insights'] },
  ];

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const query = searchQuery.toLowerCase();
    return navItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.keywords.some(kw => kw.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, NavItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape clears search
      if (e.key === 'Escape') {
        if (document.activeElement === searchInputRef.current) {
          setSearchQuery("");
        }
        return;
      }

      // Arrow key navigation when search is focused
      if (document.activeElement === searchInputRef.current && filteredItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedIndex(prev => prev === null ? 0 : Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedIndex(prev => prev === null ? filteredItems.length - 1 : Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && focusedIndex !== null) {
          e.preventDefault();
          navigate(filteredItems[focusedIndex].to);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, focusedIndex, navigate]);

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(null);
  }, [searchQuery]);

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              PitWall A.I. — Real-time race strategy & tire intelligence
            </h1>
            <p className="mt-3 text-gray-300 max-w-2xl">
              Predict tire loss, recommend pit windows, and get explainable, radio-ready guidance — live.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded bg-[#EB0A1E] px-4 py-2 text-sm font-semibold shadow hover:bg-red-700 transition-colors"
              >
                ▶ Go to Dashboard
              </Link>
              <Link
                to="/strategies"
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
              >
                View Race Strategies
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
              >
                ▶ Run Demo
              </Link>
              <button
                onClick={openExplain}
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
              >
                View Demo Explanation
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <DemoLauncher />
        </div>

        {/* Search Bar */}
        <div className="mt-16 mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search pages... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EB0A1E] focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {!searchQuery && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            )}
          </div>
          {searchQuery && (
            <p className="text-center mt-3 text-sm text-gray-400">
              {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>

        {/* Navigation Grid */}
        <AnimatePresence mode="wait">
          <div className="space-y-12">
            {Object.entries(groupedItems).map(([category, items]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold mb-6 text-gray-300 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#EB0A1E] rounded-full"></span>
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item, index) => {
                    const Icon = item.icon;
                    const globalIndex = navItems.findIndex(ni => ni.to === item.to);
                    const isFocused = focusedIndex === globalIndex;
                    
                    return (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.to}
                          className={`
                            group relative block bg-gray-900 border rounded-lg p-6 
                            transition-all duration-200 overflow-hidden
                            ${isFocused 
                              ? 'border-[#EB0A1E] ring-2 ring-[#EB0A1E]/50 shadow-lg shadow-[#EB0A1E]/20' 
                              : 'border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-[#EB0A1E]/10'
                            }
                          `}
                          onMouseEnter={() => setFocusedIndex(globalIndex)}
                          onMouseLeave={() => setFocusedIndex(null)}
                        >
                          {/* Hover gradient effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#EB0A1E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-[#EB0A1E]/10 transition-colors">
                                <Icon className="w-6 h-6 text-gray-300 group-hover:text-[#EB0A1E] transition-colors" />
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-[#EB0A1E] group-hover:translate-x-1 transition-all" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 group-hover:text-[#EB0A1E] transition-colors">
                              {item.label}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                          
                          {/* Active indicator */}
                          {isFocused && (
                            <motion.div
                              layoutId="activeCard"
                              className="absolute bottom-0 left-0 right-0 h-1 bg-[#EB0A1E]"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Empty state for search */}
        {searchQuery && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No results found for "{searchQuery}"</p>
            <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
          </motion.div>
        )}
      </section>

      {/* Footer with Site Map */}
      <footer className="border-t border-gray-800 mt-20 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Core Pages */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Core Pages</h3>
              <ul className="space-y-2">
                {navItems
                  .filter(item => item.category === 'Core Pages')
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Strategy & AI */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Strategy & AI</h3>
              <ul className="space-y-2">
                {navItems
                  .filter(item => item.category === 'Strategy & AI')
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Tools</h3>
              <ul className="space-y-2">
                {navItems
                  .filter(item => item.category === 'Tools')
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} PitWall A.I. — Real-time race strategy & tire intelligence
              </p>
              <div className="flex gap-6">
                <Link to="/about" className="text-gray-500 hover:text-white transition-colors text-sm">
                  About
                </Link>
                <Link to="/demo" className="text-gray-500 hover:text-white transition-colors text-sm">
                  Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <ExplainModal open={explainOpen} onClose={() => setExplainOpen(false)} evidence={evidence} />
    </main>
  );
};

export default Index;
