# Demo Data Improvements Summary

This document summarizes the improvements made to `demo_data.json` usage throughout the application.

## Overview

The demo data system has been refactored to provide:
- **Centralized configuration** - Single source of truth for paths and settings
- **Better error handling** - Comprehensive validation and helpful error messages
- **Improved performance** - Caching and optimized data loading
- **Type safety** - Enhanced TypeScript types and validation
- **Unified loading logic** - Consistent data loading across all components

## Changes Made

### 1. Centralized Configuration (`server/demo-config.js`)

Created a centralized configuration module that provides:
- All demo data paths in one place
- Normalization utilities for track IDs
- Data validation functions
- Telemetry extraction from various formats

**Key Features:**
- Environment variable support for all paths
- Configurable limits (response size, cache size, intervals)
- Track ID normalization (handles various formats)
- Data format validation (array, object, track demo format)

### 2. Unified Data Loader (`server/demo-loader.js`)

New centralized loader that:
- Loads data from multiple sources with fallback chain
- Validates data structure before use
- Provides detailed loading summaries
- Handles errors gracefully with helpful messages

**Loading Priority:**
1. Primary: `demo_data.json` at project root (or `DEMO_DATA_PATH` env var)
2. Track-specific files in `public/demo_data/*_demo.json`
3. Default track from track files
4. Fallback: `server/sample_data/sample_laps.json`

### 3. Enhanced Demo Server (`server/demo-server.js`)

Updated to use centralized utilities:
- Uses `demo-config.js` for all configuration
- Uses `demo-loader.js` for data loading
- Better error messages and logging
- Improved WebSocket handling with configurable intervals
- Enhanced REST endpoints with validation

**New Features:**
- Detailed loading summary on startup
- Track switching via API (`POST /api/set_track/:trackId`)
- Better error responses with available options
- Configurable WebSocket replay speed

### 4. Improved Frontend Utilities (`src/lib/demoData.ts`)

Enhanced with:
- Request timeouts to prevent hanging
- Caching for tracks index (5-minute TTL)
- Better error messages
- Input validation
- Track ID normalization
- Data structure validation

**New Functions:**
- `normalizeTrackId()` - Standardize track ID format
- `validateTrackDemoData()` - Type guard for demo data
- `clearTracksIndexCache()` - Manual cache invalidation

### 5. Enhanced Demo API Client (`src/api/demo.ts`)

Improved with:
- Request timeouts
- Retry logic with exponential backoff
- Better error handling
- Input validation
- Response validation

**New Features:**
- Automatic retry on network failures (3 attempts)
- Shorter timeout for health checks (5s vs 10s)
- Better error messages with context

### 6. Updated Legacy Server (`server/demo-from-file.js`)

Updated to use new utilities for consistency:
- Uses centralized config and loader
- Consistent error handling
- Better logging

## Configuration

### Environment Variables

All paths can be configured via environment variables:

```bash
# Demo data paths
DEMO_DATA_PATH=/path/to/demo_data.json
DEMO_DATA_DIR=/path/to/demo_data/directory
TRACK_SECTORS_PATH=/path/to/track_sectors.json

# Server settings
DEMO_PORT=8081
DEFAULT_TRACK=sebring

# Frontend (via .env)
VITE_DEMO_API_URL=http://localhost:8081
```

### Default Paths

- **Primary demo file**: `demo_data.json` (project root)
- **Track demo files**: `public/demo_data/*_demo.json`
- **Tracks index**: `public/demo_data/tracks_index.json`
- **Sample data**: `server/sample_data/sample_laps.json`
- **Track sectors**: `public/tracks/track_sectors.json`

## Data Format Support

The system now supports multiple data formats:

1. **Array format** - Direct array of telemetry points
2. **Points object** - `{ points: [...] }`
3. **Telemetry object** - `{ telemetry: [...] }`
4. **Track demo format** - `{ track_id, track_name, races: [...] }`

All formats are automatically detected and normalized.

## Error Handling

### Backend
- Validation errors with specific messages
- File not found errors with suggested paths
- Invalid format errors with expected structure
- Loading summaries with warnings and errors

### Frontend
- Request timeouts (10s default, 5s for health checks)
- Retry logic for transient failures
- Clear error messages with context
- Fallback to known track IDs if index fails

## Performance Improvements

1. **Caching**
   - Tracks index cached for 5 minutes
   - Frontend cache for frequently accessed data

2. **Optimized Loading**
   - Single pass through data sources
   - Early exit on successful load
   - Lazy loading where possible

3. **Response Limits**
   - Max 1000 points in REST responses
   - Max 500 points in frontend cache
   - Configurable via `DEMO_CONFIG`

## Type Safety

Enhanced TypeScript types:
- Strict type checking for demo data structures
- Type guards for runtime validation
- Better IntelliSense support
- Compile-time error detection

## Migration Guide

### For Developers

1. **Use centralized config:**
   ```javascript
   const { DEMO_CONFIG, normalizeTrackId } = require('./demo-config');
   ```

2. **Use unified loader:**
   ```javascript
   const { loadAllDemoData } = require('./demo-loader');
   const results = loadAllDemoData();
   ```

3. **Normalize track IDs:**
   ```javascript
   const trackId = normalizeTrackId(userInput);
   ```

### For Frontend

1. **Use enhanced utilities:**
   ```typescript
   import { loadTrackDemo, normalizeTrackId } from '@/lib/demoData';
   ```

2. **Handle errors properly:**
   ```typescript
   try {
     const data = await loadTrackDemo(trackId);
   } catch (error) {
     // Error includes helpful context
   }
   ```

## Testing

To test the improvements:

1. **Start demo server:**
   ```bash
   npm run demo-server
   ```

2. **Check loading summary** - Should show detailed information about loaded data

3. **Test endpoints:**
   - `GET /api/demo_data` - Should return metadata and limited telemetry
   - `GET /api/health` - Should show demo data status
   - `GET /api/tracks` - Should list available tracks
   - `POST /api/set_track/:trackId` - Should switch active track

4. **Test frontend:**
   - Load tracks index (should be cached)
   - Load track demo data
   - Check error handling with invalid track IDs

## Future Improvements

Potential enhancements:
- [ ] Add data compression for large datasets
- [ ] Implement incremental loading for very large files
- [ ] Add data versioning/validation schema
- [ ] Create admin UI for managing demo data
- [ ] Add metrics/monitoring for demo data usage
- [ ] Implement data streaming for large responses

## Files Changed

### New Files
- `server/demo-config.js` - Centralized configuration
- `server/demo-loader.js` - Unified data loader
- `DEMO_DATA_IMPROVEMENTS.md` - This document

### Modified Files
- `server/demo-server.js` - Uses new utilities
- `server/demo-from-file.js` - Updated for consistency
- `src/lib/demoData.ts` - Enhanced utilities
- `src/api/demo.ts` - Improved API client

## Breaking Changes

None - all changes are backward compatible. Existing code continues to work, but benefits from improved error handling and performance.

## Support

For issues or questions:
1. Check the loading summary in server logs
2. Verify demo data files exist and are valid JSON
3. Check environment variables are set correctly
4. Review error messages for specific guidance

