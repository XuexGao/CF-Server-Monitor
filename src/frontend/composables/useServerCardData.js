import { computed } from 'vue'
import { formatBytes, getFlagRegionCode, isServerOnline } from '../utils/api'
import { getPublicAssetUrl } from '../utils/config'
import { currentLang, useTranslation } from '../utils/i18n'
import { PING } from '../utils/constants'
import { normalizeTimestamp, formatDateTime } from '../utils/time.js'
import { formatBillingPrice } from '../../utils/serverBilling.js'

export const DEFAULT_SERVER_CARD_CONFIG = {
  show_price: true,
  show_expire: true,
  show_tf: true,
  show_time: true,
  display_mode: 'bar'
}

export const getTrafficUsageBytes = (server) => {
  const rx = parseFloat(server.net_rx_monthly) || 0
  const tx = parseFloat(server.net_tx_monthly) || 0
  const calcType = server.traffic_calc_type || 'total'
  if (calcType === 'dl') return rx
  if (calcType === 'ul') return tx
  if (calcType === 'max') return Math.max(rx, tx)
  return rx + tx
}

export const calcTrafficUsagePercent = (server) => {
  const limit = parseFloat(server.traffic_limit) || 0
  if (limit <= 0) return 0
  const limitBytes = limit * 1024 * 1024 * 1024
  const usedBytes = getTrafficUsageBytes(server)
  return (usedBytes / limitBytes) * 100
}

const clampPercent = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, num))
}

export const getUsageColor = (percent) => {
  const p = clampPercent(percent)
  if (p >= 95) return 'var(--accent-red)'
  if (p >= 80) return 'var(--accent-yellow)'
  if (p >= 50) return 'var(--accent-blue)'
  return 'var(--accent-green)'
}

