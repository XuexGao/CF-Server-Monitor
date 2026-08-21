import assert from 'node:assert/strict';
import test from 'node:test';
import { appendLatestLatencyPoint } from '../src/handlers/dashboard.js';

const BUCKET_MS = 2 * 60 * 1000;

function assertFixedWindow(series, expectedEnd) {
  assert.equal(series.length, 30);
  assert.equal(series[series.length - 1].ts, expectedEnd);
  for (let index = 1; index < series.length; index++) {
    assert.equal(series[index].ts - series[index - 1].ts, BUCKET_MS);
  }
}

test('latest latency fallback keeps a fixed two-minute window across a long gap', () => {
  const previousEnd = 1787238240000;
  const rawLatestTs = 1787239014000;
  const latestBucket = Math.floor(rawLatestTs / BUCKET_MS) * BUCKET_MS;
  const server = {
    ping: Array.from({ length: 30 }, (_, index) => ({
      ts: previousEnd - (29 - index) * BUCKET_MS,
      ct: 10
    })),
    loss: Array.from({ length: 30 }, (_, index) => ({
      ts: previousEnd - (29 - index) * BUCKET_MS,
      ct: 0,
      cu: 0,
      cm: 0,
      bd: 0
    }))
  };

  appendLatestLatencyPoint(server, {
    ping_ct: 25,
    loss_ct: 1,
    loss_cu: 2,
    loss_cm: 3,
    loss_bd: 4
  }, rawLatestTs, rawLatestTs);

  assertFixedWindow(server.ping, latestBucket);
  assertFixedWindow(server.loss, latestBucket);
  assert.equal(server.ping.at(-1).ct, 25);
  assert.deepEqual(server.loss.at(-1), {
    ts: latestBucket,
    ct: 1,
    cu: 2,
    cm: 3,
    bd: 4
  });
  assert.equal(server.loss.some(point => point.ts === rawLatestTs), false);
});

test('latest latency fallback expands an empty window to 30 aligned slots', () => {
  const rawLatestTs = 1787239014000;
  const latestBucket = Math.floor(rawLatestTs / BUCKET_MS) * BUCKET_MS;
  const server = { ping: [], loss: [] };

  appendLatestLatencyPoint(server, {
    ping_ct: 25,
    loss_ct: 0
  }, rawLatestTs, rawLatestTs);

  assertFixedWindow(server.ping, latestBucket);
  assertFixedWindow(server.loss, latestBucket);
  assert.equal(server.ping.every(point => point.ct === 25), true);
  assert.equal(server.loss.every(point => point.ct === 0), true);
});
