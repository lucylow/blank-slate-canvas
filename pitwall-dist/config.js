// dist/config.js
const path = require('path');
module.exports = {
  HTTP_PORT: process.env.PORT || 8081,
  WS_PATH: process.env.WS_PATH || '/ws/realtime',
  DEMO_DATA_PATH: process.env.DEMO_DATA_PATH || '/mnt/data/demo_data.json',
  TRACK_SECTORS_PATH: process.env.TRACK_SECTORS_PATH || path.join(__dirname, '..', 'public', 'tracks', 'track_sectors.json'),
  UDP_PORT: parseInt(process.env.UDP_PORT || '20777', 10),
  BATCH_MS: parseInt(process.env.BATCH_MS || '600', 10),
  AGGREGATOR_WORKER_COUNT: parseInt(process.env.AGG_WORKERS || '1', 10),
  RINGBUFFER_SIZE: parseInt(process.env.RINGBUFFER_SIZE || '20000', 10),
  MAX_WS_BUFFER: parseInt(process.env.MAX_WS_BUFFER || '2000000', 10)
};
