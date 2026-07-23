const PROBE_METRIC_FIELDS = [
  'ping_ct', 'ping_cu', 'ping_cm', 'ping_bd',
  'loss_ct', 'loss_cu', 'loss_cm', 'loss_bd'
];

export function isDisabledProbeMetric(value) {
  return value === false || value === 'false';
}

export function normalizeProbeMetric(value) {
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
  server.gpu = metrics.gpu;
  server.gpu_info = metrics.gpu_info || '';
  server.arch = metrics.arch || '';
  server.os = metrics.os || '';
  server.agent_version = metrics.agent_version || '';
  server.region = metrics.region || '';
  server.ip_v4 = metrics.ip_v4 || '0';
  server.ip_v6 = metrics.ip_v6 || '0';
  server.boot_time = metrics.boot_time || '';
  server.last_updated = metrics.timestamp || 0;
}
