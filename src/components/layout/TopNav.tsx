import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLovableCloud } from "@/utils/backendUrl";
import { LovableCloudStatus } from "@/components/LovableCloudStatus";

interface TopNavProps {
  showHomePageLinks?: boolean; // For home page, show Features, GR Cars as anchor links
  activeSection?: string; // For home page scroll spy
  onAnchorClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

export function TopNav({ 
  showHomePageLinks = false, 
  activeSection = "",
  onAnchorClick 
}: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Main navigation items
  const navItems = [
    ...(showHomePageLinks
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
      : []),
    { type: "link" as const, to: "/tracks", label: "Tracks" },
    { type: "link" as const, to: "/analytics", label: "Analytics" },
    { type: "link" as const, to: "/dashboard", label: "Dashboard" },
    { type: "link" as const, to: "/agents", label: "AI Agents" },
    { type: "link" as const, to: "/about", label: "About" },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow || "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  const isActive = (item: typeof navItems[0]) => {
    if (item.type === "anchor") {
      return activeSection === item.id;
    }
    return location.pathname === item.to;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
            <Flag className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            PitWall
            <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-8"
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item, index) => {
            const active = isActive(item);
            const baseClasses =
              "text-sm font-medium transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1";
            const activeClasses = active
              ? "text-primary"
              : "hover:text-primary";

            if (item.type === "anchor") {
              return (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => onAnchorClick?.(e, item.href)}
                  className={`${baseClasses} ${activeClasses}`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </a>
              );
            }

            return (
              <Link
                key={index}
                to={item.to}
                className={`${baseClasses} ${activeClasses}`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {isLovableCloud() && (
            <div className="hidden md:block">
              <LovableCloudStatus compact={true} />
            </div>
          )}
          {!showHomePageLinks && (
            <Link to="/dashboard" className="hidden sm:block">
              <Button
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="View Dashboard"
              >
                View Dashboard
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-2xl md:hidden z-50"
              >
                <nav
                  className="container mx-auto px-6 py-4 flex flex-col gap-1"
                  role="navigation"
                  aria-label="Mobile navigation"
                >
                  {navItems.map((item, index) => {
                    const active = isActive(item);
                    const baseClasses =
                      "text-base font-medium transition-all duration-200 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 block";
                    const activeClasses = active
                      ? "text-primary bg-primary/10"
                      : "hover:text-primary hover:bg-accent/50";

                    if (item.type === "anchor") {
                      return (
                        <motion.a
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          href={item.href}
                          onClick={(e) => {
                            onAnchorClick?.(e, item.href);
                            setMobileMenuOpen(false);
                          }}
                          className={`${baseClasses} ${activeClasses}`}
                        >
                          {item.label}
                        </motion.a>
                      );
                    }

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.to}
                          className={`${baseClasses} ${activeClasses}`}
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

