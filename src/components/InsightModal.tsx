// src/components/InsightModal.tsx
import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../stores/agentStore';

const INSIGHTS_API = process.env.REACT_APP_INSIGHTS_API || import.meta.env.VITE_INSIGHTS_API || '/api/insights';

export const InsightModal: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  const getInsight = useAgentStore((s) => s.getInsight);
  const setInsightFull = useAgentStore((s) => s.setInsightFull);
  const [loading, setLoading] = useState(false);
  const cached = getInsight(id);

  useEffect(() => {
    if (!id) return;
    if (cached && cached.explanation && cached.evidence) return; // already full

    // improved fetch with retry
    let cancelled = false;
    async function loadWithRetry(retries = 3, backoff = 300) {
      for (let i = 0; i < retries && !cancelled; i++) {
        try {
          setLoading(true);
          const res = await fetch(`${INSIGHTS_API}/${id}`);
          if (!res.ok) throw new Error('http ' + res.status);
          const json = await res.json();
          if (cancelled) return;
          setInsightFull(id, json);
          return;
        } catch (e) {
          if (i === retries - 1) console.error('final insight fetch fail', e);
          await new Promise((r) => setTimeout(r, backoff * Math.pow(2, i)));
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    }
    loadWithRetry();
    return () => { cancelled = true; };
  }, [id, cached, setInsightFull]);

  const insight = getInsight(id);
  if (!insight) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg w-11/12 md:w-3/4 max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <button className="float-right text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Close</button>
        <h3 className="text-xl font-semibold">Insight — {insight.track || insight.chassis || 'Unknown'}</h3>
        {loading ? (
          <div className="p-6">Loading evidence…</div>
        ) : (
          <>
            <div className="mt-4">
              <strong>Predictions</strong>
              <pre className="text-sm bg-black/5 p-2 rounded mt-2 overflow-auto">{JSON.stringify(insight.predictions, null, 2)}</pre>
            </div>
            <div className="mt-4">
              <strong>Top features</strong>
              <ul className="list-disc pl-5">
                {insight.explanation?.top_features?.map((f: any, i: number) => <li key={i}>{f.name} — {String(f.value)}</li>)}
              </ul>
            </div>
            <div className="mt-4">
              <strong>Evidence</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {insight.explanation?.evidence?.map((e: any, i: number) => (
                  <div key={i} className="p-2 border rounded text-xs">
                    <div><strong>lap</strong> {e.lap} · <strong>meta_time</strong> {e.meta_time}</div>
                    {/* show small inline sparkline or numbers */}
                    <div className="mt-2 text-[11px] truncate">mini-trace: {JSON.stringify(e.small_trace || e.trace || []).slice(0, 120)}</div>
                    <div className="mt-1 text-xs text-gray-500">sector {e.sector ?? '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

