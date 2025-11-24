import React, { useState } from "react";
import type { Highlight } from "../lib/raceStoryGenerator";

interface HighlightEvidence {
  sectorDelta?: { sector: number; delta: number };
  tireCondition?: { wearPercentage: number; wornThreshold: number };
  paceChange?: number;
  pitTiming?: { pitLap: number | null; pitType: string | null };
}

interface HighlightWithEvidence extends Highlight {
  evidence: HighlightEvidence;
}

export const RaceStoryHighlights: React.FC<{ highlights: HighlightWithEvidence[] }> = ({
  highlights,
}) => {
  const [selectedLap, setSelectedLap] = useState<number>(highlights[0]?.lap || 0);

  const selectedHighlight = highlights.find((h) => h.lap === selectedLap) || highlights[0];

  if (!selectedHighlight) {
    return (
      <div className="p-6 max-w-3xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Race Story Key Moments</h2>
        <p className="text-gray-400">No highlights available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Race Story Key Moments</h2>

      {/* Timeline navigation */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-3">
        {highlights.map(({ lap, type }) => (
          <button
            key={lap}
            className={`px-4 py-2.5 rounded-md whitespace-nowrap transition-colors ${
              lap === selectedLap
                ? "bg-indigo-600 font-semibold"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => setSelectedLap(lap)}
          >
            Lap {lap}: {type}
          </button>
        ))}
      </div>

      {/* Highlight description */}
      <div className="mb-6">
        <p className="text-lg font-medium leading-relaxed">{selectedHighlight.description}</p>
      </div>

      {/* Evidence details */}
      <div className="bg-gray-800 rounded-md p-5 space-y-3">
        <h3 className="font-semibold text-indigo-400 mb-4">Evidence</h3>
        {selectedHighlight.evidence.sectorDelta && (
          <div className="flex items-center gap-3">
            <strong className="text-gray-300">Sector Delta:</strong>
            <span className="text-white">
              Sector {selectedHighlight.evidence.sectorDelta.sector} change of{" "}
              {Math.abs(selectedHighlight.evidence.sectorDelta.delta).toFixed(2)} seconds
              {selectedHighlight.evidence.sectorDelta.delta < 0 ? (
                <span className="text-green-400 ml-2">(Gain)</span>
              ) : (
                <span className="text-red-400 ml-2">(Loss)</span>
              )}
            </span>
          </div>
        )}
        {selectedHighlight.evidence.tireCondition && (
          <div className="flex items-center gap-3">
            <strong className="text-gray-300">Tire Condition:</strong>
            <span className="text-white">
              Wear at {selectedHighlight.evidence.tireCondition.wearPercentage}%, threshold{" "}
              {selectedHighlight.evidence.tireCondition.wornThreshold}%
            </span>
          </div>
        )}
        {typeof selectedHighlight.evidence.paceChange === "number" && (
          <div className="flex items-center gap-3">
            <strong className="text-gray-300">Pace Change:</strong>
            <span
              className={
                selectedHighlight.evidence.paceChange < 0
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {selectedHighlight.evidence.paceChange.toFixed(2)} seconds
            </span>
          </div>
        )}
        {selectedHighlight.evidence.pitTiming && (
          <div className="flex items-center gap-3">
            <strong className="text-gray-300">Pit Timing:</strong>
            <span className="text-white">
              {selectedHighlight.evidence.pitTiming.pitType} on lap{" "}
              {selectedHighlight.evidence.pitTiming.pitLap}
            </span>
          </div>
        )}
      </div>

      {/* Broadcast card preview */}
      <div className="mt-8 bg-indigo-950 border border-indigo-700 rounded-md p-5">
        <h3 className="font-semibold text-indigo-300 mb-3">Broadcast Card</h3>
        <div className="text-sm space-y-2">
          <div className="font-bold text-white">
            {selectedHighlight.type} on Lap {selectedHighlight.lap}
          </div>
          <div className="text-gray-300 leading-relaxed">{selectedHighlight.description}</div>
        </div>
      </div>
    </div>
  );
};



