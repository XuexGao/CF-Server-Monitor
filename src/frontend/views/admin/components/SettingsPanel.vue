<template>
  <div id="tab-settings" class="tab-content" :class="{ active: activeTab === 'settings' }">
    <div class="settings-grid">
      <div class="settings-section" v-if="currentOrigin === selectedApiBase">
        <div class="section-title"><span>▸</span> {{ trans.appearance }}</div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.siteTitle }}</label>
            <input type="text" v-model="settings.site_title" class="form-input" :placeholder="'Cloudflare Server Monitor'">
          </div>

          <div class="form-group  ">
            <label class="form-label">{{ trans.bgImage }}</label>
            <div class="flex" style="gap:8px;">
              <input type="text" v-model="settings.custom_bg" class="form-input flex-1" placeholder="https://...">
              <div class="upload-btn-wrapper">
                <button class="btn btn-margin-0">📁 {{ trans.upload }}</button>
                <input type="file" accept="image/*" @change="$emit('upload-bg', $event)">
              </div>
            </div>
            <img v-if="settings.custom_bg" :src="settings.custom_bg" class="bg-preview">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.displayMode }}</label>
            <select v-model="settings.display_mode" class="form-select">
              <option value="bar">{{ trans.displayModeBar }}</option>
              <option value="ring">{{ trans.displayModeRing }}</option>
              <option value="table">{{ trans.displayModeTable }}</option>
            </select>
            <p class="text-muted text-sm mt-1"><span class="warning-icon">[i]</span> {{ trans.displayModeTip }}</p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.customHead }}</label>
            <textarea v-model="settings.custom_head" class="form-textarea" rows="3" placeholder="<link rel='stylesheet' href='...'">
            </textarea>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.customScript }}</label>
            <textarea v-model="settings.custom_script" class="form-textarea" rows="4" placeholder="console.log('Hello');">
            </textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.themeOptions }}</label>
            <textarea v-model="settings.theme_options" class="form-textarea" rows="5" placeholder='{"a":1,"b":2}'></textarea>
            <p class="text-muted text-sm mt-1">{{ trans.themeOptionsTip }}</p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.cspStatic }}</label>
            <input type="text" v-model="settings.csp_static" class="form-input" placeholder="https://unpkg.com,https://cdn.jsdelivr.net" @blur="validateCspField('csp_static')">
            <p class="text-muted text-sm mt-1">{{ trans.cspStaticTip }}</p>
            <p v-if="cspErrors.csp_static" class="text-danger text-sm">{{ cspErrors.csp_static }}</p>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.cspApi }}</label>
            <input type="text" v-model="settings.csp_api" class="form-input" placeholder="https://api.example.com" @blur="validateCspField('csp_api')">
            <p class="text-muted text-sm mt-1">{{ trans.cspApiTip }}</p>
            <p v-if="cspErrors.csp_api" class="text-danger text-sm">{{ cspErrors.csp_api }}</p>
          </div>
        </div>

        <p class="text-muted text-sm mt-2">
          <span class="warning-icon">[i]</span>
          {{ trans.cspWarning }}
        </p>
      </div>

      <div class="settings-section">
        <div class="section-title"><span>▸</span> {{ trans.displayOptions }}</div>

        <div class="form-row">
          <div class="form-group flex-1 checkbox-item">
            <input type="checkbox" id="cfg_is_public" v-model="settings.is_public">
            <label><b>{{ trans.publicAccess }}</b></label>
          </div>

          <div class="form-group flex-1 checkbox-item">
            <input type="checkbox" id="cfg_show_price" v-model="settings.show_price">
            <label>{{ trans.showPrice }}</label>
          </div>

          <div class="form-group flex-1 checkbox-item">
            <input type="checkbox" id="cfg_show_expire" v-model="settings.show_expire">
            <label>{{ trans.showExpire }}</label>
          </div>
        </div>


        <div class="form-row">
          <div class="form-group flex-1 checkbox-item">
            <input type="checkbox" id="cfg_show_tf" v-model="settings.show_tf">
            <label>{{ trans.showTf }}</label>
          </div>

          <div class="form-group flex-1 checkbox-item">
            <input type="checkbox" id="cfg_show_time" v-model="settings.show_time">
            <label>{{ trans.showTime }}</label>
          </div>
        </div>

        <div class="form-group checkbox-item">
          <input type="checkbox" id="cfg_show_long_history" v-model="settings.show_long_history">
          <label>{{ trans.showLongHistory }} <span class="text-muted text-sm">{{ trans.showLongHistoryTip }}</span></label>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title"><span>▸</span> {{ trans.notifications }}</div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.offlineAlert }}</label>
            <select v-model="settings.tg_notify" class="form-select">
              <option value="false">[OFF] {{ trans.disabled }}</option>
              <option value="true">[ON] {{ trans.notifyOffline }}</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.expireReminder }}</label>
            <select v-model="settings.expire_reminder" class="form-select">
              <option value="false">[OFF] {{ trans.disabled }}</option>
              <option value="true">[ON] {{ trans.notifyExpire }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.telegramToken }}</label>
            <div class="password-input-wrapper">
              <input type="text" name="tg_bot_token" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other" v-model="settings.tg_bot_token" :class="['form-input', { 'secret-input-masked': !passwordVisible.tgBotToken }]" placeholder="Bot Token or Webhook URL">
              <button type="button" class="password-toggle" @click="$emit('toggle-password', 'tgBotToken')">
                {{ passwordVisible.tgBotToken ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.chatId }}</label>
            <div class="password-input-wrapper">
              <input type="text" name="tg_chat_id" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other" v-model="settings.tg_chat_id" :class="['form-input', { 'secret-input-masked': !passwordVisible.tgChatId }]" placeholder="Optional Chat ID">
              <button type="button" class="password-toggle" @click="$emit('toggle-password', 'tgChatId')">
                {{ passwordVisible.tgChatId ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <button type="button" @click="$emit('send-test-notification')" class="btn btn-primary" :disabled="testNotificationLoading">{{ testNotificationLoading ? '⏳' : '📨' }} {{ trans.sendTestNotification }}</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title"><span>▸</span> {{ trans.securitySettings }}</div>

        <div class="form-row">
          <div class="form-group flex-1">
            <div class="checkbox-item">
              <input type="checkbox" id="cfg_turnstile_enabled" v-model="settings.turnstile_enabled">
              <label><b>{{ trans.enableTurnstile }}</b></label>
            </div>
            </div>
          <div class="form-group flex-1">
            <div class="checkbox-item">
              <input type="checkbox" id="cfg_turnstile_login_enabled" v-model="settings.turnstile_login_enabled">
              <label>{{ trans.enableTurnstileLogin }}</label>
            </div>
            <p class="text-muted text-sm mt-1 mb-3">
              <span class="warning-icon">[i]</span>
              {{ trans.turnstileLoginTip }}
            </p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.turnstileSiteKey }}</label>
            <input type="text" name="turnstile_site_key" autocomplete="off" v-model="settings.turnstile_site_key" class="form-input" :placeholder="trans.turnstileSiteKeyPlaceholder">
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.turnstileSecretKey }}</label>
            <div class="password-input-wrapper">
              <input type="text" name="turnstile_secret_key" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other" v-model="settings.turnstile_secret_key" :class="['form-input', { 'secret-input-masked': !passwordVisible.turnstileSecret }]" :placeholder="trans.turnstileSecretKeyPlaceholder">
              <button type="button" class="password-toggle" @click="$emit('toggle-password', 'turnstileSecret')">
                {{ passwordVisible.turnstileSecret ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
        </div>

        <p class="text-muted text-sm mt-2">
          <span class="warning-icon">[i]</span>
          {{ trans.turnstileTip }}
        </p>

        <div class="form-group mt-4">
          <label class="form-label">{{ trans.jwtSecret }}</label>
          <div class="password-input-wrapper">
            <input type="text" name="jwt_secret" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other" v-model="settings.jwt_secret" :class="['form-input', { 'secret-input-masked': !passwordVisible.jwtSecret }]" :placeholder="trans.jwtSecretPlaceholder">
            <button type="button" class="password-toggle" @click="$emit('toggle-password', 'jwtSecret')">
              {{ passwordVisible.jwtSecret ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <p class="text-muted text-sm mt-2">
          <span class="warning-icon">[i]</span>
          {{ trans.jwtSecretTip }}
        </p>
      </div>

      <div class="settings-section">
        <div class="section-title"><span>▸</span> {{ trans.cloudflareSettings }}</div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.cloudflareAccountId }}</label>
            <input type="text" name="cloudflare_account_id" autocomplete="off" v-model="settings.cloudflare_account_id" class="form-input" :placeholder="trans.cloudflareAccountIdPlaceholder">
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Cloudflare API Token</label>
            <div class="password-input-wrapper">
              <input type="text" name="cloudflare_token" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other" v-model="settings.cloudflare_token" :class="['form-input', { 'secret-input-masked': !passwordVisible.cloudflareToken }]" :placeholder="trans.cloudflareTokenPlaceholder">
              <button type="button" class="password-toggle" @click="$emit('toggle-password', 'cloudflareToken')">
                {{ passwordVisible.cloudflareToken ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group  flex-1">
            <button type="button" @click="$emit('query-d1-usage')" class="btn btn-primary btn-lg" :disabled="d1UsageLoading">{{ d1UsageLoading ? '⏳' : '🔍' }} {{ trans.queryD1Quota }}</button>
          </div>
          <div class="form-group  flex-1">
            <p class="text-muted text-sm mt-2">
              <span class="warning-icon">[i]</span>
              {{ trans.cloudflareTokenTip }}
            </p>
          </div>
        </div>

      </div>

      <div class="settings-section">
        <div class="section-title"><span>▸</span> {{ trans.adminLoginSettings }}</div>

        <div class="form-group">
          <label class="form-label">{{ trans.username }}</label>
          <input
            type="text"
            name="settings_admin_user"
            autocomplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            v-model="settings.username"
            class="form-input"
            :placeholder="trans.usernamePlaceholder"
          >
        </div>

        <button type="button" class="btn btn-sm mb-3" @click="$emit('toggle-admin-password-change')">
          {{ changeAdminPassword ? trans.cancelPasswordChange : trans.changePassword }}
        </button>

        <div v-if="changeAdminPassword" class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.password }}</label>
            <div class="password-input-wrapper">
              <input
                :type="passwordVisible.password ? 'text' : 'password'"
                name="settings_admin_passphrase"
                autocomplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                v-model="settings.password"
                class="form-input"
                placeholder="••••••••"
              >
              <button type="button" class="password-toggle" @click="$emit('toggle-password', 'password')">
                {{ passwordVisible.password ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.confirmPassword }}</label>
            <div class="password-input-wrapper">
              <input
                :type="passwordVisible.confirmPassword ? 'text' : 'password'"
                name="settings_admin_passphrase_confirm"
                autocomplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                v-model="settings.confirm_password"
                class="form-input"
                placeholder="••••••••"
              >
              <button type="button" class="password-toggle" @click="$emit('toggle-password', 'confirmPassword')">
                {{ passwordVisible.confirmPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
        </div>

        <p class="text-muted text-sm mt-2">
          <span class="warning-icon">[i]</span>
          {{ trans.apiSecretTip }}
        </p>
      </div>

      <div class="settings-section">
        <div class="section-title"><span>▸</span> {{ trans.pingNodes }}</div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.customCt }}</label>
            <input type="text" v-model.trim="settings.custom_ct" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_ct }]" placeholder="gd-ct-dualstack.ip.zstaticcdn.com">
            <p v-if="pingNodeErrors.custom_ct" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_ct }}</p>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.customCu }}</label>
            <input type="text" v-model.trim="settings.custom_cu" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_cu }]" placeholder="gd-cu-dualstack.ip.zstaticcdn.com">
            <p v-if="pingNodeErrors.custom_cu" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_cu }}</p>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">{{ trans.customCm }}</label>
            <input type="text" v-model.trim="settings.custom_cm" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_cm }]" placeholder="gd-cm-dualstack.ip.zstaticcdn.com">
            <p v-if="pingNodeErrors.custom_cm" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_cm }}</p>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">{{ trans.customBd }}</label>
            <input type="text" v-model.trim="settings.custom_bd" :class="['form-input', { 'input-invalid': pingNodeErrors.custom_bd }]" placeholder="lf3-ips.zstaticcdn.com">
            <p v-if="pingNodeErrors.custom_bd" class="text-red text-sm mt-1">{{ pingNodeErrors.custom_bd }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="text-right mt-5">
      <button @click="$emit('save-settings')" class="btn btn-primary btn-lg" :disabled="saving || hasPingNodeErrors">{{ saving ? '⏳' : '💾' }} {{ saving ? trans.saving : trans.saveConfig }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { PING_NODE_FIELDS, validatePingNode } from '../../../utils/pingNode.js'

const props = defineProps({
  trans: { type: Object, required: true },
  settings: { type: Object, required: true },
  passwordVisible: { type: Object, required: true },
  activeTab: { type: String, default: 'settings' },
  selectedApiBase: { type: String, default: '' },
  currentOrigin: { type: String, default: '' },
  saving: { type: Boolean, default: false },
  changeAdminPassword: { type: Boolean, default: false },
  testNotificationLoading: { type: Boolean, default: false },
  d1UsageLoading: { type: Boolean, default: false }
})

defineEmits([
  'toggle-password', 'toggle-admin-password-change',
  'save-settings', 'upload-bg',
  'send-test-notification', 'query-d1-usage'
])

const cspErrors = reactive({
  csp_static: '',
  csp_api: ''
})

const pingNodeErrorMessage = computed(() => (
  props.trans.invalidPingNodeFormat || 'Use domain, IPv4, or host:port. Port must be 1-65535.'
))

const pingNodeErrors = computed(() => Object.fromEntries(
  PING_NODE_FIELDS.map(field => [
    field,
    validatePingNode(props.settings[field]).valid ? '' : pingNodeErrorMessage.value
  ])
))

const hasPingNodeErrors = computed(() => Object.values(pingNodeErrors.value).some(Boolean))

const validatePingNodes = () => !hasPingNodeErrors.value

const isValidCspOrigin = (value) => {
  const raw = String(value || '').trim()
  if (!raw || /[\s;"']/.test(raw)) return false
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return false
    if (url.username || url.password || url.search || url.hash) return false
    if (url.pathname && url.pathname !== '/') return false
    return true
  } catch (_) {
    return false
  }
}

const validateCspField = (field) => {
  const value = props.settings[field] || ''
  if (!value) {
    cspErrors[field] = ''
    return true
  }
  const domains = value.split(',').map(s => s.trim()).filter(Boolean)
  for (const domain of domains) {
    if (!isValidCspOrigin(domain)) {
      cspErrors[field] = props.trans.cspInvalidDomain || 'Each domain must start with https://'
      return false
    }
  }
  cspErrors[field] = ''
  return true
}

defineExpose({ validateCspField, cspErrors, validatePingNodes, pingNodeErrors })
</script>
