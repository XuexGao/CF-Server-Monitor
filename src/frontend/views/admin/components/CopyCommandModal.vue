<template>
  <div id="copyModal" class="modal-overlay" :class="{ active: show }">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title">{{ currentServerName }}</div>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">{{ trans.targetOs }}</label>
        <select :value="targetOs" class="form-select" @change="$emit('update:target-os', $event.target.value)">
          <option value="linux">Linux (Ubuntu/Debian/CentOS)</option>
          <option value="alpine">Alpine Linux</option>
          <option value="openwrt">OpenWrt / LEDE / ImmortalWrt</option>
          <option value="mac">macOS (Intel / Apple Silicon)</option>
          <option value="synology">Synology DSM (群晖)</option>
          <option value="windows">Windows</option>
        </select>
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
defineProps({
  trans: { type: Object, required: true },
  show: { type: Boolean, default: false },
  currentServerName: { type: String, default: '' },
  targetOs: { type: String, default: 'linux' },
  collectInterval: { type: [Number, String], default: 0 },
  reportInterval: { type: [Number, String], default: 60 },
  customCt: { type: String, default: '' },
  customCu: { type: String, default: '' },
  customCm: { type: String, default: '' },
  customBd: { type: String, default: '' },
  resetDay: { type: [Number, String], default: 1 },
  rxCorrection: { type: [Number, String], default: '' },
  txCorrection: { type: [Number, String], default: '' },
  autoUpdate: { type: Boolean, default: false },
  installCommand: { type: String, default: '' },
  copiedCmd: { type: Boolean, default: false }
})

defineEmits(['close', 'copy-cmd', 'open-edit-from-copy', 'update:target-os'])

const isBlank = (value) => value === '' || value === null || value === undefined
const formatWithUnit = (value, unit) => (isBlank(value) ? '-' : `${value} ${unit}`)
</script>
