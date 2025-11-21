// dist/udp_listener.js
const dgram = require('dgram');
const config = require('./config');

function startUdpListener(ringBuffer, onParsed) {
  const socket = dgram.createSocket('udp4');

  socket.on('message', (msg, rinfo) => {
    const s = msg.toString('utf8');
    let parsed = null;
    try {
      if (s[0] === '{') {
        parsed = JSON.parse(s);
      } else {
        const parts = s.trim().split(',');
        parsed = {
          meta_time: parts[0],
          track: parts[1],
          chassis: parts[2],
          lap: Number(parts[3] || 0),
          lapdist_m: Number(parts[4] || 0),
          speed_kmh: Number(parts[5] || 0),
          accx_can: Number(parts[6] || 0),
          accy_can: Number(parts[7] || 0),
          Steering_Angle: Number(parts[8] || 0),
          pbrake_f: Number(parts[9] || 0),
          rpm: Number(parts[10] || 0),
          raw_source: 'udp:' + rinfo.address + ':' + rinfo.port
        };
      }
    } catch (err) {
      if (!socket._lastWarn || (Date.now() - socket._lastWarn > 5000)) {
        socket._lastWarn = Date.now();
        console.warn('UDP parse error (rate-limited):', err.message);
      }
      return;
    }

    ringBuffer.push(parsed);
    if (onParsed) onParsed(parsed);
  });

  socket.on('listening', () => {
    const addr = socket.address();
    console.log(`UDP listener started on ${addr.address}:${addr.port}`);
  });

  socket.bind(config.UDP_PORT);
  return socket;
}

module.exports = { startUdpListener };
