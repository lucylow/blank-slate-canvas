// dist/s3_watcher.js
const AWS = require('aws-sdk');
const csv = require('csv-parse');

const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });

async function fetchS3CsvToBuffer(bucket, key, ringBuffer, onParsed) {
  const params = { Bucket: bucket, Key: key };
  const res = s3.getObject(params).createReadStream();
  const parser = csv({ columns: true, relax: true, skip_empty_lines: true });
  res.pipe(parser);
  parser.on('data', (row) => {
    const parsed = {
      meta_time: row.meta_time || new Date().toISOString(),
      track: row.track || row.circuit,
      chassis: row.chassis || row.vehicle,
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
    ringBuffer.push(parsed);
    if (onParsed) onParsed(parsed);
  });
  parser.on('end', () => console.log('Finished streaming S3 object', key));
  parser.on('error', (err) => console.error('S3 CSV parse error for', key, err));
}

async function pollBucketPrefix(bucket, prefix, ringBuffer, onParsed, intervalMs = 60000) {
  async function poll() {
    try {
      const list = await s3.listObjectsV2({ Bucket: bucket, Prefix: prefix }).promise();
      for (const obj of list.Contents || []) {
        if (obj.Size === 0) continue;
        await fetchS3CsvToBuffer(bucket, obj.Key, ringBuffer, onParsed);
      }
    } catch (err) {
      console.error('S3 poll error', err);
    } finally {
      setTimeout(poll, intervalMs);
    }
  }
  poll();
}

module.exports = { fetchS3CsvToBuffer, pollBucketPrefix };
