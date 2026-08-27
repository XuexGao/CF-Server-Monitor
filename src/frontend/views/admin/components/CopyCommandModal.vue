<template>
  <div id="copyModal" class="modal-overlay" :class="{ active: show }">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title">{{ currentServerName }}</div>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">{{ trans.targetOs }}</label>
          <select :value="targetOs" class="form-select" @change="$emit('update:target-os', $event.target.value)">
            <option value="linux">Linux/OpenWrt/Synology DSM/FreeBSD/macOS</option>
            <option value="windows">Windows</option>
          </select>
        </div>

        <div class="form-group flex-1">
          <label class="form-label">
            {{ trans.ghProxy }}
            <HelpTooltip :text="trans.ghProxyTip" />
          </label>
          <select v-model="selectedGhProxy" class="form-select">
            <option v-for="option in ghProxyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            <option :value="CUSTOM_GH_PROXY_VALUE">{{ trans.custom || 'Custom' }}</option>
          </select>
          <input
            v-if="showCustomGhProxy"
            type="text"
            :value="installGhProxy"
            class="form-input mt-2"
            :placeholder="trans.ghProxyPlaceholder"
            @input="$emit('update:install-gh-proxy', $event.target.value)"
          >
        </div>
      </div>

      <div class="config-list">
        <div class="config-row">
          <span class="config-label">{{ trans.collectInterval }}</span>
          <span class="config-value">{{ formatWithUnit(collectInterval, 's') }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.reportInterval }}</span>
          <span class="config-value">{{ formatWithUnit(reportInterval, 's') }}</span>
        </div>
        <div v-if="connectionMode === 'auto'" class="config-row">
          <span class="config-label">{{ trans.wssReportInterval }}</span>
          <span class="config-value">{{ formatWithUnit(wssReportInterval, 's') }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.connectionMode }}</span>
          <span class="config-value">{{ connectionMode === 'http' ? trans.connectionModeHttp : trans.connectionModeAuto }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.trafficResetDay }}</span>
          <span class="config-value">{{ isBlank(resetDay) ? '-' : resetDay }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.autoUpdate }}</span>
          <span class="config-value">
            <span :class="['config-badge', autoUpdate ? 'is-enabled' : 'is-disabled']">
              {{ autoUpdate ? trans.enabled : trans.disabled }}
            </span>
          </span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.customCt }}</span>
          <span class="config-value">{{ isBlank(customCt) ? '-' : customCt }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.customCu }}</span>
          <span class="config-value">{{ isBlank(customCu) ? '-' : customCu }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.customCm }}</span>
          <span class="config-value">{{ isBlank(customCm) ? '-' : customCm }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.customBd }}</span>
          <span class="config-value">{{ isBlank(customBd) ? '-' : customBd }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.networkInterface }}</span>
          <span class="config-value">{{ isBlank(networkInterface) ? '-' : networkInterface }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.rxCorrection }} (GB)</span>
          <span class="config-value">{{ formatWithUnit(rxCorrection, 'GB') }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">{{ trans.txCorrection }} (GB)</span>
          <span class="config-value">{{ formatWithUnit(txCorrection, 'GB') }}</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">{{ trans.installCommand }}</label>
        <div class="cmd-output-wrapper" :class="{ copied: copiedCmd }">
          <span class="cmd-prompt">{{ targetOs === 'windows' ? 'PS' : '$' }}</span>
          <pre class="cmd-output">{{ installCommand }}</pre>
        </div>
      </div>

      <div class="modal-footer flex-justify-between">
        <div class="flex items-center gap-2">
          <button @click="$emit('copy-cmd')" class="btn btn-primary">{{ copiedCmd ? '✅ ' + trans.copied : '📋 ' + trans.copy }}</button> <button @click="$emit('open-edit-from-copy')" class="btn btn-blue">✏️ {{ trans.edit }}</button>
        </div>
        <button @click="$emit('close')" class="btn">{{ trans.cancel }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import HelpTooltip from '../../../components/HelpTooltip.vue'

const props = defineProps({
  trans: { type: Object, required: true },
  show: { type: Boolean, default: false },
  currentServerName: { type: String, default: '' },
  targetOs: { type: String, default: 'linux' },
  installGhProxy: { type: String, default: '' },
  collectInterval: { type: [Number, String], default: 0 },
  reportInterval: { type: [Number, String], default: 60 },
  wssReportInterval: { type: [Number, String], default: 2 },
  connectionMode: { type: String, default: 'auto' },
  customCt: { type: String, default: '' },
  customCu: { type: String, default: '' },
  customCm: { type: String, default: '' },
  customBd: { type: String, default: '' },
  networkInterface: { type: String, default: '' },
  resetDay: { type: [Number, String], default: 1 },
  rxCorrection: { type: [Number, String], default: '' },
  txCorrection: { type: [Number, String], default: '' },
  autoUpdate: { type: Boolean, default: false },
  installCommand: { type: String, default: '' },
  copiedCmd: { type: Boolean, default: false }
})

const emit = defineEmits([
  'close',
  'copy-cmd',
  'open-edit-from-copy',
  'update:target-os',
  'update:install-gh-proxy'
])

const CUSTOM_GH_PROXY_VALUE = '__custom__'
const ghProxyOptions = [
  { value: '', label: props.trans.ghProxyPlaceholder || 'Direct' },
  { value: 'https://ghfast.top/', label: 'https://ghfast.top/' },
  { value: 'https://ghproxy.net/', label: 'https://ghproxy.net/' },
  { value: 'https://gh.llkk.cc/', label: 'https://gh.llkk.cc/' },
  { value: 'https://gh-proxy.com/', label: 'https://gh-proxy.com/' }
]

const manualCustomGhProxy = ref(false)
const isKnownGhProxy = (value) => ghProxyOptions.some(option => option.value === String(value || '').trim())

const selectedGhProxy = computed({
  get: () => {
    const currentProxy = String(props.installGhProxy || '').trim()
    if (manualCustomGhProxy.value || (!isKnownGhProxy(currentProxy) && currentProxy)) {
      return CUSTOM_GH_PROXY_VALUE
    }
    return currentProxy
  },
  set: (value) => {
    if (value === CUSTOM_GH_PROXY_VALUE) {
      manualCustomGhProxy.value = true
      if (isKnownGhProxy(props.installGhProxy)) {
        emit('update:install-gh-proxy', '')
      }
      return
    }
    manualCustomGhProxy.value = false
    emit('update:install-gh-proxy', value)
  }
})

const showCustomGhProxy = computed(() => selectedGhProxy.value === CUSTOM_GH_PROXY_VALUE)

watch(
  () => props.show,
  (show) => {
    if (show && isKnownGhProxy(props.installGhProxy)) {
      manualCustomGhProxy.value = false
    }
  }
)

const isBlank = (value) => value === '' || value === null || value === undefined
const formatWithUnit = (value, unit) => (isBlank(value) ? '-' : `${value} ${unit}`)
</script>
