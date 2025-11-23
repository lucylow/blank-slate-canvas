import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface UseKeyboardShortcutsOptions {
  carOptions?: Array<{ id: string; label: string }>;
  onPitWindowOpen?: () => void;
  onPlayPause?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { selectedCar, setSelectedCar, setCommandPaletteOpen } = useUIStore();
  const { carOptions = [], onPitWindowOpen, onPlayPause } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // G - Open command palette (alternative to Cmd+K)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // J - Cycle to next car
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (carOptions.length > 0) {
          const currentIndex = selectedCar
            ? carOptions.findIndex((c) => c.id === selectedCar)
            : -1;
          const nextIndex = (currentIndex + 1) % carOptions.length;
          setSelectedCar(carOptions[nextIndex].id);
        }
      }

      // K - Cycle to previous car
      if (e.key === 'k' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (carOptions.length > 0) {
          const currentIndex = selectedCar
            ? carOptions.findIndex((c) => c.id === selectedCar)
            : -1;
          const prevIndex =
            currentIndex <= 0 ? carOptions.length - 1 : currentIndex - 1;
          setSelectedCar(carOptions[prevIndex].id);
        }
      }

      // Space - Play/Pause (only if handler provided)
      if (e.key === ' ' && onPlayPause && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onPlayPause();
      }

      // P - Open pit window optimizer (only if handler provided)
      if (e.key === 'p' && onPitWindowOpen && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onPitWindowOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCar, setSelectedCar, setCommandPaletteOpen, carOptions, onPitWindowOpen, onPlayPause]);
}


