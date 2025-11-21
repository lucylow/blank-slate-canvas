import { LayoutDashboard, Map, TrendingUp, Settings, Database, Home, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: Flag, label: 'Home', to: '/' },
    { icon: Home, label: 'Home', to: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Map, label: 'Track Map', to: '/tracks' },
    { icon: TrendingUp, label: 'Analytics', to: '/analytics' },
    { icon: Database, label: 'Data', to: '/analytics' },
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

  const handleNavigation = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <aside className="w-16 bg-accent/50 backdrop-blur-sm border-r border-border/50 flex flex-col items-center py-4 space-y-2">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Link 
                to={item.to} 
                className="block"
                onClick={(e) => handleNavigation(e, item.to)}
              >
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
                      "relative transition-all duration-200 w-12 h-12",
                      active 
                        ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30" 
                        : "hover:bg-accent hover:text-primary"
                    )}
                    aria-label={item.label}
                    type="button"
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
