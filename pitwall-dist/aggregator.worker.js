// dist/aggregator.worker.js
const { parentPort } = require('worker_threads');

function sampleTireStress(p) {
  const ax = Number(p.accx_can || 0);
  const ay = Number(p.accy_can || 0);
  const steer = Math.abs(Number(p.Steering_Angle || 0)) / 360.0;
  return ax*ax + ay*ay + steer*steer;
}

function computeSectorIndex(sectors, lapdist) {
  if (!sectors || !sectors.length) {
    const total = (sectors && sectors.total_m) ? sectors.total_m : 5000;
    const sLen = total / 3;
    if (lapdist < sLen) return 0;
    if (lapdist < sLen*2) return 1;
    return 2;
  }
  for (let i=0;i<sectors.length;i++) {
    if (lapdist >= sectors[i].start_m && lapdist < sectors[i].end_m) return i;
  }
  return sectors.length - 1;
}

parentPort.on('message', (msg) => {
  if (msg.type === 'BATCH') {
    const points = msg.points || [];
    const sectorsMeta = msg.sectors || {};
    const chassisAgg = {};
    for (const p of points) {
      const key = p.chassis || (p.track + '_' + (p.vehicle || 'v'));
      if (!chassisAgg[key]) chassisAgg[key] = { perSectorStress: {}, lapStress: 0, lastLap: p.lap || 0 };
      const meta = chassisAgg[key];
      const stress = sampleTireStress(p);
      const sMeta = (sectorsMeta && sectorsMeta[p.track]) || (sectorsMeta && sectorsMeta.default);
      const sidx = computeSectorIndex(sMeta && sMeta.sectors, Number(p.lapdist_m || 0));
      meta.perSectorStress[sidx] = (meta.perSectorStress[sidx] || 0) + stress;
      meta.lapStress += stress;
      meta.lastLap = p.lap || meta.lastLap;
    }

    const results = [];
    for (const k of Object.keys(chassisAgg)) {
      const agg = chassisAgg[k];
      const predicted_loss_per_lap_seconds = +( (agg.lapStress * 0.00005) ).toFixed(3);
      const laps_until_0_5s_loss = +Math.max(1, (0.5 / (predicted_loss_per_lap_seconds || 0.01))).toFixed(2);
      results.push({
        chassis: k,
        track: msg.track,
        lap: agg.lastLap,
        lap_tire_stress: agg.lapStress,
        perSectorStress: agg.perSectorStress,
        predicted_loss_per_lap_seconds,
        laps_until_0_5s_loss
      });
    }
    parentPort.postMessage({ type: 'AGGREGATES', results, ts: Date.now() });
  }
});
