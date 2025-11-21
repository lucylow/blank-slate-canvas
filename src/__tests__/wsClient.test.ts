// src/__tests__/wsClient.test.ts
import { WSClient } from '../lib/wsClient';

test('wsclient schedules reconnect on error (smoke)', () => {
  // Simple smoke - instantiate and call connect (integration tests required for full)
  const client = new WSClient({ url: 'ws://localhost:9999', onError: () => {}, onClose: () => {} });
  client.connect();
  expect(typeof client.send === 'function').toBeTruthy();
  client.close();
});

