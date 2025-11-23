# Track Analysis Integration Summary

## Overview
This document summarizes the integration of track analysis data from all 7 GR Cup tracks across the entire application.

## 7 Tracks Covered
1. **Barber Motorsports Park** (`barber`) - `barber_analysis_report.txt`
2. **Circuit of the Americas** (`cota`) - `cota_analysis_report.txt`
3. **Indianapolis Motor Speedway** (`indianapolis`) - `INDIANAPOLIS_COMPREHENSIVE_ANALYSIS_REPORT.txt`
4. **Road America** (`road_america`) - `ROAD_AMERICA_COMPREHENSIVE_ANALYSIS_REPORT.txt` (fallback: `reports/road_america_race_analysis.md`)
5. **Sebring International** (`sebring`) - `SEBRING_COMPREHENSIVE_ANALYSIS_REPORT.txt`
6. **Sonoma Raceway** (`sonoma`) - `SONOMA_COMPREHENSIVE_ANALYSIS_REPORT.txt`
7. **Virginia International Raceway** (`virginia`/`vir`) - `vir_data_analysis_report.txt`

## Files Created/Modified

### Backend API Routes
1. **`app/routes/track_analysis.py`** (NEW)
   - Serves track analysis text files from `docs/reports/ai_summary_reports/`
   - Endpoints:
     - `GET /api/reports/analysis/{track_id}` - Get specific track analysis
     - `GET /api/reports/analysis` - List all available track analyses
     - `GET /api/reports/analysis/bulk` - Get all analyses in a single response
   - Handles fallback to markdown files in `reports/` directory
   - Integrated into `app/main.py`

### Frontend Utilities
2. **`src/utils/trackAnalysisLoader.ts`** (NEW)
   - Centralized utility for loading and parsing track analysis files
   - Functions:
     - `loadTrackAnalysisFile(trackId)` - Load single track analysis
     - `loadAllTrackAnalyses()` - Load all 7 track analyses
     - `parseAnalysisContent(content)` - Extract structured data (executive summary, key findings, recommendations, statistics)
     - `getTrackAnalysis(trackId, analyses)` - Get specific track from loaded analyses
     - `extractCrossTrackInsights(analyses)` - Extract patterns across tracks

3. **`src/hooks/useTrackAnalysis.ts`** (NEW)
   - React hook for using track analysis data
   - Returns: `{ analyses, trackAnalysis, loading, error }`
   - Can filter by specific track ID

### Frontend Pages Updated
4. **`src/pages/AISummaryReports.tsx`** (MODIFIED)
   - Updated to load track analysis files from new API endpoint
   - Falls back to original AI summaries endpoint if needed
   - Displays track analysis text files with proper formatting

5. **`src/utils/pdfGenerator.ts`** (READY FOR INTEGRATION)
   - Already includes all 7 tracks in `generateAllTracksAISummaryPDF()`
   - Can be enhanced to use track analysis API endpoint for richer data

## Integration Points

### Current Integration
- ✅ Backend API routes created and registered
- ✅ Frontend utilities created for loading track analysis data
- ✅ AI Summary Reports page updated to use track analysis files
- ✅ React hook created for easy access to track analysis data

### Recommended Integration Points
The track analysis data can now be integrated into:

1. **Dashboard Page** (`src/pages/Dashboard.tsx`)
   - Display track-specific insights based on selected track
   - Show key findings from analysis files

2. **Analytics Page** (`src/pages/Analytics.tsx`)
   - Include analysis insights in track-specific analytics
   - Display recommendations from analysis files

3. **Tracks Page** (`src/pages/Tracks.tsx`)
   - Show analysis summary for each track
   - Link to full analysis reports

4. **Post-Event Analysis Page** (`src/pages/PostEventAnalysis.tsx`)
   - Display comprehensive analysis from text files
   - Compare insights across tracks

5. **PitWall Dashboard** (`src/pages/PitWallDashboard.tsx`)
   - Include track-specific strategic recommendations
   - Show historical analysis insights

## Usage Example

```typescript
import { useTrackAnalysis } from '@/hooks/useTrackAnalysis';
import { loadAllTrackAnalyses } from '@/utils/trackAnalysisLoader';

// In a component
const { trackAnalysis, loading, error } = useTrackAnalysis('barber');

// Or load all analyses
const allAnalyses = await loadAllTrackAnalyses();
```

## API Endpoints

### Get Track Analysis
```bash
GET /api/reports/analysis/{track_id}
# Returns: Plain text content of analysis file
```

### List All Analyses
```bash
GET /api/reports/analysis
# Returns: JSON with metadata about all available analyses
```

### Get All Analyses (Bulk)
```bash
GET /api/reports/analysis/bulk
# Returns: JSON with all analysis contents
```

## File Locations

### Analysis Files
- Primary: `docs/reports/ai_summary_reports/*.txt`
- Fallback: `reports/*_race_analysis.md`

### Code Files
- Backend: `app/routes/track_analysis.py`
- Frontend Utils: `src/utils/trackAnalysisLoader.ts`
- Frontend Hook: `src/hooks/useTrackAnalysis.ts`

## Next Steps

1. **Enhance PDF Generator** - Update `src/utils/pdfGenerator.ts` to use track analysis API
2. **Integrate into Dashboard** - Add track analysis insights to dashboard widgets
3. **Add Track Selector Integration** - Show analysis when track is selected
4. **Create Analysis Display Component** - Reusable component for displaying analysis content
5. **Add Search/Filter** - Allow users to search across all track analyses

## Notes

- Road America analysis file may need to be created or converted from markdown to text format
- The backend automatically handles missing files gracefully
- All endpoints include proper error handling and fallback mechanisms
- Track analysis data is now accessible throughout the entire application

