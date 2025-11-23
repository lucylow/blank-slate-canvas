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
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isExpanded ? "lg:pl-64" : "lg:pl-0"
        )}
      >
        <TopNav />
        <main className="flex-1 pt-16 lg:pt-20">
          {children}
        </main>
        <CommandPalette />
      </div>
    </div>
  );
}

