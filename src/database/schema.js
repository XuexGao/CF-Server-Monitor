let dbInitialized = false;

const metricsHistoryCache = new Map();

function getCacheKey(serverId, hours, columns) {
  const sortedColumns = columns.split(',').sort().join(',');
  return `${serverId}:${hours}:${sortedColumns}`;
}

function getCacheDuration(hours) {
  if (hours >= 60) {
    return 5 * 60 * 1000;
  } else if (hours >= 30) {
    return 3 * 60 * 1000;
  } else {
    return 1 * 60 * 1000;
  }
}

export async function initDatabase(db) {
  if (dbInitialized) return;
  
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY, 
        value TEXT
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        name TEXT,
        server_group TEXT DEFAULT 'Default',
        price TEXT DEFAULT '',
        expire_date TEXT DEFAULT '',
        bandwidth TEXT DEFAULT '',
        traffic_limit TEXT DEFAULT '',
        is_hidden TEXT DEFAULT '0',
        sort_order INTEGER DEFAULT 0
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS metrics_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT NOT NULL,
        timestamp INTEGER DEFAULT 0,
        cpu REAL DEFAULT 0,
        ram REAL DEFAULT 0,
        disk REAL DEFAULT 0,
        load_avg TEXT DEFAULT '0',
        net_in_speed REAL DEFAULT 0,
        net_out_speed REAL DEFAULT 0,
        net_rx REAL DEFAULT 0,
        net_tx REAL DEFAULT 0,
        processes INTEGER DEFAULT 0,
        tcp_conn INTEGER DEFAULT 0,
        udp_conn INTEGER DEFAULT 0,
        ping_ct INTEGER DEFAULT 0,
        ping_cu INTEGER DEFAULT 0,
        ping_cm INTEGER DEFAULT 0,
        ping_bd INTEGER DEFAULT 0,
        ram_total REAL DEFAULT 0,
        ram_used REAL DEFAULT 0,
        swap_total REAL DEFAULT 0,
        swap_used REAL DEFAULT 0,
        disk_total REAL DEFAULT 0,
        disk_used REAL DEFAULT 0,
        cpu_cores INTEGER DEFAULT 0,
        cpu_info TEXT DEFAULT '',
        arch TEXT DEFAULT '',
        os TEXT DEFAULT '',
        country TEXT DEFAULT '',
        ip_v4 TEXT DEFAULT '0',
        ip_v6 TEXT DEFAULT '0',
        boot_time TEXT DEFAULT '',
        FOREIGN KEY (server_id) REFERENCES servers(id)
      )
    `).run();

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_history_server_time 
      ON metrics_history(server_id, timestamp)
    `).run();

    console.log('✅ 数据库初始化完成');
    dbInitialized = true;
  } catch (e) {
    console.error('❌ 数据库初始化失败:', e);
  }
}

export async function getMetricsHistory(db, serverId, hours, columns) {
  const now = Date.now();
  const cacheKey = getCacheKey(serverId, hours, columns);
  const cacheDuration = getCacheDuration(hours);
  
  const cached = metricsHistoryCache.get(cacheKey);
  if (cached && now - cached.timestamp < cacheDuration) {
    console.log(`[History] CACHE HIT: ${serverId}, hours: ${hours}`);
    return cached.data;
  }
  
  let queryHours = hours;
  let intervalMs;
  
  if (hours > 72) {
    queryHours = 72;
    intervalMs = 25 * 60 * 1000;
  } else if (hours >= 24) {
    intervalMs = 15 * 60 * 1000;
  } else if (hours >= 12) {
    intervalMs = 10 * 60 * 1000;
  } else if (hours >= 6) {
    intervalMs = 5 * 60 * 1000;
  } else if (hours <= 1) {
    intervalMs = 1 * 60 * 1000;
  } else {
    intervalMs = 5 * 60 * 1000;
  }

  const cutoff = now - queryHours * 60 * 60 * 1000;

  console.log(
    '[History]',
    'server:', serverId,
    'hours:', hours,
    'queryHours:', queryHours,
    'interval:', intervalMs,
    'cutoff:', new Date(cutoff).toISOString()
  );

  const rawResult = await db.prepare(`
    WITH sampled AS (
      SELECT 
        timestamp, 
        ${columns},
        ROW_NUMBER() OVER (
          PARTITION BY CAST(timestamp / ? AS INTEGER)
          ORDER BY timestamp
        ) AS rn
      FROM metrics_history
      WHERE server_id = ?
        AND typeof(timestamp) = 'integer'
        AND timestamp >= ?
    )
    SELECT timestamp, ${columns}
    FROM sampled
    WHERE rn = 1
  `).bind(intervalMs, serverId, cutoff).all();

  const result = rawResult.results.map(row => ({
    ...row,
    timestamp: Number(row.timestamp)
  }));

  result.sort((a, b) => a.timestamp - b.timestamp);
  
  metricsHistoryCache.set(cacheKey, {
    timestamp: now,
    data: result
  });

  console.log(`[History] FINAL: ${result.length}`);

  return result;
}

