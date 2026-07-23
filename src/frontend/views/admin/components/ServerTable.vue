<template>
  <div id="tab-servers" class="tab-content" :class="{ active: activeTab === 'servers' }">
    <div class="alert alert-info alert-stack">
      <div class="alert-line">
        <span class="alert-icon">[i]</span>
        <span>{{ trans.clickToCopy }} <strong>📋</strong> {{ trans.installCommand }}</span>
      </div>
    </div>

    <div class="toolbar">
      <input type="text" v-model="newServerName" class="toolbar-input" :placeholder="'> ' + trans.serverName + '...'">
      <div class="toolbar-select-wrapper">
        <input type="text" v-model="newServerGroup" list="group-list" class="toolbar-select" :placeholder="trans.default || 'Default'">
        <datalist id="group-list">
          <option v-for="group in groups" :key="group" :value="group"></option>
        </datalist>
        <button v-if="newServerGroup" @click="newServerGroup = ''" class="toolbar-select-clear" title="Clear">✕</button>
      </div>
      <button @click="$emit('add-server')" class="btn btn-primary">+ {{ trans.addServer }}</button>
    </div>

    <div class="batch-actions">
      <button @click="$emit('batch-delete')" class="btn btn-red">🗑 {{ trans.batchDelete }}</button>
      <button @click="$emit('toggle-select-all')" class="btn">☐ {{ trans.toggleAll }}</button>
    </div>

    <div class="table-wrapper">
      <table class="terminal-table">
        <thead>
          <tr>
            <th class="table-center-cell col-width-35">↕️</th>
            <th class="col-width-30"><input type="checkbox" id="select-all" @change="$emit('select-all', $event)" class="checkbox-accent-green"></th>
            <th>{{ trans.hostname.toUpperCase() }}</th>
            <th>{{ trans.group.toUpperCase() }}</th>
            <th>{{ trans.tags.toUpperCase() }}</th>
            <th>{{ trans.note.toUpperCase() }}</th>
            <th>{{ trans.price.toUpperCase() }}</th>
            <th>{{ trans.currency.toUpperCase() }}</th>
            <th>{{ trans.billingCycle.toUpperCase() }}</th>
            <th>{{ trans.expirationDate.toUpperCase() }}</th>
            <th>{{ trans.autoRenewal.toUpperCase() }}</th>
            <th>{{ trans.traffic.toUpperCase() }}</th>
            <th>{{ trans.agentVersion.toUpperCase() }}</th>
            <th>{{ trans.status.toUpperCase() }}</th>
            <th>{{ trans.actions.toUpperCase() }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="servers.length === 0">
            <td colspan="15" class="empty-state"><span class="empty-icon">📦</span> {{ trans.noServers }}</td>
          </tr>
          <tr
            v-for="server in servers"
            :key="server.id"
            class="server-row"
            :data-server-id="server.id"
          >
            <td class="drag-handle table-center-cell" :title="trans.dragSort" draggable="true" @dragstart="$emit('drag-start', $event)" @dragover.prevent @drop="$emit('drop', $event, server.id)">⋮⋮</td>
            <td class="table-center-cell"><input type="checkbox" class="server-checkbox" :value="server.id" :checked="selectedServers.includes(server.id)" @change="$emit('toggle-server', server.id)"></td>
            <td>
              <div class="server-info">
                <span v-if="server.region && server.region !== 'xx'" class="country-os-icons">
                  <img :src="getPublicAssetUrl('flags/' + getFlagRegionCode(server.region) + '.svg')" :alt="server.region" class="flag-img">
                  <OsIcon :os="server.os" />
                </span>
                <span v-else class="country-os-icons">
                  <span class="flag-fallback">🏳️</span>
                  <OsIcon :os="server.os" />
                </span>
                <router-link :to="'/server/' + server.id + (selectedApiIndex ? '?apiIndex=' + selectedApiIndex : '')" class="server-name-link">{{ server.name }}</router-link>
              </div>
            </td>
            <td><span class="group-tag">{{ server.server_group || trans.default }}</span></td>
            <td>
              <div v-if="splitTags(server.tags).length" class="tag-list admin-tag-list">
                <span v-for="(tag, index) in splitTags(server.tags)" :key="tag" :class="['badge', 'badge-tag', tagColorClass(index)]">{{ tag }}</span>
              </div>
              <span v-else>-</span>
            </td>
            <td>
              <span
                class="note-text"
                :class="{ 'note-copied': copiedNoteServerId === server.id }"
                @dblclick.stop="$emit('copy-note', server)"
              >{{ server.note || '-' }}</span>
            </td>
            <td><span class="price-tag">{{ formatServerPrice(server) }}</span></td>
            <td><span class="spec-text">{{ formatServerCurrency(server) }}</span></td>
            <td><span class="spec-text">{{ formatServerBillingCycle(server) }}</span></td>
            <td><span class="date-text">{{ server.expire_date || '-' }}</span></td>
            <td><span class="spec-text">{{ isServerAutoRenewal(server) ? trans.enabled : trans.disabled }}</span></td>
            <td><span class="spec-text">{{ server.traffic_limit ? formatBytes(server.traffic_limit * 1024 * 1024 * 1024) : '-' }}</span></td>
            <td>
              <span
                class="spec-text"
                :class="getAgentVersionClass(server.agent_version)"
              >{{ server.agent_version || '●' }}</span>
            </td>
            <td>
              <span :style="{ color: server.is_online ? 'var(--accent-green)' : 'var(--accent-red)' }" class="font-bold">{{ (server.is_online ? '● ' + trans.online : '● ' + trans.offline).toUpperCase() }}</span>
            </td>
            <td>
              <div class="action-group">
                <div class="action-btns">
                  <button @click="$emit('copy-cmd', server.id)" class="btn btn-icon btn-green" :title="trans.copy">{{ copiedServerId === server.id ? '✅' : '📋' }}</button>
                  <button @click="$emit('edit', server)" class="btn btn-icon btn-blue" :title="trans.edit">✏️</button>
                  <button @click="$emit('delete', server.id)" class="btn btn-icon btn-red" :title="trans.delete">🗑️</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { getFlagRegionCode, formatBytes } from '../../../utils/api'
import { getPublicAssetUrl } from '../../../utils/config'
import { currentLang } from '../../../utils/i18n'
import { detectBillingCycle, detectCurrencySymbol, getBillingCycleOption, isEnabledFlag, isFreePrice, normalizeCurrency, normalizePrice } from '../../../../utils/serverBilling.js'
import OsIcon from '../../../components/OsIcon.vue'

const props = defineProps({
  trans: { type: Object, required: true },
  servers: { type: Array, default: () => [] },
  selectedServers: { type: Array, default: () => [] },
  groups: { type: Array, default: () => ['Default'] },
  activeTab: { type: String, default: 'servers' },
  selectedApiIndex: { type: Number, default: 0 },
  latestAgentVersion: { type: String, default: '' },
  copiedServerId: { type: [String, Number], default: null },
  copiedNoteServerId: { type: [String, Number], default: null }
})

const newServerName = defineModel('newServerName', { type: String, default: '' })
const newServerGroup = defineModel('newServerGroup', { type: String, default: '' })

defineEmits([
  'add-server', 'batch-delete', 'toggle-select-all', 'select-all',
  'drag-start', 'drop', 'toggle-server', 'copy-note',
  'copy-cmd', 'edit', 'delete'
])

const splitTags = (value) => String(value || '')
  .split(',')
  .map(tag => tag.trim())
  .filter(Boolean)
const tagColorClass = (index) => `tag-color-${index % 6}`
const formatServerPrice = (server) => {
  const price = normalizePrice(server.price)
  if (!price) return '-'
  return isFreePrice(price) ? props.trans.free : price
}
const formatServerCurrency = (server) => {
  const price = normalizePrice(server.price)
  if (!price || isFreePrice(price)) return '-'
  return normalizeCurrency(server.currency || detectCurrencySymbol(server.price)) || '-'
}
const formatServerBillingCycle = (server) => {
  const price = normalizePrice(server.price)
  if (!price || isFreePrice(price)) return '-'
  const option = getBillingCycleOption(detectBillingCycle(server.price) || server.billing_cycle)
  return currentLang.value === 'zh' ? option.shortLabelZh : option.shortLabelEn
}
const isServerAutoRenewal = (server) => isEnabledFlag(server.auto_renewal)
const normalizeVersion = (version) => String(version || '').trim()
const getAgentVersionClass = (version) => {
  const latest = normalizeVersion(props.latestAgentVersion)
  if (!latest) return ''
  return normalizeVersion(version) === latest ? 'text-green' : 'text-red'
}
</script>
