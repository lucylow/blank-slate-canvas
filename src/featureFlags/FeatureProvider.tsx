// src/featureFlags/FeatureProvider.tsx
// Feature flag provider that wraps the app and stores flags in localStorage
// Can sync with backend API when available

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { FEATURE_FLAGS, type FeatureFlagKey } from "./featureRegistry";
import { fetchFlags, setFlags as setFlagsAPI } from "@/lib/backendClient";

type FlagsState = Record<FeatureFlagKey, boolean>;

interface FeatureContextValue {
  flags: FlagsState;
  setFlag: (key: FeatureFlagKey, value: boolean) => Promise<void>;
  isLoading: boolean;
  syncWithBackend: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FlagsState>(() => {
    // Initialize with defaults
    const initial: Partial<FlagsState> = {};
    Object.keys(FEATURE_FLAGS).forEach((key) => {
      const flagKey = key as FeatureFlagKey;
      initial[flagKey] = FEATURE_FLAGS[flagKey].default;
    });
    return initial as FlagsState;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load flags from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pitwall_feature_flags") || "{}");
      setFlags((prev) => {
        const updated = { ...prev };
        Object.keys(FEATURE_FLAGS).forEach((key) => {
          const flagKey = key as FeatureFlagKey;
          if (saved[flagKey] !== undefined) {
            updated[flagKey] = saved[flagKey];
          }
        });
        return updated;
      });
    } catch (e) {
      console.warn("Failed to load feature flags from localStorage:", e);
    }
    setIsLoading(false);
  }, []);

  // Sync with backend on mount
  useEffect(() => {
    syncWithBackend().catch(() => {
      // Silently fail - backend may not be available
    });
  }, []);

  const syncWithBackend = useCallback(async () => {
    try {
      const backendFlags = await fetchFlags();
      if (backendFlags && typeof backendFlags === "object") {
        setFlags((prev) => {
          const updated = { ...prev };
          Object.keys(FEATURE_FLAGS).forEach((key) => {
            const flagKey = key as FeatureFlagKey;
            if (backendFlags[flagKey] !== undefined) {
              updated[flagKey] = Boolean(backendFlags[flagKey]);
            }
          });
          // Save to localStorage
          localStorage.setItem("pitwall_feature_flags", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      // Backend not available or error - use localStorage only
      console.debug("Backend flags not available, using localStorage only");
    }
  }, []);

  const setFlag = useCallback(async (key: FeatureFlagKey, value: boolean) => {
    const updated = { ...flags, [key]: value };
    setFlags(updated);
    localStorage.setItem("pitwall_feature_flags", JSON.stringify(updated));

    // Try to sync with backend
    try {
      await setFlagsAPI({ [key]: value });
    } catch (e) {
      // Silently fail - backend may not be available
      console.debug("Failed to sync flag to backend:", e);
    }
  }, [flags]);

  return (
    <FeatureContext.Provider value={{ flags, setFlag, isLoading, syncWithBackend }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature(key: FeatureFlagKey): boolean {
  const context = useContext(FeatureContext);
  if (!context) {
    // Fallback to default if provider not available
    return FEATURE_FLAGS[key]?.default ?? false;
  }
  return context.flags[key] ?? FEATURE_FLAGS[key]?.default ?? false;
}

export function useFeatureManager() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error("useFeatureManager must be used within FeatureProvider");
  }
  return context;
}

