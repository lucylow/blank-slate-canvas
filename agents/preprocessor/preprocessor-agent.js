// agents/preprocessor/preprocessor-agent.js
// Preprocessor Agent: Normalizes telemetry and sectorizes data

const Redis = require('ioredis');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class PreprocessorAgent {
  constructor(config = {}) {
    this.agentId = config.agentId || `preprocessor-${process.pid}`;
    this.redis = new Redis(config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.orchestratorUrl = config.orchestratorUrl || process.env.ORCHESTRATOR_URL || 'http://localhost:3000';
    this.trackSectors = null;
    this.trackConfig = null;
    this.ringBuffer = new Map(); // track+chassis -> recent points
    this.maxBufferSize = 2000;
  }

  // Load track sectors configuration
  async loadTrackSectors() {
    try {
      const sectorsPath = path.join(__dirname, '../../public/tracks/track_sectors.json');
      const data = await fs.readFile(sectorsPath, 'utf8');
      this.trackSectors = JSON.parse(data);
      console.log(`[Preprocessor] Loaded sectors for ${Object.keys(this.trackSectors).length} tracks`);
    } catch (err) {
      console.error('[Preprocessor] Failed to load track sectors:', err);
      this.trackSectors = {};
    }
  }

  // Load track-specific configuration
  async loadTrackConfig() {
    try {
      const configPath = path.join(__dirname, '../config/track-config.json');
      const data = await fs.readFile(configPath, 'utf8');
      this.trackConfig = JSON.parse(data);
      console.log(`[Preprocessor] Loaded track config for ${Object.keys(this.trackConfig).length} tracks`);
    } catch (err) {
      console.error('[Preprocessor] Failed to load track config:', err);
      this.trackConfig = {};
    }
  }

  // Normalize track name
  normalizeTrack(track) {
    const normalized = track.toLowerCase().replace(/\s+/g, '_');
    const trackMap = {
      'virginia': 'vir',
      'road-america': 'road_america',
      'road america': 'road_america'
    };
    return trackMap[normalized] || normalized;
  }

  // Get track configuration
  getTrackConfig(track) {
    const normalized = this.normalizeTrack(track);
    return this.trackConfig?.[normalized] || this.trackConfig?.['vir'] || null;
  }

  // Register with orchestrator
  async register() {
    try {
      const http = require('http');
      const url = require('url');
      const parsedUrl = url.parse(this.orchestratorUrl);
      
      return new Promise((resolve) => {
        const postData = JSON.stringify({
          agent_id: this.agentId,
          types: ['preprocessor'],
          tracks: ['*'], // Support all tracks
          capacity: 10
        });
        
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 3000,
          path: '/agents/register',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              console.log(`[Preprocessor] Registered: ${result.success ? 'OK' : 'FAILED'}`);
              resolve(result.success);
            } catch (e) {
              resolve(false);
            }
          });
        });
        
        req.on('error', () => resolve(false));
        req.write(postData);
        req.end();
      });
    } catch (err) {
      console.error('[Preprocessor] Registration failed:', err);
      return false;
    }
  }

  // Send heartbeat
  async heartbeat() {
    try {
      const http = require('http');
      const url = require('url');
      const parsedUrl = url.parse(this.orchestratorUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 3000,
        path: `/agents/heartbeat/${this.agentId}`,
        method: 'POST'
      };
      
      const req = http.request(options);
      req.on('error', () => {});
      req.end();
    } catch (err) {
      // Silent fail
    }
  }

  // Canonicalize telemetry point
  canonicalize(point) {
    return {
      meta_time: point.meta_time || point.timestamp || new Date().toISOString(),
      track: (point.track || '').toLowerCase().replace(/\s+/g, '_'),
      chassis: point.chassis || point.vehicle_id || point.original_vehicle_id || 'unknown',
      lap: Number(point.lap) || 0,
      lapdist_m: Number(point.lapdist_m || point.lapDistance || point.Laptrigger_lapdist_dls || 0) / 10, // Convert dls to m if needed
      speed_kmh: Number(point.speed_kmh || point.Speed || point.speed || 0),
      accx_can: Number(point.accx_can || point.accx || 0),
      accy_can: Number(point.accy_can || point.accy || 0),
      rpm: Number(point.nmot || point.rpm || 0),
      throttle_pct: Number(point.ath || point.throttle || 0),
      brake_pct: Number(point.pbrake_f || point.pbrake || point.brake || 0),
      yaw_rate: Number(point.yaw_rate || 0),
      gear: Number(point.gear || 0),
      steering_angle: Number(point.Steering_Angle || point.steering_angle || 0)
    };
  }

  // Compute derived features (track-agnostic base)
  computeDerivedFeatures(point) {
    const speed_ms = point.speed_kmh / 3.6;
    const lateral_g = point.accy_can;
    const long_g = point.accx_can;
    const slip_estimate = Math.abs(lateral_g) > 0.5 ? Math.abs(lateral_g) - 0.5 : 0;
    const brake_energy_inst = point.brake_pct * speed_ms;
    const driver_input_rate = Math.abs(point.steering_angle) + point.throttle_pct + point.brake_pct;
    const inst_tire_stress = point.accx_can * point.accx_can + point.accy_can * point.accy_can;
    
    return {
      ...point,
      lateral_g,
      long_g,
      slip_estimate,
      brake_energy_inst,
      driver_input_rate,
      inst_tire_stress
    };
  }

  // Compute track-specific features
  computeTrackSpecificFeatures(point, trackConfig, sectorPoints = []) {
    const track = this.normalizeTrack(point.track);
    const features = {};
    
    if (!trackConfig) return features;

    const config = trackConfig.features || {};
    const sector = point.sector;

    // Barber: corner count window (lateral G > threshold)
    if (config.corner_count_window && config.lateral_g_threshold) {
      const threshold = config.lateral_g_threshold;
      if (Math.abs(point.lateral_g) > threshold) {
        features.high_lateral_event = 1;
      }
    }

    // COTA: max speed back straight, coast time
    if (config.max_speed_back_straight && sector === 'S3') {
      features.max_speed_back_straight = point.speed_kmh;
      if (point.throttle_pct < 10 && point.brake_pct === 0) {
        features.coast_time = 1; // Flag for thermal recovery
      }
    }

    // Sebring: vibration index (high-frequency accel variance)
    if (config.vibration_index) {
      if (sectorPoints.length > 5) {
        const accelVariance = this.computeVariance(sectorPoints.map(p => 
          Math.sqrt(p.accx_can * p.accx_can + p.accy_can * p.accy_can)
        ));
        features.vibration_index = accelVariance;
      }
      // Tag concrete sectors
      if (config.concrete_sectors && sector === 'S2') {
        features.surface = 'concrete';
      }
    }

    // Sonoma: elevation delta, left/right stress asymmetry
    if (config.elevation_delta) {
      // Would need altitude data - placeholder
      features.elevation_delta = 0;
    }
    if (config.left_right_stress_asymmetry) {
      // Compare left vs right turns (simplified)
      features.stress_asymmetry = Math.abs(point.accy_can);
    }

    // Road America: per-sector time (for 4-sector variant)
    if (config.per_sector_time && trackConfig.characteristics?.sectors === 4) {
      // Would compute from timestamps - placeholder
      features.per_sector_time = 0;
    }

    // VIR: frequent lateral spikes
    if (config.frequent_lateral_spikes) {
      if (Math.abs(point.lateral_g) > 1.0) {
        features.lateral_spike = 1;
      }
    }

    return features;
  }

  // Compute variance helper
  computeVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  // Sectorize point
  getSector(track, lapdist_m) {
    if (!this.trackSectors || !this.trackSectors[track]) {
      return null;
    }
    
    const sectors = this.trackSectors[track].sectors;
    for (const sector of sectors) {
      if (lapdist_m >= sector.start_m && lapdist_m < sector.end_m) {
        return sector.name;
      }
    }
    return null;
  }

  // Aggregate sector data with track-specific features
  aggregateSectorData(track, chassis, points) {
    const normalizedTrack = this.normalizeTrack(track);
    if (!this.trackSectors || !this.trackSectors[normalizedTrack]) {
      return null;
    }

    const trackConfig = this.getTrackConfig(track);
    const sectors = this.trackSectors[normalizedTrack].sectors;
    const sectorData = {};
    
    for (const sector of sectors) {
      const sectorPoints = points.filter(p => {
        const s = this.getSector(normalizedTrack, p.lapdist_m);
        return s === sector.name;
      });

      if (sectorPoints.length === 0) continue;

      const speeds = sectorPoints.map(p => p.speed_kmh).filter(v => v > 0);
      const latGs = sectorPoints.map(p => p.lateral_g).filter(v => v !== 0);
      const brakeEnergies = sectorPoints.map(p => p.brake_energy_inst).filter(v => v > 0);
      
      const stress = sectorPoints.reduce((sum, p) => {
        return sum + (p.accx_can * p.accx_can + p.accy_can * p.accy_can);
      }, 0);

      const baseSectorData = {
        avg_speed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        max_speed: speeds.length > 0 ? Math.max(...speeds) : 0,
        max_lat_g: latGs.length > 0 ? Math.max(...latGs.map(Math.abs)) : 0,
        tire_stress: stress,
        brake_energy: brakeEnergies.length > 0 ? brakeEnergies.reduce((a, b) => a + b, 0) : 0,
        sample_count: sectorPoints.length
      };

      // Add track-specific aggregates
      if (trackConfig?.features) {
        const config = trackConfig.features;
        
        // Barber: corner count
        if (config.corner_count_window) {
          const highLatEvents = sectorPoints.filter(p => 
            Math.abs(p.lateral_g) > (config.lateral_g_threshold || 0.9)
          ).length;
          baseSectorData.corner_count = highLatEvents;
        }

        // COTA: max speed back straight
        if (config.max_speed_back_straight && sector.name === 'S3') {
          baseSectorData.max_speed_back_straight = baseSectorData.max_speed;
        }

        // Sebring: vibration index
        if (config.vibration_index) {
          const accelValues = sectorPoints.map(p => 
            Math.sqrt(p.accx_can * p.accx_can + p.accy_can * p.accy_can)
          );
          baseSectorData.vibration_index = this.computeVariance(accelValues);
        }

        // Sonoma: stress asymmetry
        if (config.left_right_stress_asymmetry) {
          const leftTurns = sectorPoints.filter(p => p.accy_can < -0.5);
          const rightTurns = sectorPoints.filter(p => p.accy_can > 0.5);
          baseSectorData.stress_asymmetry = Math.abs(
            (leftTurns.length - rightTurns.length) / sectorPoints.length
          );
        }
      }

      sectorData[sector.name] = baseSectorData;
    }

    return sectorData;
  }

  // Process telemetry window
  async processWindow(task) {
    const { payload } = task;
    const { points, track, chassis } = payload;

    if (!points || points.length === 0) {
      return { error: 'No points provided' };
    }

    const normalizedTrack = this.normalizeTrack(track);
    const trackConfig = this.getTrackConfig(track);

    // Canonicalize and compute base features
    const canonicalized = points.map(p => {
      const canon = this.canonicalize(p);
      return this.computeDerivedFeatures(canon);
    });

    // Sectorize
    const sectorized = canonicalized.map(p => ({
      ...p,
      sector: this.getSector(normalizedTrack, p.lapdist_m)
    }));

    // Add track-specific features to each point
    const enhanced = sectorized.map((p, idx) => {
      const sectorPoints = sectorized.filter(sp => sp.sector === p.sector);
      const trackFeatures = this.computeTrackSpecificFeatures(p, trackConfig, sectorPoints);
      return {
        ...p,
        ...trackFeatures
      };
    });

    // Aggregate by sector (with track-specific features)
    const sectorAggregates = this.aggregateSectorData(track, chassis, enhanced);

    // Update ring buffer
    const bufferKey = `${normalizedTrack}:${chassis}`;
    const existing = this.ringBuffer.get(bufferKey) || [];
    const updated = [...existing, ...enhanced].slice(-this.maxBufferSize);
    this.ringBuffer.set(bufferKey, updated);

    // Create aggregate window
    const aggregateWindow = {
      window_id: uuidv4(),
      track: normalizedTrack,
      chassis,
      timestamp: new Date().toISOString(),
      point_count: enhanced.length,
      sectors: sectorAggregates,
      recent_points: enhanced.slice(-100), // Keep last 100 for evidence
      lap_range: {
        min: Math.min(...enhanced.map(p => p.lap)),
        max: Math.max(...enhanced.map(p => p.lap))
      },
      track_config: trackConfig ? {
        type: trackConfig.characteristics?.type,
        pit_cost_seconds: trackConfig.characteristics?.pit_cost_seconds
      } : null
    };

    // Publish to aggregates stream
    await this.redis.xadd('aggregates.stream', '*', 
      'aggregate', JSON.stringify(aggregateWindow)
    );

    return {
      success: true,
      aggregate_window_id: aggregateWindow.window_id,
      track,
      chassis,
      sectors: sectorAggregates
    };
  }

  // Main agent loop
  async start() {
    await this.loadTrackSectors();
    await this.loadTrackConfig();
    await this.register();

    // Send heartbeat every 10s
    setInterval(() => this.heartbeat(), 10000);

    // Process tasks from inbox
    const inbox = `agent:${this.agentId}:inbox`;
    
    while (true) {
      try {
        const msg = await this.redis.blpop(inbox, 5);
        if (!msg) continue;

        const task = JSON.parse(msg[1]);
        console.log(`[Preprocessor] Processing task ${task.task_id}`);

        const startTime = Date.now();
        const result = await this.processWindow(task);
        const latency = Date.now() - startTime;

        // Send result back
        await this.redis.xadd('agent_results.stream', '*', 'result', JSON.stringify({
          task_id: task.task_id,
          agent_id: this.agentId,
          task_type: 'preprocessor',
          success: result.success || false,
          result,
          latency_ms: latency,
          completed_at: new Date().toISOString()
        }));

      } catch (err) {
        console.error('[Preprocessor] Processing error:', err);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// Start agent if run directly
if (require.main === module) {
  const agent = new PreprocessorAgent();
  agent.start().catch(err => {
    console.error('[Preprocessor] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { PreprocessorAgent };

