<template>
  <router-link :to="to" class="server-card server-card-ring" :data-region="regionCode">
    <div class="server-card-ring-header">
      <div class="server-card-header">
        <div class="server-identity">
          <span v-if="regionCode && regionCode !== 'xx'" class="country-os-icons">
            <img class="flag-img" :src="getPublicAssetUrl('flags/' + regionCode + '.svg')" :alt="regionCode">
            <OsIcon :os="server.os" />
          </span>
          <span v-else class="country-os-icons">
            <span class="flag-fallback">🏳️</span>
            <OsIcon :os="server.os" />
          </span>
          <span class="server-name">{{ server.name }}</span>
        </div>
        <span class="status-label" :style="{ color: statusColor, borderColor: statusColor }">{{ statusText }}</span>
      </div>
      <div class="server-meta">
        <div class="card-meta">
          <div v-if="sysConfig.show_price && priceText" class="card-meta-item">💰 {{ priceText }}</div>
          <div v-if="sysConfig.show_expire && server.expire_date" class="card-meta-item">📅 <span :class="{ 'expired': isExpired }">{{ expireText }}</span></div>
        </div>
        <div class="card-badges">
          <span v-for="(tag, index) in tagList" :key="tag" :class="['badge', 'badge-tag', tagColorClass(index)]">{{ tag }}</span>
          <span v-if="server.ip_v4 === '1' && server.ip_v6 === '1'" class="badge badge-v4-v6">IPv4/6</span>
          <template v-else>
            <span v-if="server.ip_v4 === '1'" class="badge badge-v4">IPv4</span>
            <span v-if="server.ip_v6 === '1'" class="badge badge-v6">IPv6</span>
          </template>
        </div>
      </div>
    </div>

    <div class="server-card-ring-divider"></div>

    <div class="server-card-ring-metrics">
      <div class="metric-ring-item">
        <div class="metric-ring-chart" :style="getRingStyle(cpuPercent, getUsageColor(cpuPercent))">
          <span class="metric-ring-track"></span>
          <span class="metric-ring-progress"></span>
          <span class="metric-ring-center">{{ roundedPercent(cpuPercent) }}%</span>
        </div>
        <div class="metric-ring-label">CPU</div>
        <div class="metric-ring-subtext">{{ cpuCores }} Cores</div>
      </div>

      <div class="metric-ring-item">
        <div class="metric-ring-chart" :style="getRingStyle(ramPercent, getUsageColor(ramPercent))">
          <span class="metric-ring-track"></span>
          <span class="metric-ring-progress"></span>
          <span class="metric-ring-center">{{ roundedPercent(ramPercent) }}%</span>
        </div>
        <div class="metric-ring-label">RAM</div>
        <div class="metric-ring-subtext">{{ ramUsageText }}</div>
      </div>

      <div class="metric-ring-item">
        <div class="metric-ring-chart" :style="getRingStyle(diskPercent, getUsageColor(diskPercent))">
          <span class="metric-ring-track"></span>
          <span class="metric-ring-progress"></span>
          <span class="metric-ring-center">{{ roundedPercent(diskPercent) }}%</span>
        </div>
        <div class="metric-ring-label">Disk</div>
        <div class="metric-ring-subtext">{{ diskUsageText }}</div>
      </div>
    </div>

    <div class="server-card-network-panel">
      <div class="server-card-network-row">
        <span class="server-card-network-label">{{ trans.networkTraffic }}</span>
        <span class="server-card-network-values">
          <span class="server-card-speed-up">↑ {{ netOutSpeed }}/s</span>
          <span class="server-card-speed-down">↓ {{ netInSpeed }}/s</span>
        </span>
      </div>
      <div class="server-card-network-row">
        <span class="server-card-network-label">{{ trans.loadAvg }}</span>
        <span class="server-card-network-values">
          <span>{{ loadAvg[0].toFixed(2) }}</span>
          <span>{{ loadAvg[1].toFixed(2) }}</span>
          <span>{{ loadAvg[2].toFixed(2) }}</span>
        </span>
      </div>
      <div class="server-card-network-row">
        <span class="server-card-network-label">{{ trans.totalTraffic }}</span>
        <span class="server-card-network-values server-card-total-values">
          <span>↑ {{ totalTx }}</span>
          <span>↓ {{ totalRx }}</span>
        </span>
      </div>
      <div v-if="sysConfig.show_tf" class="server-card-limit-section">
        <div class="server-card-limit-header">
          <span>{{ trans.monthlyTraffic }}</span>
          <span>{{ trafficLimitText }} | <template v-if="trafficLimitSummary">{{ trafficLimitPercentText }}%</template><template v-else>Unlimited</template></span>
        </div>
        <div v-if="trafficLimitSummary" class="server-card-limit-bar">
          <div class="server-card-limit-fill" :style="{ width: Math.min(100, trafficUsagePercent) + '%', background: getUsageColor(trafficUsagePercent) }"></div>
        </div>
      </div>
      <div v-if="hasPingData" class="server-card-ping-row">
        <span class="server-card-ping-chip" v-for="p in pingList" :key="p.label">
          <span class="server-card-ping-label">{{ p.label }}</span>
          <span class="server-card-ping-val" :style="{ color: getPingColor(p.value) }">{{ isPingValid(p.value) ? p.value + 'ms' : trans.timeout }}</span>
        </span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import OsIcon from './OsIcon.vue'
import { DEFAULT_SERVER_CARD_CONFIG, useServerCardData } from '../composables/useServerCardData'

const props = defineProps({
  server: {
    type: Object,
    required: true
  },
  sysConfig: {
    type: Object,
    default: () => ({ ...DEFAULT_SERVER_CARD_CONFIG })
  },
  to: {
    type: String,
    default: ''
  }
})

const {
  trans,
  regionCode,
  statusColor,
  statusText,
  cpuPercent,
  cpuCores,
  ramPercent,
  diskPercent,
  trafficLimitSummary,
  trafficUsagePercent,
  trafficLimitPercentText,
  trafficLimitText,
  netInSpeed,
  netOutSpeed,
  totalRx,
  totalTx,
  priceText,
  loadAvg,
  ramUsageText,
  diskUsageText,
  getUsageColor,
  getRingStyle,
  roundedPercent,
  isPingValid,
  getPingColor,
  pingList,
  hasPingData,
  getPublicAssetUrl,
  tagList,
  tagColorClass,
  isExpired,
  expireText
} = useServerCardData(props)
</script>
