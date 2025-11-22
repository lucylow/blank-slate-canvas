import React from 'react';
import AppNav from '@/components/Nav/AppNav';
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
    <>
      <AppNav isAdmin={isAdmin} carOptions={carOptions}>
        {children}
      </AppNav>
      <CommandPalette />
    </>
  );
}

