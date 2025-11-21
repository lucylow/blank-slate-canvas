import { LayoutDashboard, Map, TrendingUp, Settings, Flag, Target, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MotionLink = motion(Link);

export function Sidebar() {
  const location = useLocation();
  
  // Logical 7-button navigation structure for PitWall AI:
  // 1. Home (landing page)
  // 2. Dashboard (main race dashboard with live data and telemetry)
  // 3. Track Map (track information and visualization)
  // 4. Analytics (performance metrics and analysis)
  // 5. Strategy (race strategy console - PitWall dashboard)
  // 6. About (information about the app)
  // 7. Settings (app configuration)
  const menuItems = [
    { icon: Flag, label: 'Home', to: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Map, label: 'Track Map', to: '/tracks' },
    { icon: TrendingUp, label: 'Analytics', to: '/analytics' },
    { icon: Target, label: 'Strategy', to: '/pitwall' },
    { icon: Info, label: 'About', to: '/about' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  const isActive = (to: string) => {
    // Remove hash fragments for comparison
    const pathWithoutHash = location.pathname;
    
    if (to === '/') {
      return pathWithoutHash === '/';
    }
    
    // Check if current path matches the menu item path
    return pathWithoutHash === to;
  };

  return (
    <aside className="w-16 bg-accent/50 backdrop-blur-sm border-r border-border/50 flex flex-col items-center py-4 space-y-2">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <MotionLink 
                to={item.to}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.1 }}
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
    </aside>
  );
}