export function useServerCardData(props) {
  const trans = useTranslation()

  const currentTime = computed(() => {
    const ts = Number(props.server.current_timestamp)
    if (Number.isFinite(ts) && ts > 0) {
      return ts < 10000000000 ? ts * 1000 : ts
    }
    return Date.now()
  })

  const regionCode = computed(() => getFlagRegionCode(props.server.region))
  const isOnline = computed(() => isServerOnline(props.server, currentTime.value))
  const statusColor = computed(() => isOnline.value ? 'var(--accent-green)' : 'var(--accent-red)')
  const statusText = computed(() => isOnline.value ? trans.value.online : trans.value.offline)

  const cpuPercent = computed(() => clampPercent(Number.parseFloat(props.server.cpu || 0) || 0))
  const cpuCores = computed(() => parseInt(props.server.cpu_cores) || 0)
  const ramPercent = computed(() => {
    const total = Number.parseFloat(props.server.ram_total) || 0
    if (total > 0) {
      return clampPercent(((Number.parseFloat(props.server.ram_used) || 0) / total) * 100)
    }
    return 0
  })
  const diskPercent = computed(() => {
    const total = Number.parseFloat(props.server.disk_total) || 0
    if (total > 0) {
      return clampPercent(((Number.parseFloat(props.server.disk_used) || 0) / total) * 100)
    }
    return 0
  })

  const trafficLimitSummary = computed(() => {
    const limitGb = Number.parseFloat(props.server.traffic_limit) || 0
    if (limitGb <= 0) return null
    const limitBytes = limitGb * 1024 * 1024 * 1024
    const usedBytes = getTrafficUsageBytes(props.server)
    return {
      usedBytes,
      limitBytes,
      percent: (usedBytes / limitBytes) * 100
    }
  })

  const trafficUsagePercent = computed(() => trafficLimitSummary.value ? trafficLimitSummary.value.percent : 0)
  const trafficUsagePercentText = computed(() => trafficUsagePercent.value.toFixed(2))
  const trafficLimitPercentText = computed(() => {
    if (!trafficLimitSummary.value) return '0.0'
    return trafficUsagePercent.value.toFixed(1)
  })
  const trafficLimitText = computed(() => {
    if (trafficLimitSummary.value){
      return `${formatBytes(trafficLimitSummary.value.usedBytes)} / ${formatBytes(trafficLimitSummary.value.limitBytes)}`
    }else{
      return `↓ ${totalRxMonthly.value} ↑ ${totalTxMonthly.value}`
    }
  })

  const tagList = computed(() => String(props.server.tags || '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
  )
  const tagColorClass = (index) => `tag-color-${index % 6}`

  const netInSpeed = computed(() => formatBytes(props.server.net_in_speed))
  const netOutSpeed = computed(() => formatBytes(props.server.net_out_speed))
  const totalRx = computed(() => formatBytes(props.server.net_rx))
  const totalTx = computed(() => formatBytes(props.server.net_tx))
  const totalRxMonthly = computed(() => formatBytes(props.server.net_rx_monthly))
  const totalTxMonthly = computed(() => formatBytes(props.server.net_tx_monthly))
  const priceText = computed(() => formatBillingPrice(props.server, currentLang.value))

  const loadAvg = computed(() => {
    const raw = String(props.server.load_avg || '').trim()
    if (!raw) return [0, 0, 0]
    const parts = raw.split(/\s+/)
    return [parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0]
  })

  const formatUptime = (bootTime, nowTs = Date.now()) => {
    if (!bootTime) return 'N/A'

    let bootTimeMs = null
    if (typeof bootTime === 'string' && !/^\d+$/.test(bootTime)) {
      const parsed = new Date(bootTime)
      if (!Number.isNaN(parsed.getTime())) {
        bootTimeMs = parsed.getTime()
      }
    } else {
      const timestamp = Number.parseInt(bootTime)
      if (Number.isFinite(timestamp)) {
        bootTimeMs = timestamp < 1000000000000 ? timestamp * 1000 : timestamp
      }
    }

    if (!bootTimeMs) return 'N/A'

    const diffMs = nowTs - bootTimeMs
    if (diffMs < 0) return 'N/A'

    const totalSeconds = Math.floor(diffMs / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const zh = currentLang.value === 'zh'
    const parts = []

    if (days > 0) parts.push(zh ? `${days}天` : `${days}d`)
    if (hours > 0) parts.push(zh ? `${hours}小时` : `${hours}h`)
    if (minutes > 0) parts.push(zh ? `${minutes}分` : `${minutes}m`)
    if (seconds > 0 || parts.length === 0) parts.push(zh ? `${seconds}秒` : `${seconds}s`)

    return parts.slice(0, 3).join(' ')
  }

  const uptimeText = computed(() => formatUptime(props.server.boot_time, currentTime.value))

  const formatMetricUsage = (used, total) => `${formatBytes((Number(used) || 0) * 1024 * 1024)} / ${formatBytes((Number(total) || 0) * 1024 * 1024)}`
  const ramUsageText = computed(() => formatMetricUsage(props.server.ram_used, props.server.ram_total))
  const diskUsageText = computed(() => formatMetricUsage(props.server.disk_used, props.server.disk_total))

  const dataTimeText = computed(() => {
    const reportTimestamp = normalizeTimestamp(props.server.report_timestamp ?? props.server.last_updated)
    if (!isOnline.value) return formatDateTime(reportTimestamp)

    const displayTimestamp = normalizeTimestamp(
      props.server.display_timestamp ?? props.server.sample_timestamp ?? props.server.timestamp ?? reportTimestamp
    )
    const sampleTimestamp = normalizeTimestamp(
      props.server.sample_timestamp ?? props.server.timestamp ?? displayTimestamp
    )
    const lagSeconds = displayTimestamp && sampleTimestamp
      ? Math.max(0, Math.floor((displayTimestamp - sampleTimestamp) / 1000))
      : 0
    return `${formatDateTime(sampleTimestamp)}${lagSeconds > 0 ? ` (+${lagSeconds}s)` : ''}`
  })

  const isExpired = computed(() => {
    const expTime = new Date(props.server.expire_date).getTime()
    return !isNaN(expTime) && expTime < currentTime.value
  })

  const expireText = computed(() => {
    const expTime = new Date(props.server.expire_date).getTime()
    if (isNaN(expTime)) return ''
    const diff = expTime - currentTime.value
    const days = Math.ceil(diff / (1000 * 3600 * 24))
    return days > 0 ? `${days}${trans.value.expireDays}` : trans.value.expired
  })

  const getRingStyle = (value, color) => ({
    '--ring-value': `${clampPercent(value)}`,
    '--ring-color': color
  })

  const roundedPercent = (value) => Math.round(clampPercent(value))

  const isPingValid = (ping) => {
    if (isPingDisabled(ping)) return false
    if (ping === null || ping === undefined || ping === '' || ping === '0') {
      return false
    }
    const val = parseInt(ping)
    return val > 0
  }

  const isPingDisabled = (ping) => ping === false || ping === 'false'

  const getPingColor = (ping) => {
    if (!isPingValid(ping)) return 'var(--accent-red)'
    const val = parseInt(ping)
    if (val < PING.GOOD_THRESHOLD) return 'var(--accent-green)'
    if (val < PING.WARNING_THRESHOLD) return 'var(--accent-yellow)'
    return 'var(--accent-red)'
  }

  const pingList = computed(() => [
    { label: 'CT', value: props.server.ping_ct },
    { label: 'CU', value: props.server.ping_cu },
    { label: 'CM', value: props.server.ping_cm },
    { label: 'BD', value: props.server.ping_bd }
  ].filter(ping => !isPingDisabled(ping.value)))

  const hasPingData = computed(() => pingList.value.length > 0)

  return {
    trans,
    currentTime,
    regionCode,
    isOnline,
    statusColor,
    statusText,
    cpuPercent,
    cpuCores,
    ramPercent,
    diskPercent,
    trafficLimitSummary,
    trafficUsagePercent,
    trafficUsagePercentText,
    trafficLimitPercentText,
    trafficLimitText,
    tagList,
    tagColorClass,
    netInSpeed,
    netOutSpeed,
    totalRx,
    totalTx,
    totalRxMonthly,
    totalTxMonthly,
    priceText,
    loadAvg,
    uptimeText,
    ramUsageText,
    diskUsageText,
    dataTimeText,
    isExpired,
    expireText,
    getUsageColor,
    getRingStyle,
    roundedPercent,
    isPingValid,
    isPingDisabled,
    getPingColor,
    pingList,
    hasPingData,
    getPublicAssetUrl,
    formatBytes
  }
}
