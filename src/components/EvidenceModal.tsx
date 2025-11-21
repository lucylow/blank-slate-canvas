// src/components/EvidenceModal.tsx
import React from "react";

type TelemetryRow = {
  meta_time: string;
  lapdist_m?: number;
  speed_kmh?: number;
  accx_can?: number;
  accy_can?: number;
  Steering_Angle?: number;
};

type EvidenceItem = {
  note: string;
  telemetry_rows: TelemetryRow[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  evidence: EvidenceItem[] | null;
};

function Sparkline({ rows, field }: { rows: TelemetryRow[]; field: keyof TelemetryRow }) {
  if (!rows || rows.length === 0) return <div className="text-xs text-gray-400">no data</div>;

  const values = rows.map(r => Number(r[field] ?? 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = 120, h = 28, pad = 2;
  const norm = (v:number) => (max === min ? h/2 : ((v - min) / (max - min)) * (h - pad*2));
  const points = values.map((v,i) => `${(i/(values.length-1))*w},${h - pad - norm(v)}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline fill="none" stroke="#EB0A1E" strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function EvidenceModal({ open, onClose, evidence }: Props) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl bg-[#0f1724] rounded-lg p-5 ring-1 ring-gray-800 text-white">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Evidence & supporting telemetry</h2>
            <p className="text-sm text-gray-300 mt-1">Top signals used by the model and example telemetry rows</p>
          </div>
          <button onClick={onClose} className="ml-4 rounded bg-gray-800 px-3 py-1 text-sm">Close</button>
        </header>

        <div className="mt-4 space-y-4">
          {(!evidence || evidence.length === 0) && (
            <div className="text-sm text-gray-400">No evidence available (demo mode).</div>
          )}

          {evidence && evidence.slice(0,3).map((ev, idx) => (
            <div key={idx} className="rounded border border-gray-700 p-3 bg-gradient-to-b from-gray-900 to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">#{idx+1} — {ev.note}</div>
                  <div className="text-xs text-gray-400 mt-1">Example telemetry supporting this signal</div>
                </div>
                <div className="text-xs text-gray-400">rows: {ev.telemetry_rows?.length ?? 0}</div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-400">Speed (kph)</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Sparkline rows={ev.telemetry_rows} field="speed_kmh" />
                    <div className="text-xs text-gray-300">{ev.telemetry_rows?.[ev.telemetry_rows.length-1]?.speed_kmh ?? '—'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Lateral G (accy)</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Sparkline rows={ev.telemetry_rows} field="accy_can" />
                    <div className="text-xs text-gray-300">{ev.telemetry_rows?.[ev.telemetry_rows.length-1]?.accy_can ?? '—'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Steering (deg)</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Sparkline rows={ev.telemetry_rows} field="Steering_Angle" />
                    <div className="text-xs text-gray-300">{ev.telemetry_rows?.[ev.telemetry_rows.length-1]?.Steering_Angle ?? '—'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 overflow-auto rounded border border-gray-800 bg-black/30 p-2 text-xs">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="text-left text-gray-400">
                      <th className="w-36">time</th>
                      <th className="w-24">lapdist</th>
                      <th className="w-20">speed</th>
                      <th className="w-20">accx</th>
                      <th className="w-20">accy</th>
                      <th className="w-20">steer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ev.telemetry_rows?.map((r, i) => (
                      <tr key={i} className="border-t border-gray-800">
                        <td className="py-1 text-xs text-gray-200">{new Date(r.meta_time).toLocaleTimeString()}</td>
                        <td className="py-1 text-xs text-gray-200">{r.lapdist_m ?? '-'}</td>
                        <td className="py-1 text-xs text-gray-200">{r.speed_kmh ?? '-'}</td>
                        <td className="py-1 text-xs text-gray-200">{r.accx_can ?? '-'}</td>
                        <td className="py-1 text-xs text-gray-200">{r.accy_can ?? '-'}</td>
                        <td className="py-1 text-xs text-gray-200">{r.Steering_Angle ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded bg-[#EB0A1E] px-4 py-2 text-sm font-semibold">Close</button>
        </footer>
      </div>
    </div>
  );
}


