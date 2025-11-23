/**
 * Analytics Tracking Service
 * Tracks user interactions and events throughout the application
 */

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  recentEvents: AnalyticsEvent[];
  sessionStart: number;
  lastEventTime: number;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessionStart: number = Date.now();
  private maxEvents: number = 1000; // Keep last 1000 events

  /**
   * Track an analytics event
   */
  track(
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): void {
    const event: AnalyticsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user_action',
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.events.push(event);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event);
    }
  }

  /**
   * Track page view
   */
  trackPageView(page: string, metadata?: Record<string, unknown>): void {
    this.track('navigation', 'page_view', page, undefined, metadata);
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonName: string, location?: string, metadata?: Record<string, unknown>): void {
    this.track('interaction', 'button_click', buttonName, undefined, {
      location,
      ...metadata,
    });
  }

  /**
   * Track link click
   */
  trackLinkClick(linkText: string, href: string, metadata?: Record<string, unknown>): void {
    this.track('navigation', 'link_click', linkText, undefined, {
      href,
      ...metadata,
    });
  }

  /**
   * Track section view
   */
  trackSectionView(sectionName: string, metadata?: Record<string, unknown>): void {
    this.track('engagement', 'section_view', sectionName, undefined, metadata);
  }

  /**
   * Track feature interaction
   */
  trackFeatureUse(featureName: string, metadata?: Record<string, unknown>): void {
    this.track('feature', 'feature_use', featureName, undefined, metadata);
  }

  /**
   * Get all events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.category === category);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get recent events (last N events)
   */
  getRecentEvents(count: number = 50): AnalyticsEvent[] {
    return this.events.slice(-count).reverse();
  }

  /**
   * Get analytics summary
   */
  getSummary(): AnalyticsSummary {
    const eventsByType: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};

    this.events.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByCategory,
      recentEvents: this.getRecentEvents(20),
      sessionStart: this.sessionStart,
      lastEventTime: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : this.sessionStart,
    };
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    this.sessionStart = Date.now();
  }

  /**
   * Export events as JSON
   */
  exportEvents(): string {
    return JSON.stringify(
      {
        sessionStart: this.sessionStart,
        events: this.events,
        summary: this.getSummary(),
      },
      null,
      2
    );
  }
}

// Singleton instance
export const analyticsTracker = new AnalyticsTracker();

// Convenience functions
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, unknown>
) => analyticsTracker.track(category, action, label, value, metadata);

export const trackPageView = (page: string, metadata?: Record<string, unknown>) =>
  analyticsTracker.trackPageView(page, metadata);

export const trackButtonClick = (buttonName: string, location?: string, metadata?: Record<string, unknown>) =>
  analyticsTracker.trackButtonClick(buttonName, location, metadata);

export const trackLinkClick = (linkText: string, href: string, metadata?: Record<string, unknown>) =>
  analyticsTracker.trackLinkClick(linkText, href, metadata);

export const trackSectionView = (sectionName: string, metadata?: Record<string, unknown>) =>
  analyticsTracker.trackSectionView(sectionName, metadata);

export const trackFeatureUse = (featureName: string, metadata?: Record<string, unknown>) =>
  analyticsTracker.trackFeatureUse(featureName, metadata);

