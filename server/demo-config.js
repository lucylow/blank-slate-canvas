// server/demo-config.js
// Centralized configuration for demo data paths and settings

const path = require('path');

/**
 * Demo data configuration
 */
const DEMO_CONFIG = {
  // Paths
  DEMO_DATA_PATH: process.env.DEMO_DATA_PATH || path.join(__dirname, '..', 'demo_data.json'),
  DEMO_DATA_DIR: process.env.DEMO_DATA_DIR || path.join(__dirname, '..', 'public', 'demo_data'),
  TRACK_SECTORS_PATH: process.env.TRACK_SECTORS_PATH || path.join(__dirname, '..', 'public', 'tracks', 'track_sectors.json'),
  SAMPLE_DATA_PATH: path.join(__dirname, 'sample_data', 'sample_laps.json'),
  
  // Server settings
  PORT: process.env.DEMO_PORT || process.env.PORT || 8081,
  DEFAULT_TRACK: process.env.DEFAULT_TRACK || 'sebring',
  
  // WebSocket settings
  DEFAULT_INTERVAL_MS: 80, // ~12.5 Hz
  MIN_INTERVAL_MS: 40,
  MAX_INTERVAL_MS: 500,
  
  // Data limits
  MAX_TELEMETRY_RESPONSE: 1000, // Max points in REST response
  MAX_POINTS_CACHE: 500, // Max points to keep in frontend cache
  
  // File patterns
  TRACK_DEMO_FILE_PATTERN: /^(.+)_demo\.json$/,
  
  // Validation
  MIN_TELEMETRY_POINTS: 10, // Minimum points to consider data valid
};

/**
 * Get normalized track ID from various formats
 */
function normalizeTrackId(trackId) {
  if (!trackId) return null;
  return trackId.toLowerCase().replace(/\s+/g, '_').trim();
}

/**
 * Get demo file path for a track
 */
function getTrackDemoPath(trackId) {
  const normalized = normalizeTrackId(trackId);
  if (!normalized) return null;
  return path.join(DEMO_CONFIG.DEMO_DATA_DIR, `${normalized}_demo.json`);
}

/**
 * Validate demo data structure
 */
function validateDemoData(data) {
  if (!data) {
    return { valid: false, error: 'Data is null or undefined' };
  }
  
  // Check if it's an array (legacy format)
  if (Array.isArray(data)) {
    if (data.length < DEMO_CONFIG.MIN_TELEMETRY_POINTS) {
      return { valid: false, error: `Array has too few points: ${data.length}` };
    }
    return { valid: true, format: 'array' };
  }
  
  // Check if it's an object with expected structure
  if (typeof data === 'object') {
    // Track demo format
    if (data.track_id || data.track_name) {
      if (!data.races || !Array.isArray(data.races)) {
        return { valid: false, error: 'Track demo missing races array' };
      }
      return { valid: true, format: 'track_demo' };
    }
    
    // Legacy object format with points/telemetry
    if (data.points && Array.isArray(data.points)) {
      if (data.points.length < DEMO_CONFIG.MIN_TELEMETRY_POINTS) {
        return { valid: false, error: `Points array has too few points: ${data.points.length}` };
      }
      return { valid: true, format: 'points_object' };
    }
    
    if (data.telemetry && Array.isArray(data.telemetry)) {
      if (data.telemetry.length < DEMO_CONFIG.MIN_TELEMETRY_POINTS) {
        return { valid: false, error: `Telemetry array has too few points: ${data.telemetry.length}` };
      }
      return { valid: true, format: 'telemetry_object' };
    }
    
    return { valid: false, error: 'Object format not recognized' };
  }
  
  return { valid: false, error: 'Data format not supported' };
}

/**
 * Extract telemetry points from various data formats
 */
function extractTelemetryPoints(data) {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data.points && Array.isArray(data.points)) {
    return data.points;
  }
  
  if (data.telemetry && Array.isArray(data.telemetry)) {
    return data.telemetry;
  }
  
  // Track demo format - extract from races
  if (data.races && Array.isArray(data.races)) {
    const points = [];
    for (const race of data.races) {
      if (race.telemetry_sample && Array.isArray(race.telemetry_sample)) {
        points.push(...race.telemetry_sample);
      }
    }
    return points;
  }
  
  return [];
}

module.exports = {
  DEMO_CONFIG,
  normalizeTrackId,
  getTrackDemoPath,
  validateDemoData,
  extractTelemetryPoints,
};


