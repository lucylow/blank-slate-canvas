import React from "react";
import { RaceStoryGenerator } from "../lib/raceStoryGenerator";
import { mockRaceTelemetry } from "../mocks/raceTelemetryMock";
import { RaceStoryHighlights } from "./RaceStoryHighlights";

/**
 * Demo component showcasing the Race Story Generator
 * This demonstrates how to use the generator with mock telemetry data
 */
export const RaceStoryDemo: React.FC = () => {
  // Initialize the generator with mock telemetry
  const generator = new RaceStoryGenerator(mockRaceTelemetry);
  const keyHighlights = generator.identifyKeyMoments();
  const englishSummaries = generator.generateEnglishSummaries(keyHighlights);
  const broadcastCards = generator.generateBroadcastCards(keyHighlights);

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Race Story Generator</h1>
          <p className="text-gray-400">
            Broadcast & Debrief - Automatically identifies key race moments with telemetry evidence
          </p>
        </div>

        {/* Interactive Highlights Component */}
        <RaceStoryHighlights highlights={keyHighlights} />

        {/* English Summaries Section */}
        <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">English Summaries</h2>
          <div className="space-y-3">
            {englishSummaries.map((summary, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-md p-4 border-l-4 border-indigo-500"
              >
                <p className="text-gray-200">{summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Broadcast Cards Section */}
        <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Broadcast Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {broadcastCards.map((card, index) => (
              <div
                key={index}
                className="bg-indigo-950 border border-indigo-700 rounded-md p-4"
              >
                <h3 className="font-bold text-indigo-300 mb-2">{card.title}</h3>
                <p className="text-gray-300 text-sm mb-3">{card.mainText}</p>
                <div className="text-xs text-gray-400 space-y-1">
                  {card.evidence.sectorDelta && (
                    <div>
                      Sector {card.evidence.sectorDelta.sector}:{" "}
                      {Math.abs(card.evidence.sectorDelta.delta).toFixed(2)}s
                    </div>
                  )}
                  {card.evidence.tireCondition && (
                    <div>
                      Tire Wear: {card.evidence.tireCondition.wearPercentage}%
                    </div>
                  )}
                  {typeof card.evidence.paceChange === "number" && (
                    <div>Pace Change: {card.evidence.paceChange.toFixed(2)}s</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Telemetry Data (for debugging/inspection) */}
        <details className="bg-gray-900 text-white rounded-lg shadow-lg p-6">
          <summary className="text-xl font-bold mb-4 cursor-pointer">
            Raw Telemetry Data (Click to expand)
          </summary>
          <pre className="bg-gray-800 rounded-md p-4 overflow-x-auto text-sm">
            {JSON.stringify(mockRaceTelemetry, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

