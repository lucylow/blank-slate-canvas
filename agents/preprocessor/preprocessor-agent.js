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

  // Register with orchestrator
  async register() {
    try {
      const response = await fetch(`${this.orchestratorUrl}/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.agentId,
          types: ['preprocessor'],
          tracks: ['*'], // Support all tracks
          capacity: 10
        })
      });
      const result = await response.json();
      console.log(`[Preprocessor] Registered: ${result.success ? 'OK' : 'FAILED'}`);
      return result.success;
    } catch (err) {
      console.error('[Preprocessor] Registration failed:', err);
      return false;
    }
  }

  // Send heartbeat
  async heartbeat() {
    try {
      await fetch(`${this.orchestratorUrl}/agents/heartbeat/${this.agentId}`, {
        method: 'POST'
      });
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

  // Compute derived features
  computeDerivedFeatures(point) {
    const speed_ms = point.speed_kmh / 3.6;
    const lateral_g = point.accy_can;
    const long_g = point.accx_can;
    const slip_estimate = Math.abs(lateral_g) > 0.5 ? Math.abs(lateral_g) - 0.5 : 0;
    const brake_energy_inst = point.brake_pct * speed_ms;
    const driver_input_rate = Math.abs(point.steering_angle) + point.throttle_pct + point.brake_pct;
    
    return {
      ...point,
      lateral_g,
      long_g,
      slip_estimate,
      brake_energy_inst,
      driver_input_rate
    };
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

  // Aggregate sector data
  aggregateSectorData(track, chassis, points) {
    if (!this.trackSectors || !this.trackSectors[track]) {
      return null;
    }

    const sectors = this.trackSectors[track].sectors;
    const sectorData = {};
    
    for (const sector of sectors) {
      const sectorPoints = points.filter(p => {
        const s = this.getSector(track, p.lapdist_m);
        return s === sector.name;
      });

      if (sectorPoints.length === 0) continue;

      const speeds = sectorPoints.map(p => p.speed_kmh).filter(v => v > 0);
      const latGs = sectorPoints.map(p => p.lateral_g).filter(v => v !== 0);
      const brakeEnergies = sectorPoints.map(p => p.brake_energy_inst).filter(v => v > 0);
      
      const stress = sectorPoints.reduce((sum, p) => {
        return sum + (p.accx_can * p.accx_can + p.accy_can * p.accy_can);
      }, 0);

      sectorData[sector.name] = {
        avg_speed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        max_lat_g: latGs.length > 0 ? Math.max(...latGs.map(Math.abs)) : 0,
        tire_stress: stress,
        brake_energy: brakeEnergies.length > 0 ? brakeEnergies.reduce((a, b) => a + b, 0) : 0,
        sample_count: sectorPoints.length
      };
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

    // Canonicalize and compute features
    const canonicalized = points.map(p => {
      const canon = this.canonicalize(p);
      return this.computeDerivedFeatures(canon);
    });

    // Sectorize
    const sectorized = canonicalized.map(p => ({
      ...p,
      sector: this.getSector(p.track, p.lapdist_m)
    }));

    // Aggregate by sector
    const sectorAggregates = this.aggregateSectorData(track, chassis, sectorized);

    // Update ring buffer
    const bufferKey = `${track}:${chassis}`;
    const existing = this.ringBuffer.get(bufferKey) || [];
    const updated = [...existing, ...sectorized].slice(-this.maxBufferSize);
    this.ringBuffer.set(bufferKey, updated);

    // Create aggregate window
    const aggregateWindow = {
      window_id: uuidv4(),
      track,
      chassis,
      timestamp: new Date().toISOString(),
      point_count: sectorized.length,
      sectors: sectorAggregates,
      recent_points: sectorized.slice(-100), // Keep last 100 for evidence
      lap_range: {
        min: Math.min(...sectorized.map(p => p.lap)),
        max: Math.max(...sectorized.map(p => p.lap))
      }
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

