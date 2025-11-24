import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  Settings, 
  Flag, 
  Target, 
  Info, 
  FileText, 
  Sparkles, 
  BrainCircuit,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  Users,
  Zap,
  Brain,
  Globe,
  AlertCircle,
  Bot,
  ClipboardList,
  Activity,
  Gauge,
  Network,
  MessageSquare,
  Layers,
  Calendar,
  GraduationCap,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

const MotionLink = motion(Link);

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function Sidebar() {
  const location = useLocation();
  const { isExpanded, setIsExpanded } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Grouped navigation structure
  const menuSections: MenuSection[] = [
    {
      title: 'Core',
      items: [
        { icon: Flag, label: 'Home', to: '/' },
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
        { icon: Map, label: 'Track Map', to: '/tracks' },
        { icon: TrendingUp, label: 'Analytics', to: '/analytics' },
        { icon: Activity, label: 'Live Insights', to: '/live-insights' },
        { icon: Zap, label: 'Race Dashboard', to: '/race-dashboard', badge: 'LIVE' },
        { icon: Layers, label: 'Comprehensive', to: '/comprehensive' },
      ],
    },
    {
      title: 'Strategy & AI',
      items: [
        { icon: Award, label: 'Race Strategies', to: '/strategies' },
        { icon: Target, label: 'Strategy Console', to: '/pitwall' },
        { icon: BrainCircuit, label: 'Predictive AI', to: '/predictive-ai' },
        { icon: FileText, label: 'AI Summaries', to: '/ai-summaries' },
        { icon: Sparkles, label: 'Race Story', to: '/race-story' },
        { icon: Bot, label: 'AI Agents', to: '/agents' },
        { icon: Network, label: 'Agent Integration', to: '/agent-integration' },
        { icon: Brain, label: 'Agent Insights', to: '/agent-insights' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { icon: Calendar, label: 'Pre-Event Analysis', to: '/pre-event-analysis' },
        { icon: BarChart3, label: 'Post-Event Analysis', to: '/post-event-analysis' },
        { icon: Zap, label: 'Pit Window', to: '/pit-window' },
        { icon: Users, label: 'Cars & Drivers', to: '/gr-cars-drivers' },
        { icon: GraduationCap, label: 'Coaching', to: '/coaching' },
        { icon: Gauge, label: 'Telemetry', to: '/telemetry' },
        { icon: TrendingUp, label: 'F1 Benchmarking', to: '/f1-benchmarking' },
      ],
    },
    {
      title: 'External API AI',
      items: [
        { icon: Brain, label: 'Gemini AI', to: '/gemini-features' },
        { icon: Globe, label: 'Google Maps', to: '/google-maps' },
        { icon: BarChart3, label: 'AI Analytics', to: '/ai-analytics' },
        { icon: AlertCircle, label: 'Anomaly Detection', to: '/anomaly-detection' },
        { icon: Users, label: 'Driver Fingerprinting', to: '/driver-fingerprinting' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: Info, label: 'About', to: '/about' },
        { icon: Settings, label: 'Settings', to: '/settings' },
      ],
    },
  ];

  const isActive = (to: string) => {
    const pathWithoutHash = location.pathname;
    
    if (to === '/') {
      return pathWithoutHash === '/';
    }
    
    return pathWithoutHash === to || pathWithoutHash.startsWith(to + '/');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const sidebarContent = (
    <div className={cn(
      "h-full bg-background/95 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300",
      "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Flag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">PitWall AI</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform duration-200",
            isExpanded && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-1">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {section.title}
              </motion.div>
            )}
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              const index = sectionIndex * 100 + itemIndex;
              
              if (isExpanded) {
                return (
                  <MotionLink
                    key={item.to}
                    to={item.to}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      active
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      active && "text-primary"
                    )} />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </MotionLink>
                );
              }
              
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <MotionLink
                      to={item.to}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative block transition-all duration-200 w-12 h-12 rounded-lg flex items-center justify-center",
                        active
                          ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 text-primary-foreground"
                          : "hover:bg-accent hover:text-primary text-muted-foreground"
                      )}
                      aria-label={item.label}
                    >
                      <Icon className="w-5 h-5" />
                      {active && (
                        <motion.div
                          layoutId={`activeIndicator-${item.to}`}
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </MotionLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-card border-border/50">
                    <p className="font-medium">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:block fixed top-0 h-screen z-40 transition-transform duration-300 ease-in-out",
          isExpanded ? "left-0" : "-left-64"
        )}
      >
        {sidebarContent}
      </aside>
      
      {/* Collapsed Sidebar Toggle Button - Only visible when sidebar is hidden */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-accent"
          onClick={() => setIsExpanded(true)}
          aria-label="Show sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />
            {/* Mobile Menu */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen z-50 lg:hidden"
            >
              <div className="w-64 h-full bg-background/95 backdrop-blur-xl border-r border-border/50 flex flex-col">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                      <Flag className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">PitWall AI</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                {/* Mobile Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                  {menuSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {section.title}
                      </div>
                      {section.items.map((item, itemIndex) => {
                        const Icon = item.icon;
                        const active = isActive(item.to);
                        const index = sectionIndex * 100 + itemIndex;
                        
                        return (
                          <MotionLink
                            key={item.to}
                            to={item.to}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                              active
                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          >
                            <Icon className={cn(
                              "w-5 h-5 flex-shrink-0",
                              active && "text-primary"
                            )} />
                            <span className="flex-1 text-sm">{item.label}</span>
                            {active && (
                              <motion.div
                                layoutId="mobileActiveIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </MotionLink>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
