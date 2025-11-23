// server/telemetry-simulator.js
// Enhanced telemetry simulator that converts TRD format to frontend format
// Supports multiple vehicles, realistic timing, and proper data aggregation

/**
 * Converts TRD telemetry samples (key-value pairs) into aggregated telemetry points
 */
class TelemetrySimulator {
  constructor() {
    this.processedTelemetry = [];
    this.vehicleStreams = new Map(); // Map of vehicle_id -> telemetry stream
    this.currentTrack = null;
    this.currentRace = null;
  }

  /**
   * Process TRD format telemetry and convert to frontend format
   * @param {Array} trdSamples - Array of TRD telemetry samples
   * @returns {Array} Processed telemetry points grouped by vehicle and timestamp
   */
  processTRDTelemetry(trdSamples) {
    if (!trdSamples || trdSamples.length === 0) {
      return [];
    }

    // Group samples by vehicle_id and timestamp
    const grouped = new Map();

    for (const sample of trdSamples) {
      const vehicleId = sample.vehicle_id || sample.original_vehicle_id;
      const timestamp = sample.timestamp;
      const key = `${vehicleId}_${timestamp}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          vehicle_id: vehicleId,
          vehicle_number: sample.vehicle_number,
          timestamp: timestamp,
          lap: sample.lap || 1,
          meta_event: sample.meta_event,
          meta_session: sample.meta_session,
          data: {}
        });
      }

      // Aggregate telemetry values by name
      const point = grouped.get(key);
      point.data[sample.telemetry_name] = sample.telemetry_value;
    }

    // Convert grouped data to frontend format
    const processed = [];
    for (const point of grouped.values()) {
      const converted = this.convertToFrontendFormat(point);
      if (converted) {
        processed.push(converted);
      }
    }

    // Sort by timestamp
    processed.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeA - timeB;
    });

    return processed;
  }

  /**
   * Convert TRD point to frontend TelemetryPoint format
   */
  convertToFrontendFormat(point) {
    const data = point.data;
    
    // Field mapping from TRD names to frontend format
    const speed = this.getField(data, ['speed_kmh', 'Speed', 'speed'], 0);
    const throttle = this.getField(data, ['ath', 'throttle', 'Throttle'], 0);
    const brake = this.getField(data, ['pbrake_f', 'pbrake_r', 'pbrake', 'brake'], 0);
    const accx = this.getField(data, ['accx_can', 'accx', 'AccX'], 0);
    const accy = this.getField(data, ['accy_can', 'accy', 'AccY'], 0);
    const gear = this.getField(data, ['gear', 'Gear'], 0);
    const rpm = this.getField(data, ['rpm', 'RPM', 'engine_rpm'], 0);
    
    // Tire pressures (convert from various formats)
    const tire_pressure_fl = this.getField(data, ['tire_pressure_fl', 'Tire_Pressure_FL'], 0);
    const tire_pressure_fr = this.getField(data, ['tire_pressure_fr', 'Tire_Pressure_FR'], 0);
    const tire_pressure_rl = this.getField(data, ['tire_pressure_rl', 'Tire_Pressure_RL'], 0);
    const tire_pressure_rr = this.getField(data, ['tire_pressure_rr', 'Tire_Pressure_RR'], 0);
    
    // Tire temperatures
    const tire_temp_fl = this.getField(data, ['tire_temp_fl', 'Tire_Temp_FL'], 0);
    const tire_temp_fr = this.getField(data, ['tire_temp_fr', 'Tire_Temp_FR'], 0);
    const tire_temp_rl = this.getField(data, ['tire_temp_rl', 'Tire_Temp_RL'], 0);
    const tire_temp_rr = this.getField(data, ['tire_temp_rr', 'Tire_Temp_RR'], 0);
    
    // Brake temperature (average of front/rear if available)
    const brake_temp = this.getField(data, ['brake_temp', 'Brake_Temp'], 0);

    // Calculate G-forces from accelerations (if not directly available)
    const g_force_lat = accy || 0;
    const g_force_long = accx || 0;

    // Calculate sector (rough estimate: 1-3 based on lap progress)
    // This is a simplified calculation - in real data this would come from track position
    const sector = this.calculateSector(point.lap, data);

    // Calculate lap distance (if available, otherwise estimate)
    const lapDistance = this.getField(data, ['lapdist_m', 'lap_distance', 'LapDistance'], 0);

    return {
      lap: point.lap || 1,
      sector: sector,
      speed: Math.max(0, speed),
      throttle: Math.min(100, Math.max(0, throttle)),
      brake: Math.min(100, Math.max(0, brake)),
      g_force_lat: g_force_lat,
      g_force_long: g_force_long,
      gear: Math.round(gear) || 0,
      rpm: Math.max(0, rpm),
      tire_pressure_fl: tire_pressure_fl || 0,
      tire_pressure_fr: tire_pressure_fr || 0,
      tire_pressure_rl: tire_pressure_rl || 0,
      tire_pressure_rr: tire_pressure_rr || 0,
      tire_temp_fl: tire_temp_fl || 0,
      tire_temp_fr: tire_temp_fr || 0,
      tire_temp_rl: tire_temp_rl || 0,
      tire_temp_rr: tire_temp_rr || 0,
      brake_temp: brake_temp || 0,
      lapDistance: lapDistance,
      timestamp: new Date(point.timestamp).getTime(),
      vehicle_id: point.vehicle_id,
      vehicle_number: point.vehicle_number,
      // Keep original data for reference
      _raw: point.data
    };
  }

  /**
   * Get field value from data object, trying multiple possible keys
   */
  getField(data, keys, defaultValue = 0) {
    for (const key of keys) {
      if (data[key] !== undefined && data[key] !== null) {
        const value = Number(data[key]);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    return defaultValue;
  }

  /**
   * Calculate sector (1-3) based on lap and available data
   */
  calculateSector(lap, data) {
    // If we have lap distance, estimate sector
    const lapDist = this.getField(data, ['lapdist_m', 'lap_distance'], 0);
    if (lapDist > 0) {
      // Rough estimate: assume track is divided into 3 equal sectors
      // This is simplified - real tracks have varying sector lengths
      const sectorLength = 2000; // Assume ~2km per sector (6km track)
      return Math.min(3, Math.max(1, Math.ceil(lapDist / sectorLength)));
    }
    // Default to sector 1 if we can't determine
    return 1;
  }

  /**
   * Load and process track demo data
   */
  loadTrackData(trackData) {
    this.vehicleStreams.clear();
    this.processedTelemetry = [];

    if (!trackData || !trackData.races || trackData.races.length === 0) {
      console.warn('No race data available');
      return;
    }

    // Use first race by default
    const race = trackData.races[0];
    this.currentTrack = trackData.track_id;
    this.currentRace = race.race_number;

    if (!race.telemetry_sample || race.telemetry_sample.length === 0) {
      console.warn('No telemetry samples in race data');
      return;
    }

    // Process TRD telemetry
    const processed = this.processTRDTelemetry(race.telemetry_sample);
    
    // Group by vehicle
    for (const point of processed) {
      const vehicleId = point.vehicle_id;
      if (!this.vehicleStreams.has(vehicleId)) {
        this.vehicleStreams.set(vehicleId, []);
      }
      this.vehicleStreams.get(vehicleId).push(point);
    }

    // Store all processed telemetry
    this.processedTelemetry = processed;

    console.log(`✓ Processed ${processed.length} telemetry points`);
    console.log(`✓ Found ${this.vehicleStreams.size} vehicles:`, 
      Array.from(this.vehicleStreams.keys()));

    return processed;
  }

  /**
   * Get telemetry stream for a specific vehicle
   */
  getVehicleStream(vehicleId) {
    return this.vehicleStreams.get(vehicleId) || [];
  }

  /**
   * Get all vehicles
   */
  getVehicles() {
    return Array.from(this.vehicleStreams.keys());
  }

  /**
   * Get next telemetry point for a vehicle (for streaming)
   */
  getNextPoint(vehicleId, index) {
    const stream = this.getVehicleStream(vehicleId);
    if (stream.length === 0) return null;
    return stream[index % stream.length];
  }

  /**
   * Get all telemetry points (for batch operations)
   */
  getAllPoints() {
    return this.processedTelemetry;
  }
}

module.exports = TelemetrySimulator;


