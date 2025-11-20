import { LayoutDashboard, Map, TrendingUp, Settings, Database, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    <aside className="w-16 bg-accent border-r border-border flex flex-col items-center py-4 space-y-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                {item.to ? (
                  <Link to={item.to}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="icon"
                      className={active ? "bg-primary hover:bg-primary/90" : ""}
                      aria-label={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="icon"
                    className={active ? "bg-primary hover:bg-primary/90" : ""}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </aside>
  );
}
