import React from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '@/components/Nav/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  carOptions?: Array<{ id: string; label: string }>;
  onPitWindowOpen?: () => void;
  onPlayPause?: () => void;
}

export function AppLayout({
  children,
  isAdmin = false,
  carOptions,
  onPitWindowOpen,
  onPlayPause,
}: AppLayoutProps) {
  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    carOptions,
    onPitWindowOpen,
    onPlayPause,
  });

  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out w-full",
          // Mobile: no padding (sidebar is overlay)
          // Desktop: add padding when sidebar is expanded
          isExpanded ? "lg:pl-64" : "lg:pl-0"
        )}
      >
        <TopNav />
        <main className={cn(
          "flex-1 w-full",
          // Responsive top padding for TopNav
          "pt-16 lg:pt-20",
          // Responsive horizontal padding
          "px-4 sm:px-6 lg:px-8",
          // Add extra padding when sidebar is expanded on desktop
          isExpanded && "lg:px-8"
        )}>
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
        <CommandPalette />
      </div>
    </div>
  );
}

