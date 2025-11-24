import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronRight,
  Home,
  LogIn,
  User,
  Settings,
} from "lucide-react";
import { isLovableCloud } from "@/utils/backendUrl";
import { LovableCloudStatus } from "@/components/LovableCloudStatus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  showHomePageLinks?: boolean; // For home page, show Features, GR Cars as anchor links
  activeSection?: string; // For home page scroll spy
  onAnchorClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

// Route to page title mapping
const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/tracks': 'Track Map',
  '/analytics': 'Analytics',
  '/pitwall': 'Strategy',
  '/ai-summaries': 'AI Summaries',
  '/race-story': 'Race Story',
  '/predictive-ai': 'Predictive AI',
  '/post-event-analysis': 'Post-Event Analysis',
  '/pit-window': 'Pit Window',
  '/gr-cars-drivers': 'Cars & Drivers',
  '/about': 'About',
  '/settings': 'Settings',
};

export function TopNav({ 
  showHomePageLinks = false, 
  activeSection = "",
  onAnchorClick 
}: TopNavProps) {
  const location = useLocation();

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', to: '/' }];
    
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const title = routeTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label: title, to: currentPath });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentPageTitle = routeTitles[location.pathname] || breadcrumbs[breadcrumbs.length - 1]?.label || 'Page';

  // Main navigation items (only for home page anchor links)
  const navItems = showHomePageLinks
    ? [
        {
          type: "anchor" as const,
          href: "#features",
          label: "Features",
          id: "features",
        },
        {
          type: "anchor" as const,
          href: "#gr-cars",
          label: "GR Cars",
          id: "gr-cars",
        },
      ]
    : [];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex flex-col">
        {/* Top bar */}
        <div className="container mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.to}>
                  {index === 0 ? (
                    <Link
                      to={crumb.to}
                      className={cn(
                        "flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
                        isLast && "text-foreground font-medium"
                      )}
                    >
                      <Home className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      to={crumb.to}
                      className={cn(
                        "text-muted-foreground hover:text-foreground transition-colors",
                        isLast && "text-foreground font-medium"
                      )}
                    >
                      {crumb.label}
                    </Link>
                  )}
                  {!isLast && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {isLovableCloud() && (
              <div className="hidden md:block">
                <LovableCloudStatus compact={true} />
              </div>
            )}
            {showHomePageLinks && navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-4">
                {navItems.map((item, index) => {
                  const active = activeSection === item.id;
                  return (
                    <a
                      key={index}
                      href={item.href}
                      onClick={(e) => onAnchorClick?.(e, item.href)}
                      className={cn(
                        "text-sm font-medium transition-all duration-200 relative group px-2 py-1 rounded",
                        active
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          "absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-200",
                          active ? "w-full" : "w-0 group-hover:w-full"
                        )}
                      />
                    </a>
                  );
                })}
              </nav>
            )}
            {/* Login/Auth buttons */}
            {location.pathname !== '/' && (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/login" className="cursor-pointer">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}

