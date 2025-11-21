// server/realtime/src/config.ts

import path from "path";

export const HTTP_PORT = Number(process.env.PORT || 8081);
export const WS_PATH = process.env.WS_PATH || "/ws/realtime";
export const DEMO_DATA_PATH = process.env.DEMO_DATA_PATH || path.join(__dirname, "../../public/tracks/demo_7tracks.json");
export const TRACK_SECTORS_PATH = process.env.TRACK_SECTORS_PATH || path.join(__dirname, "../../public/tracks/track_sectors.json");
export const UDP_PORT = Number(process.env.UDP_PORT || 20777);
export const BATCH_MS = Number(process.env.BATCH_MS || 600);
export const AGGREGATOR_WORKER_COUNT = Number(process.env.AGG_WORKERS || 1);
export const RINGBUFFER_SIZE = Number(process.env.RINGBUFFER_SIZE || 20000);
export const MAX_WS_BUFFER = Number(process.env.MAX_WS_BUFFER || 2e6);

