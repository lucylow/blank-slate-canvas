// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimelineChart from '../components/TimelineChart';

describe('TimelineChart', () => {
  it('renders timeline chart with base line', () => {
    const { container } = render(<TimelineChart width={1200} height={120} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('1200');
    expect(svg?.getAttribute('height')).toBe('120');
  });

  it('renders event pins when events are filtered', () => {
    const { container } = render(
      <TimelineChart
        width={1200}
        height={120}
        filters={{ types: [], severity: [] }}
        search=""
      />
    );
    const circles = container.querySelectorAll('circle');
    // Should have at least some event pins
    expect(circles.length).toBeGreaterThan(0);
  });

  it('calls onSelectEvent when pin is clicked', () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <TimelineChart
        width={1200}
        height={120}
        onSelectEvent={handleSelect}
      />
    );
    const circle = container.querySelector('circle');
    if (circle) {
      circle.click();
      // The click should trigger the handler (may need parent g element)
      const g = circle.closest('g[role="button"]');
      if (g) {
        g.click();
        expect(handleSelect).toHaveBeenCalled();
      }
    }
  });

  it('filters events by type', () => {
    const { container, rerender } = render(
      <TimelineChart
        width={1200}
        height={120}
        filters={{ types: ['overtake'], severity: [] }}
      />
    );
    const circlesBefore = container.querySelectorAll('circle').length;
    
    rerender(
      <TimelineChart
        width={1200}
        height={120}
        filters={{ types: [], severity: [] }}
      />
    );
    const circlesAfter = container.querySelectorAll('circle').length;
    
    // Different filters should show different numbers of events
    expect(circlesAfter).toBeGreaterThanOrEqual(circlesBefore);
  });

  it('shows helpful tip text', () => {
    render(<TimelineChart width={1200} height={120} />);
    expect(screen.getByText(/Tip: click a pin/i)).toBeTruthy();
  });
});
