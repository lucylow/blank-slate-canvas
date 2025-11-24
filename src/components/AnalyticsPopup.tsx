import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  Download,
  X,
  RefreshCw,
  Clock,
  MousePointerClick,
  Navigation,
  Zap,
  Activity,
} from 'lucide-react';
import { analyticsTracker, type AnalyticsEvent, type AnalyticsSummary } from '@/utils/analytics';

interface AnalyticsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsPopup({ open, onOpenChange }: AnalyticsPopupProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      updateAnalytics();
    }
  }, [open]);

  const updateAnalytics = () => {
    const currentSummary = analyticsTracker.getSummary();
    setSummary(currentSummary);
    setRecentEvents(currentSummary.recentEvents);
  };

  const handleExport = () => {
    const data = analyticsTracker.exportEvents();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all analytics data?')) {
      analyticsTracker.clear();
      updateAnalytics();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return <Navigation className="w-4 h-4" />;
      case 'interaction':
        return <MousePointerClick className="w-4 h-4" />;
      case 'engagement':
        return <Activity className="w-4 h-4" />;
      case 'feature':
        return <Zap className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const filteredEvents = selectedCategory
    ? recentEvents.filter((e) => e.category === selectedCategory)
    : recentEvents;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics Dashboard
          </DialogTitle>
          <DialogDescription>
            View user interactions and engagement metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/60 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold">{summary.totalEvents}</p>
                    </div>
                    <Activity className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Session Duration</p>
                      <p className="text-2xl font-bold">
                        {formatDuration(Date.now() - summary.sessionStart)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Categories</p>
                      <p className="text-2xl font-bold">
                        {Object.keys(summary.eventsByCategory).length}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Event Types</p>
                      <p className="text-2xl font-bold">
                        {Object.keys(summary.eventsByType).length}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Events by Category */}
          {summary && Object.keys(summary.eventsByCategory).length > 0 && (
            <Card className="bg-card/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Events by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {Object.entries(summary.eventsByCategory).map(([category, count]) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setSelectedCategory(selectedCategory === category ? null : category)
                      }
                      className="flex items-center gap-2"
                    >
                      {getCategoryIcon(category)}
                      {category}
                      <span className="ml-1 px-1.5 py-0.5 bg-primary/20 rounded text-xs">
                        {count}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Events */}
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Events</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={updateAnalytics}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredEvents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No events to display
                    </p>
                  ) : (
                    filteredEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5 text-primary">
                              {getCategoryIcon(event.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{event.category}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm">{event.action}</span>
                                {event.label && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-sm text-muted-foreground">
                                      {event.label}
                                    </span>
                                  </>
                                )}
                              </div>
                              {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {Object.entries(event.metadata)
                                    .slice(0, 2)
                                    .map(([key, value]) => (
                                      <span key={key} className="mr-3">
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(event.timestamp)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}


