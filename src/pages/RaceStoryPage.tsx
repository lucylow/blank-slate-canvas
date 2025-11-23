import React from "react";
import { RaceStoryGenerator } from "../lib/raceStoryGenerator";
import { mockRaceTelemetry } from "../mocks/raceTelemetryMock";
import { RaceStoryHighlights } from "../components/RaceStoryHighlights";

/**
 * Race Story Generator Page
 * 
 * Automatically identifies key race moments such as overtakes, defensive battles,
 * tire cliff moments, pit timing shifts, time-delta inflection points, and stress peaks.
 * Generates 3-5 highlight bullets per race backed by telemetry data with evidence.
 */
export const RaceStoryPage: React.FC = () => {
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
          <p className="text-gray-400 text-lg">
            Broadcast & Debrief - Automatically identifies key race moments with telemetry evidence
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Converts raw race data into shareable story moments for debriefs, social content, and broadcasters
          </p>
        </div>

        {/* Interactive Highlights Component */}
        <RaceStoryHighlights highlights={keyHighlights} />

        {/* English Summaries Section */}
        <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">English Summaries</h2>
          <p className="text-gray-400 text-sm mb-4">
            Human-readable summaries generated from telemetry data (Data → English translation)
          </p>
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
          <p className="text-gray-400 text-sm mb-4">
            Media-ready visuals for commentary and post-race recaps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {broadcastCards.map((card, index) => (
              <div
                key={index}
                className="bg-indigo-950 border border-indigo-700 rounded-md p-4 hover:border-indigo-500 transition-colors"
              >
                <h3 className="font-bold text-indigo-300 mb-2">{card.title}</h3>
                <p className="text-gray-300 text-sm mb-3">{card.mainText}</p>
                <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-indigo-800">
                  {card.evidence.sectorDelta && (
                    <div>
                      <span className="text-indigo-400">Sector {card.evidence.sectorDelta.sector}:</span>{" "}
                      {Math.abs(card.evidence.sectorDelta.delta).toFixed(2)}s
                      {card.evidence.sectorDelta.delta < 0 ? (
                        <span className="text-green-400 ml-1">(Gain)</span>
                      ) : (
                        <span className="text-red-400 ml-1">(Loss)</span>
                      )}
                    </div>
                  )}
                  {card.evidence.tireCondition && (
                    <div>
                      <span className="text-indigo-400">Tire Wear:</span>{" "}
                      {card.evidence.tireCondition.wearPercentage}% (Threshold:{" "}
                      {card.evidence.tireCondition.wornThreshold}%)
                    </div>
                  )}
                  {typeof card.evidence.paceChange === "number" && (
                    <div>
                      <span className="text-indigo-400">Pace Change:</span>{" "}
                      <span
                        className={
                          card.evidence.paceChange < 0 ? "text-green-400" : "text-red-400"
                        }
                      >
                        {card.evidence.paceChange.toFixed(2)}s
                      </span>
                    </div>
                  )}
                  {card.evidence.pitTiming && (
                    <div>
                      <span className="text-indigo-400">Pit Strategy:</span>{" "}
                      {card.evidence.pitTiming.pitType} on lap {card.evidence.pitTiming.pitLap}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features Info */}
        <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Key Features</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>
                <strong>Automatic Detection:</strong> Identifies overtakes, defensive battles, tire cliff moments, pit timing shifts, and stress peaks
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>
                <strong>Telemetry Evidence:</strong> Each highlight includes sector deltas, tire condition, pace change, and pit timing data
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>
                <strong>Data → English:</strong> Converts raw race telemetry into human-readable summaries
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>
                <strong>Broadcast Ready:</strong> Generates media-ready visuals for commentary and post-race recaps
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>
                <strong>3-5 Key Moments:</strong> Focuses on the most significant race events based on telemetry significance
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Default export for routing
export default RaceStoryPage;