export async function cleanupOldData(db) {
  try {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    
    const stats = {
      expired: 0,
      deleted: 0
    };
    
    const rawCutoff = now - threeDays;
    const intDeleteResult = await db.prepare(
      `DELETE FROM metrics_history WHERE typeof(timestamp) = 'integer' AND timestamp < ?`
    ).bind(rawCutoff).run();
    stats.expired = intDeleteResult.meta.changes || 0;
    stats.deleted += stats.expired;
    
    const totalDeleted = stats.deleted;
    
    if (totalDeleted > 0) {
      console.log(`[Cleanup] 清理 ${totalDeleted} 条过期数据`);
    }
    
    return {
      success: true,
      deleted: totalDeleted,
      expired: stats.expired
    };
  } catch (e) {
    console.error('[Cleanup] 清理数据失败:', e);
    return { success: false, error: e.message };
  }
}

export async function saveMetricsHistory(db, serverId, metrics, countryCode = '') {
  try {
    const now = Date.now();
    
    // 安全解析 ping 值，空值或 0 表示不可达，存储为 NULL
    const parsePing = (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = parseInt(val);
      return (num > 0) ? num : null;
    };
    
    await db.prepare(`
      INSERT INTO metrics_history (
        server_id, timestamp, cpu, ram, disk, load_avg,
        net_in_speed, net_out_speed, net_rx, net_tx,
        processes, tcp_conn, udp_conn,
        ping_ct, ping_cu, ping_cm, ping_bd,
        ram_total, ram_used, swap_total, swap_used,
        disk_total, disk_used,
        cpu_cores, cpu_info, arch, os, country, ip_v4, ip_v6, boot_time
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).bind(
      serverId,
      now,
      parseFloat(metrics.cpu) || 0,
      parseFloat(metrics.ram) || 0,
      parseFloat(metrics.disk) || 0,
      metrics.load || '0',
      parseFloat(metrics.net_in_speed) || 0,
      parseFloat(metrics.net_out_speed) || 0,
      parseFloat(metrics.net_rx) || 0,
      parseFloat(metrics.net_tx) || 0,
      parseInt(metrics.processes) || 0,
      parseInt(metrics.tcp_conn) || 0,
      parseInt(metrics.udp_conn) || 0,
      parsePing(metrics.ping_ct),
      parsePing(metrics.ping_cu),
      parsePing(metrics.ping_cm),
      parsePing(metrics.ping_bd),
      parseFloat(metrics.ram_total) || 0,
      parseFloat(metrics.ram_used) || 0,
      parseFloat(metrics.swap_total) || 0,
      parseFloat(metrics.swap_used) || 0,
      parseFloat(metrics.disk_total) || 0,
      parseFloat(metrics.disk_used) || 0,
      parseInt(metrics.cpu_cores) || 0,
      metrics.cpu_info || '',
      metrics.arch || '',
      metrics.os || '',
      countryCode,
      metrics.ip_v4 || '0',
      metrics.ip_v6 || '0',
      metrics.boot_time || ''
    ).run();
  } catch (e) {
    console.error('保存历史数据失败:', e);
  }
}

export async function getLatestMetrics(db, serverId) {
  try {
    const result = await db.prepare(`
      SELECT * FROM metrics_history 
      WHERE server_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).bind(serverId).first();
    
    return result || null;
  } catch (e) {
    console.error('获取最新指标数据失败:', e);
    return null;
  }
}

export async function getLatestMetricsForAllServers(db) {
  try {
    const { results: servers } = await db.prepare('SELECT id FROM servers').all();

    const entries = await Promise.all(
      servers.map(s =>
        getLatestMetrics(db, s.id).then(metrics => [s.id, metrics])
      )
    );

    return new Map(entries.filter(([, m]) => m !== null));
  } catch (e) {
    console.error('获取所有服务器最新指标数据失败:', e);
    return new Map();
  }
}