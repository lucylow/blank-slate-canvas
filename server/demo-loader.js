// server/demo-loader.js
// Centralized demo data loading with validation and caching

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { 
  DEMO_CONFIG, 
  normalizeTrackId, 
  getTrackDemoPath, 
  validateDemoData, 
  extractTelemetryPoints 
} = require('./demo-config');

/**
 * Check if a file is gzip compressed by reading the magic bytes
 */
function isGzipFile(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(2);
    fs.readSync(fd, buffer, 0, 2, 0);
    fs.closeSync(fd);
    // Gzip magic bytes: 0x1f 0x8b
    return buffer[0] === 0x1f && buffer[1] === 0x8b;
  } catch (error) {
    return false;
  }
}

/**
 * Load and validate a JSON file (handles both plain JSON and gzip-compressed JSON)
 */
function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  
  try {
    let content;
    
    // Check if file is gzip compressed
    if (isGzipFile(filePath)) {
      const compressed = fs.readFileSync(filePath);
      content = zlib.gunzipSync(compressed).toString('utf8');
    } else {
      content = fs.readFileSync(filePath, 'utf8');
    }
    
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to parse JSON: ${error.message}` };
  }
}

/**
 * Load demo data from a single file
 */
function loadDemoDataFile(filePath) {
  const result = loadJsonFile(filePath);
  if (!result.success) {
    return { success: false, error: result.error, telemetry: [] };
  }
  
  const validation = validateDemoData(result.data);
  if (!validation.valid) {
    return { 
      success: false, 
      error: `Validation failed: ${validation.error}`, 
      telemetry: [] 
    };
  }
  
  const telemetry = extractTelemetryPoints(result.data);
  return {
    success: true,
    telemetry,
    format: validation.format,
    source: filePath,
    count: telemetry.length
  };
}

/**
 * Load all track-specific demo files
 */
function loadTrackDemoFiles() {
  const trackData = {};
  const errors = [];
  
  if (!fs.existsSync(DEMO_CONFIG.DEMO_DATA_DIR)) {
    return { trackData, errors: [`Demo data directory not found: ${DEMO_CONFIG.DEMO_DATA_DIR}`] };
  }
  
  try {
    const files = fs.readdirSync(DEMO_CONFIG.DEMO_DATA_DIR);
    const demoFiles = files.filter(f => DEMO_CONFIG.TRACK_DEMO_FILE_PATTERN.test(f));
    
    for (const file of demoFiles) {
      const match = file.match(DEMO_CONFIG.TRACK_DEMO_FILE_PATTERN);
      if (!match) continue;
      
      const trackId = normalizeTrackId(match[1]);
      const filePath = path.join(DEMO_CONFIG.DEMO_DATA_DIR, file);
      
      const result = loadJsonFile(filePath);
      if (result.success) {
        const validation = validateDemoData(result.data);
        if (validation.valid) {
          trackData[trackId] = result.data;
        } else {
          errors.push(`Invalid format for ${file}: ${validation.error}`);
        }
      } else {
        errors.push(`Failed to load ${file}: ${result.error}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to read demo data directory: ${error.message}`);
  }
  
  return { trackData, errors };
}

/**
 * Load demo data from all available sources
 */
function loadAllDemoData() {
  const results = {
    telemetry: [],
    trackData: {},
    sources: [],
    errors: [],
    warnings: []
  };
  
  // Try primary demo_data.json file
  if (fs.existsSync(DEMO_CONFIG.DEMO_DATA_PATH)) {
    const result = loadDemoDataFile(DEMO_CONFIG.DEMO_DATA_PATH);
    if (result.success) {
      results.telemetry = result.telemetry;
      results.sources.push({
        type: 'primary',
        path: DEMO_CONFIG.DEMO_DATA_PATH,
        count: result.count,
        format: result.format
      });
    } else {
      results.errors.push(`Primary file: ${result.error}`);
    }
  } else {
    results.warnings.push(`Primary demo file not found: ${DEMO_CONFIG.DEMO_DATA_PATH}`);
  }
  
  // Load track-specific demo files
  const trackResult = loadTrackDemoFiles();
  results.trackData = trackResult.trackData;
  results.errors.push(...trackResult.errors);
  
  // If we have track data but no primary telemetry, use default track
  if (results.telemetry.length === 0 && Object.keys(results.trackData).length > 0) {
    const defaultTrack = normalizeTrackId(DEMO_CONFIG.DEFAULT_TRACK);
    if (results.trackData[defaultTrack]) {
      const trackTelemetry = extractTelemetryPoints(results.trackData[defaultTrack]);
      if (trackTelemetry.length > 0) {
        results.telemetry = trackTelemetry;
        results.sources.push({
          type: 'default_track',
          track: defaultTrack,
          count: trackTelemetry.length
        });
      }
    }
  }
  
  // Fallback to sample data
  if (results.telemetry.length === 0 && fs.existsSync(DEMO_CONFIG.SAMPLE_DATA_PATH)) {
    const result = loadDemoDataFile(DEMO_CONFIG.SAMPLE_DATA_PATH);
    if (result.success) {
      results.telemetry = result.telemetry;
      results.sources.push({
        type: 'fallback',
        path: DEMO_CONFIG.SAMPLE_DATA_PATH,
        count: result.count
      });
    } else {
      results.errors.push(`Fallback file: ${result.error}`);
    }
  }
  
  // Final validation
  if (results.telemetry.length === 0) {
    results.errors.push('No valid telemetry data found from any source');
  } else if (results.telemetry.length < DEMO_CONFIG.MIN_TELEMETRY_POINTS) {
    results.warnings.push(`Low telemetry count: ${results.telemetry.length} (minimum recommended: ${DEMO_CONFIG.MIN_TELEMETRY_POINTS})`);
  }
  
  return results;
}

/**
 * Get summary of loaded demo data
 */
function getDemoDataSummary(results) {
  return {
    telemetry_count: results.telemetry.length,
    tracks_available: Object.keys(results.trackData).length,
    track_ids: Object.keys(results.trackData).sort(),
    sources: results.sources,
    has_errors: results.errors.length > 0,
    has_warnings: results.warnings.length > 0,
    errors: results.errors,
    warnings: results.warnings
  };
}

module.exports = {
  loadDemoDataFile,
  loadTrackDemoFiles,
  loadAllDemoData,
  getDemoDataSummary,
  loadJsonFile,
};

