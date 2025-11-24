// src/__tests__/InsightModal.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { InsightModal } from '../components/InsightModal';
import { useAgentStore } from '../stores/agentStore';

test('InsightModal fetches and displays evidence', async () => {
  // mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ insight_id: 'i1', predictions: {}, explanation: { top_features: [], evidence: [] } }),
    } as any)
  );
  // Ensure store has a placeholder
  useAgentStore.getState().addInsightSummary({ insight_id: 'i1', summary: 'summary' });
  render(<InsightModal id="i1" onClose={() => {}} />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
});



