import assert from 'node:assert/strict';
import { networkFetch } from './networkFetch.js';
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const events = [];
try {
  globalThis.window = { dispatchEvent: event => events.push(event.type) };
  globalThis.fetch = async () => ({ status: 200 });
  await networkFetch('/test');
  assert.deepEqual(events, ['fixmybuddy:connection-response']);
  events.length = 0;
  globalThis.fetch = async () => { throw new TypeError('Network unavailable'); };
  await assert.rejects(networkFetch('/test'), TypeError);
  assert.deepEqual(events, ['fixmybuddy:connection-error']);
  events.length = 0;
  const aborted = Object.assign(new Error('Cancelled'), { name: 'AbortError' });
  globalThis.fetch = async () => { throw aborted; };
  await assert.rejects(networkFetch('/test'), { name: 'AbortError' });
  assert.deepEqual(events, []);
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError('Offline'); };
  await assert.rejects(networkFetch('/payment', { method: 'POST' }), TypeError);
  assert.equal(calls, 1, 'Mutations must never be automatically retried');
} finally {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
}
console.log('Connection response/error events, cancellation and no-automatic-retry checks passed.');

