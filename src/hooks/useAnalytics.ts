import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsTracker, type AnalyticsEvent, type AnalyticsSummary } from '@/utils/analytics';

/**
 * Hook to use analytics tracking
 */
export function useAnalytics() {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    analyticsTracker.trackPageView(location.pathname, {
      route: location.pathname,
      search: location.search,
    });
  }, [location]);

  const trackEvent = useCallback(
    (
      category: string,
      action: string,
      label?: string,
      value?: number,
      metadata?: Record<string, unknown>
    ) => {
      analyticsTracker.track(category, action, label, value, metadata);
    },
    []
  );

  const trackButtonClick = useCallback(
    (buttonName: string, location?: string, metadata?: Record<string, unknown>) => {
      analyticsTracker.trackButtonClick(buttonName, location, metadata);
    },
    []
  );

  const trackLinkClick = useCallback(
    (linkText: string, href: string, metadata?: Record<string, unknown>) => {
      analyticsTracker.trackLinkClick(linkText, href, metadata);
    },
    []
  );

  const trackSectionView = useCallback(
    (sectionName: string, metadata?: Record<string, unknown>) => {
      analyticsTracker.trackSectionView(sectionName, metadata);
    },
    []
  );

  const trackFeatureUse = useCallback(
    (featureName: string, metadata?: Record<string, unknown>) => {
      analyticsTracker.trackFeatureUse(featureName, metadata);
    },
    []
  );

  const getEvents = useCallback(() => analyticsTracker.getEvents(), []);
  const getRecentEvents = useCallback((count?: number) => analyticsTracker.getRecentEvents(count), []);
  const getSummary = useCallback(() => analyticsTracker.getSummary(), []);
  const clearEvents = useCallback(() => analyticsTracker.clear(), []);
  const exportEvents = useCallback(() => analyticsTracker.exportEvents(), []);

  return {
    trackEvent,
    trackButtonClick,
    trackLinkClick,
    trackSectionView,
    trackFeatureUse,
    getEvents,
    getRecentEvents,
    getSummary,
    clearEvents,
    exportEvents,
  };
}


