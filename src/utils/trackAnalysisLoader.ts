/**
 * Track Analysis Data Loader
 * 
 * Loads and parses track analysis text files from docs/reports/ai_summary_reports/
 * Applies analysis data from all 7 tracks across the application.
 */

export interface TrackAnalysisData {
  trackId: string;
  trackName: string;
  content: string;
  extractedData?: {
    executiveSummary?: string;
    keyFindings?: string[];
    statistics?: Record<string, any>;
    recommendations?: string[];
  };
}

export const TRACK_ANALYSIS_FILE_MAP: Record<string, string> = {
  barber: 'barber_analysis_report.txt',
  cota: 'cota_analysis_report.txt',
  indianapolis: 'INDIANAPOLIS_COMPREHENSIVE_ANALYSIS_REPORT.txt',
  road_america: 'ROAD_AMERICA_COMPREHENSIVE_ANALYSIS_REPORT.txt', // Will check if exists
  sebring: 'SEBRING_COMPREHENSIVE_ANALYSIS_REPORT.txt',
  sonoma: 'SONOMA_COMPREHENSIVE_ANALYSIS_REPORT.txt',
  virginia: 'vir_data_analysis_report.txt',
};

export const TRACK_ID_TO_NAME: Record<string, string> = {
  barber: 'Barber Motorsports Park',
  cota: 'Circuit of the Americas',
  indianapolis: 'Indianapolis Motor Speedway',
  road_america: 'Road America',
  sebring: 'Sebring International',
  sonoma: 'Sonoma Raceway',
  virginia: 'Virginia International Raceway',
};

/**
 * Load track analysis file content
 */
export async function loadTrackAnalysisFile(trackId: string): Promise<TrackAnalysisData | null> {
  const filename = TRACK_ANALYSIS_FILE_MAP[trackId];
  if (!filename) {
    console.warn(`No analysis file mapped for track: ${trackId}`);
    return null;
  }

  try {
    // Fetch from backend API endpoint
    const response = await fetch(`/api/reports/analysis/${trackId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Track analysis not found for ${trackId}`);
      } else {
        console.error(`Failed to load analysis for ${trackId}: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const content = await response.text();
    
    if (!content || content.trim().length === 0) {
      console.warn(`Empty content for track analysis: ${trackId}`);
      return null;
    }
    
    return {
      trackId,
      trackName: TRACK_ID_TO_NAME[trackId] || trackId,
      content,
      extractedData: parseAnalysisContent(content),
    };
  } catch (error) {
    console.error(`Error loading track analysis for ${trackId}:`, error);
    return null;
  }
}

/**
 * Load all track analysis files
 */
export async function loadAllTrackAnalyses(): Promise<TrackAnalysisData[]> {
  const trackIds = Object.keys(TRACK_ANALYSIS_FILE_MAP);
  const analyses = await Promise.all(
    trackIds.map(id => loadTrackAnalysisFile(id))
  );
  
  return analyses.filter((analysis): analysis is TrackAnalysisData => analysis !== null);
}

/**
 * Parse analysis content to extract structured data
 */
function parseAnalysisContent(content: string): TrackAnalysisData['extractedData'] {
  const lines = content.split('\n');
  const extracted: TrackAnalysisData['extractedData'] = {
    keyFindings: [],
    recommendations: [],
    statistics: {},
  };

  const currentSection = '';
  let executiveSummary = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract executive summary
    if (line.match(/^##\s+(Executive|EXECUTIVE)\s+Summary/i)) {
      i++;
      while (i < lines.length && !lines[i].match(/^##/)) {
        const summaryLine = lines[i].trim();
        if (summaryLine && !summaryLine.startsWith('|') && !summaryLine.startsWith('-')) {
          executiveSummary += summaryLine + ' ';
        }
        i++;
      }
      extracted.executiveSummary = executiveSummary.trim();
      continue;
    }

    // Extract key findings
    if (line.match(/^##?\s*(Key|KEY)\s*(Findings|FINDINGS)/i) || 
        line.match(/^##?\s*(Insights|INSIGHTS)/i) ||
        line.match(/^##?\s*(Top|TOP)\s*(Insights|INSIGHTS)/i)) {
      i++;
      while (i < lines.length && !lines[i].match(/^##/)) {
        const findingLine = lines[i].trim();
        if (findingLine.match(/^[-*•]\s+/) || findingLine.match(/^\d+\.\s+/)) {
          extracted.keyFindings?.push(findingLine.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''));
        }
        i++;
      }
      continue;
    }

    // Extract recommendations
    if (line.match(/^##?\s*(Recommendations|RECOMMENDATIONS|Strategic|STRATEGIC)/i)) {
      i++;
      while (i < lines.length && !lines[i].match(/^##/)) {
        const recLine = lines[i].trim();
        if (recLine.match(/^[-*•]\s+/) || recLine.match(/^\d+\.\s+/)) {
          extracted.recommendations?.push(recLine.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''));
        }
        i++;
      }
      continue;
    }

    // Extract statistics from tables
    if (line.startsWith('|') && line.includes('Metric') && line.includes('Value')) {
      i++;
      while (i < lines.length && lines[i].trim().startsWith('|') && !lines[i].includes('---')) {
        const statLine = lines[i].trim();
        const match = statLine.match(/\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|/);
        if (match) {
          const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
          const value = match[2].trim();
          extracted.statistics![key] = value;
        }
        i++;
      }
      continue;
    }
  }

  return extracted;
}

/**
 * Get track analysis data for a specific track
 */
export function getTrackAnalysis(trackId: string, analyses: TrackAnalysisData[]): TrackAnalysisData | undefined {
  return analyses.find(a => a.trackId === trackId);
}

/**
 * Extract key insights from all track analyses
 */
export function extractCrossTrackInsights(analyses: TrackAnalysisData[]): {
  commonPatterns: string[];
  trackComparisons: Record<string, any>;
  overallRecommendations: string[];
} {
  const commonPatterns: string[] = [];
  const trackComparisons: Record<string, any> = {};
  const overallRecommendations: string[] = [];

  // Aggregate findings from all tracks
  const allFindings = analyses.flatMap(a => a.extractedData?.keyFindings || []);
  const allRecommendations = analyses.flatMap(a => a.extractedData?.recommendations || []);

  // Extract common patterns (simplified - could be enhanced with NLP)
  const findingFrequency: Record<string, number> = {};
  allFindings.forEach(finding => {
    const keywords = finding.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    keywords.forEach(keyword => {
      findingFrequency[keyword] = (findingFrequency[keyword] || 0) + 1;
    });
  });

  Object.entries(findingFrequency)
    .filter(([_, count]) => count >= 3)
    .forEach(([keyword]) => {
      commonPatterns.push(`Common pattern: ${keyword}`);
    });

  // Build track comparisons
  analyses.forEach(analysis => {
    trackComparisons[analysis.trackId] = {
      trackName: analysis.trackName,
      statistics: analysis.extractedData?.statistics || {},
      findingsCount: analysis.extractedData?.keyFindings?.length || 0,
    };
  });

  // Aggregate recommendations
  overallRecommendations.push(...Array.from(new Set(allRecommendations)).slice(0, 10));

  return {
    commonPatterns,
    trackComparisons,
    overallRecommendations,
  };
}

