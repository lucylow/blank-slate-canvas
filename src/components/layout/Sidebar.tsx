import { LayoutDashboard, Map, TrendingUp, Settings, Database, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Map, label: 'Track Map', to: '/dashboard#track-map' },
    { icon: TrendingUp, label: 'Analytics', to: '/dashboard#analytics' },
    { icon: Database, label: 'Data', to: '/dashboard#data' },
    { icon: Settings, label: 'Settings', to: '/dashboard#settings' },
  ];

  const isActive = (to: string) => {
    if (to === '/') {
      return location.pathname === '/';
    }
    if (to === '/dashboard') {
      return location.pathname === '/dashboard' && !location.hash;
    }
    const hash = to.split('#')[1];
    return location.pathname === '/dashboard' && location.hash === `#${hash}`;
  };

  return (
    <aside className="w-16 bg-accent/50 backdrop-blur-sm border-r border-border/50 flex flex-col items-center py-4 space-y-2">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              {item.to ? (
                <Link to={item.to} className="block">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "relative transition-all duration-200",
                        active 
                          ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30" 
                          : "hover:bg-accent hover:text-primary"
                      )}
                      aria-label={item.label}
                    >
                      <Icon className="w-5 h-5" />
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Button>
                  </motion.div>
                </Link>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "relative transition-all duration-200",
                      active 
                        ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30" 
                        : "hover:bg-accent hover:text-primary"
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Button>
                </motion.div>
              )}
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
