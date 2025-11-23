// agents/utils/model-registry.js
// Model registry for per-track predictor models

const fs = require('fs').promises;
const path = require('path');

class ModelRegistry {
  constructor(modelsDir = '/models') {
    this.modelsDir = modelsDir;
    this.models = new Map(); // track -> { path, loaded, model }
    this.supportedTracks = [
      'barber', 'cota', 'indianapolis', 'road_america', 
      'sebring', 'sonoma', 'vir', 'virginia'
    ];
  }

  // Get model path for track
  getModelPath(track) {
    const normalizedTrack = this.normalizeTrack(track);
    return path.join(this.modelsDir, `model_${normalizedTrack}.pkl`);
  }

  // Normalize track name
  normalizeTrack(track) {
    const trackMap = {
      'virginia': 'vir',
      'road-america': 'road_america',
      'road america': 'road_america'
    };
    return trackMap[track.toLowerCase()] || track.toLowerCase();
  }

  // Check if model exists for track
  async hasModel(track) {
    const modelPath = this.getModelPath(track);
    try {
      await fs.access(modelPath);
      return true;
    } catch {
      return false;
    }
  }

  // Get list of available models
  async listModels() {
    try {
      const files = await fs.readdir(this.modelsDir);
      return files
        .filter(f => f.startsWith('model_') && f.endsWith('.pkl'))
        .map(f => {
          const track = f.replace('model_', '').replace('.pkl', '');
          return { track, path: path.join(this.modelsDir, f) };
        });
    } catch {
      return [];
    }
  }

  // Get supported tracks for an agent
  getSupportedTracks(agentTracks) {
    if (agentTracks.includes('*')) {
      return this.supportedTracks;
    }
    return agentTracks.map(t => this.normalizeTrack(t));
  }

  // Check track affinity (for orchestrator routing)
  hasTrackAffinity(agentTracks, requestedTrack) {
    const normalized = this.normalizeTrack(requestedTrack);
    if (agentTracks.includes('*')) return true;
    return agentTracks.some(t => this.normalizeTrack(t) === normalized);
  }
}

module.exports = { ModelRegistry };


