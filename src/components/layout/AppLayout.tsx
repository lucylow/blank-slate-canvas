import React from 'react';
import { TopNav } from './TopNav';
import { CommandPalette } from '@/components/Nav/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

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

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pt-20">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}

