// server/realtime/src/s3_watcher.ts

import AWS from "aws-sdk";
import { parse } from "csv-parse";
import { RingBuffer } from "./ringbuffer";
import { TelemetryPoint } from "./types";

const s3 = new AWS.S3({ region: process.env.AWS_REGION || "us-east-1" });

export async function fetchS3CsvToBuffer(bucket: string, key: string, ring: RingBuffer<TelemetryPoint>, onParsed?: (p: TelemetryPoint) => void) {
  const stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();
  const parser = parse({ columns: true, relax: true, skip_empty_lines: true });

  stream.pipe(parser);

  parser.on("data", (row: any) => {
    const parsed: TelemetryPoint = {
      meta_time: row.meta_time || new Date().toISOString(),
      track: row.track || row.circuit || "unknown",
      chassis: row.chassis || row.vehicle || "unknown",
      lap: Number(row.lap || 0),
      lapdist_m: Number(row.lapdist_m || row.lap_distance || 0),
      speed_kmh: Number(row.speed_kmh || row.speed || 0),
      accx_can: Number(row.accx_can || row.ax || 0),
      accy_can: Number(row.accy_can || row.ay || 0),
      Steering_Angle: Number(row.Steering_Angle || row.steering_deg || 0),
      pbrake_f: Number(row.pbrake_f || 0),
      rpm: Number(row.rpm || 0),
      raw_source: `s3:${bucket}/${key}`
    };

    ring.push(parsed);
    if (onParsed) onParsed(parsed);
  });

  parser.on("end", () => console.log("Finished streaming S3 object", key));
  parser.on("error", (err) => console.error("S3 CSV parse error for", key, err));
}

export async function pollBucketPrefix(bucket: string, prefix: string, ring: RingBuffer<TelemetryPoint>, onParsed?: (p: TelemetryPoint) => void, intervalMs = 60000) {
  async function poll() {
    try {
      const list = await s3.listObjectsV2({ Bucket: bucket, Prefix: prefix }).promise();
      for (const obj of list.Contents || []) {
        if (obj.Size === 0) continue;
        await fetchS3CsvToBuffer(bucket, obj.Key!, ring, onParsed);
      }
    } catch (err) {
      console.error("S3 poll error", err);
    } finally {
      setTimeout(poll, intervalMs);
    }
  }
  poll();
}

