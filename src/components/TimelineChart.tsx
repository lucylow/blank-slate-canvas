import React, { useMemo } from 'react';
import eventsData from '../content/timeline-events.json';

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
}

interface TimelineChartProps {
  width?: number;
  height?: number;
  onSelectEvent?: (event: TimelineEvent) => void;
  filters?: { types: string[]; severity: string[] };
  search?: string;
}

function px(x: number): string {
  return `${x}px`;
}

export default function TimelineChart({
  width = 1200,
  height = 120,
  onSelectEvent = () => {},
  filters = { types: [], severity: [] },
  search = ''
}: TimelineChartProps) {
  const timelineSec = 60; // assume 60s demo window
  const padding = 24;
  const usable = width - padding * 2;

  const filtered = useMemo(() => {
    return eventsData.filter((e) => {
      if (filters.types && filters.types.length && !filters.types.includes(e.type)) return false;
      if (filters.severity && filters.severity.length && !filters.severity.includes(e.severity)) return false;
      if (search && !(`${e.title} ${(e.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()))) {
        return false;
      }
      return true;
    });
  }, [filters, search]);

  const xFor = (s: number): number => {
    return padding + (Math.max(0, Math.min(timelineSec, s)) / timelineSec) * usable;
  };

  return (
    <div className="timeline-chart" role="region" aria-label="Session timeline" style={{ width }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* base line */}
        <line
          x1={padding}
          x2={width - padding}
          y1={height / 2}
          y2={height / 2}
          stroke="#E6EEF8"
          strokeWidth="2"
        />
        {/* ticks - every 10s */}
        {[0, 10, 20, 30, 40, 50, 60].map((t) => {
          const x = xFor(t);
          return (
            <g key={t}>
              <line
                x1={x}
                x2={x}
                y1={height / 2 - 8}
                y2={height / 2 + 8}
                stroke="#E6EEF8"
                strokeWidth="1"
              />
              <text x={x} y={height / 2 + 28} fontSize="12" textAnchor="middle" fill="#94A3B8">
                {t}s
              </text>
            </g>
          );
        })}
        {/* event pins */}
        {filtered.map((ev) => {
          const x = xFor(ev.seconds || 0);
          const color =
            ev.severity === 'high'
              ? '#B91C1C'
              : ev.severity === 'warn'
              ? '#F59E0B'
              : ev.severity === 'success'
              ? '#10B981'
              : '#2563EB';
          return (
            <g
              key={ev.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectEvent(ev as TimelineEvent)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEvent(ev as TimelineEvent);
                }
              }}
              transform={`translate(${x}, ${height / 2})`}
              role="button"
              tabIndex={0}
              aria-label={`${ev.title} at ${ev.seconds}s`}
            >
              <circle r="8" fill={color} stroke="#fff" strokeWidth="1.5" />
              <text x="0" y="-14" fontSize="11" textAnchor="middle" fill="#0F1724">
                {ev.title}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 text-sm text-muted-foreground">
        Tip: click a pin to jump to that event in the player.
      </div>
    </div>
  );
}
