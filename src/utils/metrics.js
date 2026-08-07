const PROBE_METRIC_FIELDS = [
  'ping_ct', 'ping_cu', 'ping_cm', 'ping_bd',
  'loss_ct', 'loss_cu', 'loss_cm', 'loss_bd'
];

const NUMERIC_METRIC_FIELDS = [
  'cpu', 'net_in_speed', 'net_out_speed', 'net_rx', 'net_tx',
  'net_rx_monthly', 'net_tx_monthly', 'processes', 'tcp_conn', 'udp_conn',
  'ram_total', 'ram_used', 'swap_total', 'swap_used',
  'disk_total', 'disk_used', 'cpu_cores'
];

export function isDisabledProbeMetric(value) {
  return value === false || value === 'false';
}

// 将探针上报的指标字段统一转换为数字类型，与 /api/servers 的 servers[] 字段类型保持一致。
// 数据库 D1 对 REAL/INTEGER 列返回 JS number，而探针 POST 的原始字段可能是字符串，
// latestReportUpdates 和 WebSocket 推送直接透传探针数据，需要在此统一类型。
export function coerceNumericMetricFields(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const result = { ...payload };

  for (const field of NUMERIC_METRIC_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(result, field)) continue;
    const value = result[field];
    if (value === null || value === undefined) continue;
    const num = Number(value);
    result[field] = Number.isFinite(num) ? num : 0;
  }

  for (const field of PROBE_METRIC_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(result, field)) continue;
    const value = result[field];
    if (value === false || value === 'false') {
      result[field] = false;
    } else if (value === null || value === undefined) {
      continue;
    } else {
      const num = Number(value);
      result[field] = Number.isFinite(num) ? num : null;
    }
  }

  return result;
}

function normalizeProbeMetric(value) {
  return isDisabledProbeMetric(value) ? false : value;
}

export function normalizeProbeMetricRow(metrics) {
  if (!metrics) return metrics;

  const normalized = { ...metrics };
  for (const field of PROBE_METRIC_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(normalized, field)) {
      normalized[field] = normalizeProbeMetric(normalized[field]);
    }
  }
  return normalized;
}

export function mergeMetricsIntoServer(server, metrics) {
  if (!metrics) return;

  server.cpu = metrics.cpu || 0;
  server.load_avg = metrics.load ?? metrics.load_avg ?? '0 0 0';
  server.net_in_speed = metrics.net_in_speed || 0;
  server.net_out_speed = metrics.net_out_speed || 0;
  server.net_rx = metrics.net_rx || 0;
  server.net_tx = metrics.net_tx || 0;
  server.net_rx_monthly = metrics.net_rx_monthly || 0;
  server.net_tx_monthly = metrics.net_tx_monthly || 0;
  server.processes = metrics.processes || 0;
  server.tcp_conn = metrics.tcp_conn || 0;
  server.udp_conn = metrics.udp_conn || 0;
  server.ping_ct = normalizeProbeMetric(metrics.ping_ct);
  server.ping_cu = normalizeProbeMetric(metrics.ping_cu);
  server.ping_cm = normalizeProbeMetric(metrics.ping_cm);
  server.ping_bd = normalizeProbeMetric(metrics.ping_bd);
  server.loss_ct = normalizeProbeMetric(metrics.loss_ct);
  server.loss_cu = normalizeProbeMetric(metrics.loss_cu);
  server.loss_cm = normalizeProbeMetric(metrics.loss_cm);
  server.loss_bd = normalizeProbeMetric(metrics.loss_bd);
  server.ram_total = metrics.ram_total || 0;
  server.ram_used = metrics.ram_used || 0;
  server.swap_total = metrics.swap_total || 0;
  server.swap_used = metrics.swap_used || 0;
  server.disk_total = metrics.disk_total || 0;
  server.disk_used = metrics.disk_used || 0;
  server.cpu_cores = metrics.cpu_cores || 0;
  server.cpu_info = metrics.cpu_info || '';
  server.gpu_info = metrics.gpu_info || '';
  server.arch = metrics.arch || '';
  server.os = metrics.os || '';
  server.kernel_version = metrics.kernel_version || '';
  server.agent_version = metrics.agent_version || '';
  server.region = server.region || metrics.region || '';
  server.ip_v4 = metrics.ip_v4 || '0';
  server.ip_v6 = metrics.ip_v6 || '0';
  server.boot_time = metrics.boot_time || '';
  server.last_updated = metrics.timestamp || 0;
}
