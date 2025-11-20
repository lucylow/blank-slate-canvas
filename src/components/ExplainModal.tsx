// src/components/ExplainModal.tsx
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  evidence: string[];
};

const ExplainModal: React.FC<Props> = ({ open, onClose, evidence }) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-lg bg-[#0f1724] p-6 text-white ring-1 ring-gray-800">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Why this recommendation?</h2>
            <p className="text-sm text-gray-300">Top 3 evidence items from the model + telemetry</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close explanation"
            className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700"
          >
            Close
          </button>
        </header>

        <ul className="mt-4 space-y-3">
          {evidence && evidence.length ? (
            evidence.map((e, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#EB0A1E] text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm">{e}</p>
                  <p className="text-xs text-gray-400 mt-1">Supporting telemetry: sector stress, speed, lap times</p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-400">No evidence available (demo).</li>
          )}
        </ul>

        <div className="mt-6 flex justify-end gap-3">
          <a
            href="/assets/telemetry_sample.csv"
            className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            Download sample telemetry
          </a>
          <button onClick={onClose} className="rounded bg-[#EB0A1E] px-4 py-2 text-sm font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainModal;

