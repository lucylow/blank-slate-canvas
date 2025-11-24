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
    <div className="p-6 max-w-3xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Race Story Key Moments</h2>

      {/* Timeline navigation */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {highlights.map(({ lap, type }) => (
          <button
            key={lap}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
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
      <div className="mb-4">
        <p className="text-lg font-medium">{selectedHighlight.description}</p>
      </div>

      {/* Evidence details */}
      <div className="bg-gray-800 rounded-md p-4 space-y-2">
        <h3 className="font-semibold text-indigo-400 mb-3">Evidence</h3>
        {selectedHighlight.evidence.sectorDelta && (
          <div className="flex items-center gap-2">
            <strong className="text-gray-300">Sector Delta:</strong>
            <span className="text-white">
              Sector {selectedHighlight.evidence.sectorDelta.sector} change of{" "}
              {Math.abs(selectedHighlight.evidence.sectorDelta.delta).toFixed(2)} seconds
              {selectedHighlight.evidence.sectorDelta.delta < 0 ? (
                <span className="text-green-400 ml-1">(Gain)</span>
              ) : (
                <span className="text-red-400 ml-1">(Loss)</span>
              )}
            </span>
          </div>
        )}
        {selectedHighlight.evidence.tireCondition && (
          <div className="flex items-center gap-2">
            <strong className="text-gray-300">Tire Condition:</strong>
            <span className="text-white">
              Wear at {selectedHighlight.evidence.tireCondition.wearPercentage}%, threshold{" "}
              {selectedHighlight.evidence.tireCondition.wornThreshold}%
            </span>
          </div>
        )}
        {typeof selectedHighlight.evidence.paceChange === "number" && (
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            <strong className="text-gray-300">Pit Timing:</strong>
            <span className="text-white">
              {selectedHighlight.evidence.pitTiming.pitType} on lap{" "}
              {selectedHighlight.evidence.pitTiming.pitLap}
            </span>
          </div>
        )}
      </div>

      {/* Broadcast card preview */}
      <div className="mt-6 bg-indigo-950 border border-indigo-700 rounded-md p-4">
        <h3 className="font-semibold text-indigo-300 mb-2">Broadcast Card</h3>
        <div className="text-sm">
          <div className="font-bold text-white mb-1">
            {selectedHighlight.type} on Lap {selectedHighlight.lap}
          </div>
          <div className="text-gray-300">{selectedHighlight.description}</div>
        </div>
      </div>
    </div>
  );
};



