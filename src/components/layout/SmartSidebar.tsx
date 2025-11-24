// src/components/layout/SmartSidebar.tsx
// Enhanced Sidebar with Smart Navigation integration

import React, { useState } from 'react';
import { LayoutDashboard, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SmartNavMenu from '@/components/SmartNavMenu';
import { useAgentNavIntegration } from '@/hooks/useAgentNavIntegration';

interface SmartSidebarProps {
  /** Use Smart Navigation (default: false, can be enabled via feature flag) */
  useSmartNav?: boolean;
  /** Compact mode for tablets */
  compact?: boolean;
  className?: string;
}

export function SmartSidebar({ 
  useSmartNav = false, // Feature flag - set to true to enable
  compact = false,
  className 
}: SmartSidebarProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  
  // Integrate agent status updates with navigation
  useAgentNavIntegration();

  // If feature flag is off, render simple sidebar (backwards compatible)
  if (!useSmartNav) {
    return (
      <aside className={cn(
        "w-16 bg-accent/50 backdrop-blur-sm border-r border-border/50 flex flex-col items-center py-4",
        className
      )}>
        <div className="text-xs text-muted-foreground mb-4">Nav</div>
      </aside>
    );
  }

  // Smart Navigation mode
  return (
    <>
      {/* Mobile toggle button */}
      {compact && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-20 left-4 z-40 lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(!compact || isOpen) && (
          <motion.aside
            initial={compact ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={compact ? { x: -300 } : false}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "bg-accent/50 backdrop-blur-sm border-r border-border/50 flex flex-col",
              compact ? "fixed inset-y-0 left-0 z-30 w-80" : "w-80",
              className
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-sm">Navigation</h2>
              </div>
              {compact && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Smart Navigation Menu */}
            <div className="flex-1 overflow-y-auto p-4">
              <SmartNavMenu compact={compact} />
            </div>

            {/* Footer with agent count */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>Smart Navigation Enabled</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {compact && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}



