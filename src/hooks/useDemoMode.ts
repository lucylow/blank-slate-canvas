// src/hooks/useDemoMode.ts
// Hook for managing demo mode state with localStorage persistence

import { useState, useEffect } from "react";

const DEMO_MODE_KEY = "pitwall_demo_mode";

export function useDemoMode() {
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    // Persist to localStorage whenever it changes
    localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(isDemoMode));
  }, [isDemoMode]);

  const setIsDemoMode = (value: boolean) => {
    setIsDemoModeState(value);
  };

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
  };

  return {
    isDemoMode,
    setIsDemoMode,
    toggleDemoMode,
  };
}



