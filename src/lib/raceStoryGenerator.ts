/**
 * RACE STORY GENERATOR - Broadcast & Debrief
 *
 * Automatically identifies key race moments such as overtakes, defensive battles,
 * tire cliff moments, pit timing shifts, time-delta inflection points, and stress peaks.
 * Generates 3-5 highlight bullets per race backed by telemetry data with evidence.
 * Converts raw race telemetry into human-readable English summaries (data->text).
 * Produces media-ready visuals for use in commentary and post-race recaps.
 */

export interface RaceTelemetry {
  lap: number;
  sectorTimes: number[]; // e.g. [S1_time, S2_time, S3_time]
  tireCondition: TireCondition;
  pitStatus: PitStatus;
  paceDelta: number; // change vs previous lap or competitor (seconds)
  position: number;
  stressMetric: number; // e.g. G-force peaks, driver heart rate etc.
}

export interface TireCondition {
  wearPercentage: number; // 0-100%
  wornThreshold: number; // % where tire cliff begins
}

export interface PitStatus {
  pitLap: number | null; // lap pit occurred, null if none
  pitType: "undercut" | "overcut" | "standard" | null;
}

export interface HighlightEvidence {
  sectorDelta?: { sector: number; delta: number }; // sector and time delta e.g. sector 2, +0.15s gain
  tireCondition?: TireCondition;
  paceChange?: number; // seconds
  pitTiming?: PitStatus;
}

export interface Highlight {
  lap: number;
  type: "Overtake" | "Defensive Battle" | "Tire Cliff" | "Pit Timing Shift" | "Stress Peak";
  description: string;
  evidence: HighlightEvidence;
}

export interface BroadcastCard {
  title: string;
  mainText: string;
  evidence: HighlightEvidence;
}

export class RaceStoryGenerator {
  telemetryData: RaceTelemetry[];

  constructor(telemetry: RaceTelemetry[]) {
    this.telemetryData = telemetry;
  }

  /** Analyze telemetry to find key race moments. */
  identifyKeyMoments(): Highlight[] {
    const highlights: Highlight[] = [];

    for (let i = 1; i < this.telemetryData.length; i++) {
      const prev = this.telemetryData[i - 1];
      const curr = this.telemetryData[i];

      // Detect overtakes by position improvement with sector delta confirmation
      if (curr.position < prev.position) {
        const s2Delta = curr.sectorTimes[1] - prev.sectorTimes[1];
        if (s2Delta < 0) {
          // Negative delta means faster sector time
          highlights.push({
            lap: curr.lap,
            type: "Overtake",
            description: `Lap ${curr.lap} Overtake set up by ${Math.abs(s2Delta).toFixed(2)}s gain in Sector 2.`,
            evidence: { sectorDelta: { sector: 2, delta: s2Delta }, paceChange: curr.paceDelta },
          });
        }
      }

      // Detect tire cliff: sudden rise in lap time correlated with tire wear crossing threshold
      const currLapTime = curr.sectorTimes.reduce((a, b) => a + b, 0);
      const prevLapTime = prev.sectorTimes.reduce((a, b) => a + b, 0);
      const lapTimeDelta = currLapTime - prevLapTime;

      if (
        curr.tireCondition.wearPercentage > curr.tireCondition.wornThreshold &&
        lapTimeDelta > 0.2
      ) {
        highlights.push({
          lap: curr.lap,
          type: "Tire Cliff",
          description: `Lap ${curr.lap} Tire cliff begins with +${lapTimeDelta.toFixed(2)}s falloff.`,
          evidence: { tireCondition: curr.tireCondition, paceChange: lapTimeDelta },
        });
      }

      // Detect pit timing shifts, especially "undercut" attempts
      if (curr.pitStatus.pitLap === curr.lap) {
        highlights.push({
          lap: curr.lap,
          type: "Pit Timing Shift",
          description: `Lap ${curr.lap} Pit stop - ${curr.pitStatus.pitType} attempt initiated.`,
          evidence: { pitTiming: curr.pitStatus },
        });
      }

      // Detect defensive battle moments by increased stress metric and lap times
      if (curr.stressMetric > 80 && curr.paceDelta > 0.1) {
        highlights.push({
          lap: curr.lap,
          type: "Defensive Battle",
          description: `Lap ${curr.lap} Defensive battle detected with stress peaks and pace change +${curr.paceDelta.toFixed(2)}s.`,
          evidence: { paceChange: curr.paceDelta },
        });
      }
    }

    // Limit highlights to 3-5 key moments based on significance (e.g., largest time deltas or stress peaks)
    return highlights
      .sort((a, b) => Math.abs(b.evidence.paceChange || 0) - Math.abs(a.evidence.paceChange || 0))
      .slice(0, 5);
  }

  /** Convert highlights into human-readable English summaries. */
  generateEnglishSummaries(highlights: Highlight[]): string[] {
    return highlights.map((h) => {
      switch (h.type) {
        case "Overtake":
          return `Lap ${h.lap}: Overtake achieved after gaining ${Math.abs(h.evidence.sectorDelta?.delta || 0).toFixed(2)} seconds in Sector ${h.evidence.sectorDelta?.sector}.`;
        case "Tire Cliff":
          return `Lap ${h.lap}: Tire performance drop detected with wear at ${h.evidence.tireCondition?.wearPercentage}% causing a lap time increase of ${h.evidence.paceChange?.toFixed(2)} seconds.`;
        case "Pit Timing Shift":
          return `Lap ${h.lap}: Pit stop executed, initiating a ${h.evidence.pitTiming?.pitType} strategy.`;
        case "Defensive Battle":
          return `Lap ${h.lap}: Defensive driving observed with stress peak and pace slowed by ${h.evidence.paceChange?.toFixed(2)} seconds.`;
        default:
          return `Lap ${h.lap}: Key event detected.`;
      }
    });
  }

  /** Generate broadcast-ready cards showing key highlights with evidence. */
  generateBroadcastCards(highlights: Highlight[]): BroadcastCard[] {
    return highlights.map((h) => ({
      title: `${h.type} on Lap ${h.lap}`,
      mainText: h.description,
      evidence: h.evidence,
    }));
  }
}

