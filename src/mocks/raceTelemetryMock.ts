import type { RaceTelemetry } from "../lib/raceStoryGenerator";

// Mock data for Race Story Generator telemetry and highlights
export const mockRaceTelemetry: RaceTelemetry[] = [
  {
    lap: 10,
    sectorTimes: [30.5, 31.2, 28.7],
    tireCondition: { wearPercentage: 48, wornThreshold: 70 },
    pitStatus: { pitLap: null, pitType: null },
    paceDelta: 0.05,
    position: 5,
    stressMetric: 45,
  },
  {
    lap: 11,
    sectorTimes: [30.4, 31.0, 28.5],
    tireCondition: { wearPercentage: 50, wornThreshold: 70 },
    pitStatus: { pitLap: null, pitType: null },
    paceDelta: -0.1,
    position: 4,
    stressMetric: 50,
  },
  {
    lap: 15,
    sectorTimes: [30.7, 33.1, 29.2],
    tireCondition: { wearPercentage: 72, wornThreshold: 70 },
    pitStatus: { pitLap: null, pitType: null },
    paceDelta: 0.28,
    position: 4,
    stressMetric: 70,
  },
  {
    lap: 18,
    sectorTimes: [31.0, 33.5, 29.5],
    tireCondition: { wearPercentage: 74, wornThreshold: 70 },
    pitStatus: { pitLap: 18, pitType: "undercut" },
    paceDelta: 0.35,
    position: 3,
    stressMetric: 75,
  },
  {
    lap: 22,
    sectorTimes: [29.9, 30.0, 27.5],
    tireCondition: { wearPercentage: 62, wornThreshold: 70 },
    pitStatus: { pitLap: null, pitType: null },
    paceDelta: -0.15,
    position: 2,
    stressMetric: 65,
  },
  {
    lap: 25,
    sectorTimes: [30.3, 30.5, 27.8],
    tireCondition: { wearPercentage: 66, wornThreshold: 70 },
    pitStatus: { pitLap: null, pitType: null },
    paceDelta: 0.1,
    position: 2,
    stressMetric: 85,
  },
];


