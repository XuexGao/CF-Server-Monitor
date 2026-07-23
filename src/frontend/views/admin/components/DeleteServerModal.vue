<template>
  <div id="deleteModal" class="modal-overlay" :class="{ active: show }">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title">{{ currentServerName }}</div>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <input type="hidden" :value="deleteServerId">

      <div class="mb-4">
        <div class="flex-center-gap-sm mb-3">
          <span class="danger-icon text-xl">⚠️</span>
          <span class="danger-label">{{ trans.dangerWarning }}</span>
        </div>
        <p class="text-secondary text-sm line-height-1-6">
          {{ trans.deleteConfirm }}
          <br><br>
          <strong class="text-primary">{{ trans.recommendUninstall }}：</strong>
        </p>
      </div>

      <div class="form-group mb-3">
        <label class="form-label">{{ trans.targetOs }}</label>
        <select :value="deleteTargetOs" class="form-select" @change="$emit('update:delete-target-os', $event.target.value)">
          <option value="linux">Linux (Ubuntu/Debian/CentOS)</option>
          <option value="alpine">Alpine Linux</option>
          <option value="openwrt">OpenWrt / LEDE / ImmortalWrt</option>
          <option value="mac">macOS (Intel / Apple Silicon)</option>
          <option value="synology">Synology DSM (群晖)</option>
          <option value="windows">Windows</option>
        </select>
      </div>

      <div class="cmd-input-wrapper mb-3" :class="{ copied: uninstallCopied }">
        <span class="cmd-prompt">{{ deleteTargetOs === 'windows' ? 'PS' : '$' }}</span>
        <input type="text" readonly :value="uninstallCommand" class="cmd-input flex-1">
        <button @click="$emit('copy-uninstall')" class="btn btn-icon btn-green ml-2" :title="trans.copy">{{ uninstallCopied ? '✅' : '📋' }}</button>
      </div>

      <p class="text-muted mb-4">
        <span class="warning-icon">[i]</span> {{ trans.clickToCopyCmd }}
      </p>

      <div class="modal-footer flex-justify-between">
        <button @click="$emit('confirm-delete')" class="btn btn-red">{{ trans.confirmDelete }}</button>
        <button @click="$emit('close')" class="btn">{{ trans.cancelAction }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  trans: { type: Object, required: true },
  show: { type: Boolean, default: false },
  deleteServerId: { type: [String, Number], default: '' },
  currentServerName: { type: String, default: '' },
  deleteTargetOs: { type: String, default: 'linux' },
  uninstallCommand: { type: String, default: '' },
  uninstallCopied: { type: Boolean, default: false }
})

defineEmits(['close', 'confirm-delete', 'copy-uninstall', 'update:delete-target-os'])
</script>
