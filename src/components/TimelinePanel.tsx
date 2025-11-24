import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TimelineChart from './TimelineChart';
import eventsData from '../content/timeline-events.json';
import { Download } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  ts: string;
  seconds: number;
  lap: number;
  sector: number;
  severity: string;
  tags?: string[];
  video?: string | null;
  insight_id?: string | null;
  notes?: string;
}

interface TimelinePanelProps {
  onJumpTo?: (event: TimelineEvent) => void;
}

export default function TimelinePanel({ onJumpTo = () => {} }: TimelinePanelProps) {
  const [filters, setFilters] = useState<{ types: string[]; severity: string[] }>({
    types: [],
    severity: []
  });
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const types = useMemo(() => Array.from(new Set(eventsData.map((e) => e.type))), []);
  const severities = useMemo(() => Array.from(new Set(eventsData.map((e) => e.severity))), []);

  const toggleFilter = (key: 'types' | 'severity', val: string) => {
    setFilters((prev) => {
      const arr = new Set(prev[key] || []);
      if (arr.has(val)) {
        arr.delete(val);
      } else {
        arr.add(val);
      }
      return { ...prev, [key]: Array.from(arr) };
    });
  };

  const handleSelectEvent = (ev: TimelineEvent) => {
    setSelectedEvent(ev);
    onJumpTo(ev);
  };

  const filteredEvents = useMemo(() => {
    return eventsData.filter((ev) => {
      if (filters.types.length && !filters.types.includes(ev.type)) return false;
      if (filters.severity.length && !filters.severity.includes(ev.severity)) return false;
      if (search && !(`${ev.title} ${(ev.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()))) {
        return false;
      }
      return true;
    });
  }, [filters, search]);

  const handleExportCSV = () => {
    const rows = [['id', 'title', 'type', 'ts', 'lap', 'sector', 'severity', 'tags']];
    eventsData.forEach((ev) => {
      rows.push([
        ev.id,
        ev.title,
        ev.type,
        ev.ts,
        String(ev.lap),
        String(ev.sector),
        ev.severity,
        (ev.tags || []).join('|')
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-events.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(eventsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-events.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'warn':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'success':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      default:
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    }
  };

  return (
    <section aria-label="Timeline view" className="p-4 space-y-4">
      <h3 className="text-xl font-semibold">Timeline View</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filters */}
        <aside className="col-span-1 space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Search</div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events or tags"
              className="w-full"
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Types</div>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <Button
                  key={t}
                  onClick={() => toggleFilter('types', t)}
                  variant={filters.types.includes(t) ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Severity</div>
            <div className="flex flex-wrap gap-2">
              {severities.map((s) => (
                <Button
                  key={s}
                  onClick={() => toggleFilter('severity', s)}
                  variant={filters.severity.includes(s) ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">Export</div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleExportJSON} size="sm" variant="outline" className="w-full">
                <Download className="h-3 w-3 mr-2" />
                Export JSON
              </Button>
              <Button onClick={handleExportCSV} size="sm" variant="outline" className="w-full">
                <Download className="h-3 w-3 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </aside>

        {/* Chart & list */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <TimelineChart
                  width={1000}
                  height={140}
                  filters={filters}
                  search={search}
                  onSelectEvent={handleSelectEvent}
                />
              </div>
            </CardContent>
          </Card>

          <div>
            <h4 className="text-lg font-semibold mb-3">Event list</h4>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredEvents.map((ev) => (
                <Card
                  key={ev.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedEvent?.id === ev.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectEvent(ev as TimelineEvent)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{ev.title}</h5>
                          <Badge className={getSeverityColor(ev.severity)}>{ev.severity}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Lap {ev.lap} • Sector {ev.sector} • {new Date(ev.ts).toLocaleTimeString()}
                        </p>
                        {ev.tags && ev.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {ev.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="text-xs text-muted-foreground">{ev.type}</div>
                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEvent(ev as TimelineEvent);
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            Jump
                          </Button>
                          {ev.video && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(ev.video!, '_blank');
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Open
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected event details */}
          {selectedEvent && (
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-base">Selected: {selectedEvent.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Jumping to {selectedEvent.seconds}s in the player. Use annotation tools below.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
