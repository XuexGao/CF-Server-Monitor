import assert from 'node:assert/strict';
import test from 'node:test';
import { Miniflare } from 'miniflare';

import { getDashboardLatencyHistory } from '../src/database/schema.js';
import { buildHistoryId } from '../src/database/indexOptimization.js';

function createMiniflare() {
  return new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("OK"); } }',
    d1Databases: { DB: 'dashboard-latency-window-test' }
  });
}

async function createHistoryTable(db) {
  await db.prepare(`
    CREATE TABLE metrics_history (
      id INTEGER PRIMARY KEY,
      timestamp INTEGER,
      ping_ct INTEGER,
      ping_cu INTEGER,
      ping_cm INTEGER,
      ping_bd INTEGER,
      loss_ct INTEGER,
      loss_cu INTEGER,
      loss_cm INTEGER,
      loss_bd INTEGER
    )
  `).run();
}

function latencyRow(partitionId, timestamp, value) {
  return `(${buildHistoryId(partitionId, timestamp)}, ${timestamp}, ${value}, ${value + 1}, ${value + 2}, ${value + 3}, ${value % 10}, ${(value + 1) % 10}, ${(value + 2) % 10}, ${(value + 3) % 10})`;
}

test('dashboard latency history samples one hour from D1 into at most 20 real points', async () => {
  const miniflare = createMiniflare();

  try {
    const db = await miniflare.getD1Database('DB');
    await createHistoryTable(db);

    const partitionId = 1;
    const start = Date.UTC(2026, 6, 29, 0, 0, 0);
    const rows = [];
    for (let index = 0; index < 60; index++) {
      rows.push(latencyRow(partitionId, start + index * 60_000, 20 + index));
    }

    await db.prepare(`
      INSERT INTO metrics_history (
        id, timestamp,
        ping_ct, ping_cu, ping_cm, ping_bd,
        loss_ct, loss_cu, loss_cm, loss_bd
      )
      VALUES ${rows.join(',')}
    `).run();

    const history = await getDashboardLatencyHistory(db, [{
      id: 'server-1',
      history_partition_id: partitionId,
      timestamp: start
    }], {
      now: start + 60 * 60_000,
      cache: false
    });

    const window = history.get('server-1');
    assert.equal(window.ping.length, 20);
    assert.equal(window.loss.length, 20);
    assert.equal(new Set(window.ping.map(point => point.ts)).size, 20);
    assert.equal(window.ping.every(point => point.ct >= 20), true);
    assert.equal(window.loss.every(point => point.ct >= 0 && point.ct <= 100), true);
  } finally {
    await miniflare.dispose();
  }
});

test('dashboard latency history cache is reused for two minutes per server', async () => {
  const miniflare = createMiniflare();

  try {
    const db = await miniflare.getD1Database('DB');
    await createHistoryTable(db);

    const partitionId = 2;
    const start = Date.UTC(2026, 6, 29, 1, 0, 0);
    await db.prepare(`
      INSERT INTO metrics_history (
        id, timestamp,
        ping_ct, ping_cu, ping_cm, ping_bd,
        loss_ct, loss_cu, loss_cm, loss_bd
      )
      VALUES ${latencyRow(partitionId, start, 30)}
    `).run();

    const server = {
      id: 'server-cache',
      history_partition_id: partitionId,
      timestamp: start
    };
    const first = await getDashboardLatencyHistory(db, [server], {
      now: start + 60_000
    });
    assert.equal(first.get('server-cache').ping.at(-1).ct, 30);

    await db.prepare(`
      INSERT INTO metrics_history (
        id, timestamp,
        ping_ct, ping_cu, ping_cm, ping_bd,
        loss_ct, loss_cu, loss_cm, loss_bd
      )
      VALUES ${latencyRow(partitionId, start + 60_000, 90)}
    `).run();

    const cached = await getDashboardLatencyHistory(db, [server], {
      now: start + 90_000
    });
    assert.equal(cached.get('server-cache').ping.at(-1).ct, 30);

    const refreshed = await getDashboardLatencyHistory(db, [server], {
      now: start + 190_000
    });
    assert.equal(refreshed.get('server-cache').ping.at(-1).ct, 90);
  } finally {
    await miniflare.dispose();
  }
});
