import assert from 'node:assert/strict';
import {
  estimateDurableObjectsBillableRequests,
  summarizeDurableObjectsUsage
} from '../src/handlers/admin.js';

assert.equal(estimateDurableObjectsBillableRequests(0), 0);
assert.equal(estimateDurableObjectsBillableRequests(1), 1);
assert.equal(estimateDurableObjectsBillableRequests(20), 1);
assert.equal(estimateDurableObjectsBillableRequests(21), 2);
assert.equal(estimateDurableObjectsBillableRequests(100), 5);
assert.equal(estimateDurableObjectsBillableRequests('101'), 6);

assert.equal(estimateDurableObjectsBillableRequests({
  httpRequests: 12,
  hibernationWakeups: 20,
  inboundWebSocketMessages: 21,
  outboundWebSocketMessages: 1000
}), 34);

const usage = summarizeDurableObjectsUsage([
  { dimensions: { type: 'fetch' }, sum: { requests: 10 } },
  { dimensions: { type: 'websocket_message' }, sum: { requests: 21 } },
  { dimensions: { type: 'webSocketHibernation' }, sum: { requests: 20 } }
], [
  { sum: { inboundWebsocketMsgCount: 39, outboundWebsocketMsgCount: 100 } },
  { sum: { inboundWebsocketMsgCount: '1', outboundWebsocketMsgCount: '20' } }
]);

assert.deepEqual(usage, {
  httpRequests: 10,
  hibernationWakeups: 41,
  inboundWebSocketMessages: 40,
  outboundWebSocketMessages: 120,
  rawRequests: 51,
  billableRequests: 53
});

console.log('admin usage tests passed');
