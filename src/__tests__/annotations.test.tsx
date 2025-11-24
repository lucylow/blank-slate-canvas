// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AnnotationPanel from '../components/AnnotationPanel';
import VideoAnalysisCard from '../components/VideoAnalysisCard';
import { saveAnnotation, loadAnnotations } from '../api/mockAnnotations';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AnnotationPanel', () => {
  it('renders annotation panel with heading', () => {
    render(<AnnotationPanel />);
    expect(screen.getByText(/Annotations & Agent Analysis/i)).toBeTruthy();
  });

  it('renders video analysis cards', async () => {
    render(<AnnotationPanel />);
    // Wait for cards to load from JSON
    await waitFor(() => {
      // Should have at least one card rendered
      expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    });
  });
});

describe('VideoAnalysisCard', () => {
  const mockAnalysis = {
    id: 'test-event-1',
    title: 'Test Overtake',
    video: '/videos/test.mp4',
    event_ts: '2025-03-15T14:12:34.000Z',
    lap: 19,
    sector: 2,
    timestamp_s: 12.34,
    telemetry: { speed_kph: 185, g: 2.4 },
    agents: {
      predictor: { loss_s_per_lap: 0.321, laps_until_cliff: 3, confidence: 0.78 },
      simulator: { recommendation: 'pit_lap_15', expected_gain_s: 3.3, confidence: 0.6 },
      anomaly: { score: 0.12, type: 'none' }
    },
    shap: [
      { feature: 'tire_stress', impact: 0.21 },
      { feature: 'brake_energy', impact: 0.18 }
    ],
    fingerprint: { baseline_similarity: 0.82, note: 'Test note' },
    coaching: ['Recommendation 1', 'Recommendation 2'],
    severity: 'info',
    tags: ['overtake']
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders analysis card with title', () => {
    render(<VideoAnalysisCard analysis={mockAnalysis} />);
    expect(screen.getByText('Test Overtake')).toBeTruthy();
  });

  it('displays telemetry data', () => {
    render(<VideoAnalysisCard analysis={mockAnalysis} />);
    expect(screen.getByText(/185.*km\/h/i)).toBeTruthy();
    expect(screen.getByText(/2\.4G/i)).toBeTruthy();
  });

  it('displays agent outputs', () => {
    render(<VideoAnalysisCard analysis={mockAnalysis} />);
    expect(screen.getByText(/3.*laps/i)).toBeTruthy();
    expect(screen.getByText(/pit_lap_15/i)).toBeTruthy();
  });

  it('displays coaching recommendations', () => {
    render(<VideoAnalysisCard analysis={mockAnalysis} />);
    expect(screen.getByText('Recommendation 1')).toBeTruthy();
    expect(screen.getByText('Recommendation 2')).toBeTruthy();
  });

  it('has jump to event button', () => {
    render(<VideoAnalysisCard analysis={mockAnalysis} />);
    expect(screen.getByText(/Jump to event/i)).toBeTruthy();
  });

  it('has export button', () => {
    render(<VideoAnalysisCard analysis={mockAnalysis} />);
    expect(screen.getByText(/Export/i)).toBeTruthy();
  });

  it('allows adding tags', async () => {
    const { container } = render(<VideoAnalysisCard analysis={mockAnalysis} />);
    const tagInput = container.querySelector('input[placeholder="Add tag"]');
    expect(tagInput).toBeTruthy();
  });

  it('saves annotation to localStorage', () => {
    const eventId = 'test-event-1';
    saveAnnotation(eventId, {
      tags: ['test-tag'],
      severity: 'high',
      note: 'Test note',
      action: 'manual_update'
    });
    
    const loaded = loadAnnotations();
    expect(loaded[eventId]).toBeTruthy();
    expect(loaded[eventId].tags).toContain('test-tag');
    expect(loaded[eventId].severity).toBe('high');
  });
});
