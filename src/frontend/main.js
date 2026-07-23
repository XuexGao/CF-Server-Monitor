import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import './styles/light.css'
import { currentLang, translations } from './utils/i18n'
import { http } from './utils/http'
import { initConfig, hasMultipleApiBases } from './utils/config'
import { LAST_AGENT_VERSION, LAST_WORKERS_VERSION, VERSION } from './utils/api'
import { resolveDisplayMode } from './utils/displayMode'
import {
  clearTurnstileToken,
  fetchAllTurnstileConfigs,
  getTurnstileEnabledSites,
  hasTurnstileSiteKeyMismatch,
  isTurnstileValueEnabled,
  loadTurnstileScript,
  setTurnstileToken
} from './utils/turnstile'

const getTranslation = () => {
  const lang = localStorage.getItem('language_preference') || 'zh'
  return translations[lang] || translations.en
}

const trans = () => getTranslation()

async function fetchConfig() {
  try {
    const result = await http.get('/api/config', { includeAuth: true, includeTurnstile: true })
    if (result.error) {
      return {
        turnstile_enabled: false,
        turnstile_login_enabled: false,
        turnstile_site_key: '',
        display_mode: 'bar',
        version: '',
        last_workers_version: '',
        last_agent_version: '',
        verified: false
      }
    }

    const data = result.data
    if (!data) {
      return {
        turnstile_enabled: false,
        turnstile_login_enabled: false,
        turnstile_site_key: '',
        display_mode: 'bar',
        version: '',
        last_workers_version: '',
        last_agent_version: '',
        verified: false
      }
    }

    const turnstileEnabled = isTurnstileValueEnabled(data.turnstile_enabled)
    const turnstileLoginEnabled = isTurnstileValueEnabled(data.turnstile_login_enabled)
    const turnstileSiteKey = data.turnstile_site_key || ''
    const version = data.version || ''
    const lastWorkersVersion = data.last_workers_version || ''
    const lastAgentVersion = data.last_agent_version || ''
    const verified = data.verified === true
    const isPublic = data.is_public !== false
    const authorization = data.authorization === true
    const siteTitle = data.site_title || ''
    const displayMode = resolveDisplayMode(data)

    if (version) {
      VERSION.value = version
    }
    LAST_WORKERS_VERSION.value = lastWorkersVersion
    LAST_AGENT_VERSION.value = lastAgentVersion

    return {
      turnstile_enabled: turnstileEnabled,
      turnstile_login_enabled: turnstileLoginEnabled,
      turnstile_site_key: turnstileSiteKey,
      version,
      last_workers_version: lastWorkersVersion,
      last_agent_version: lastAgentVersion,
      verified,
      is_public: isPublic,
      authorization,
      site_title: siteTitle,
      display_mode: displayMode
    }
  } catch (e) {
    console.error('Failed to fetch config:', e)
  }
  return {
    turnstile_enabled: false,
    turnstile_login_enabled: false,
    turnstile_site_key: '',
    display_mode: 'bar',
    version: '',
    last_workers_version: '',
    last_agent_version: '',
    verified: false
  }
}

async function verifyTurnstileByIndex(siteKey, apiIndex = 0) {
  return new Promise((resolve) => {
    window.turnstile.render('#turnstile-container', {
      sitekey: siteKey,
      callback: async (token) => {
        setTurnstileToken(token)
        try {
          const result = await http.getByIndex('/api/config', apiIndex, { includeAuth: false, includeTurnstile: true, autoRedirect: false })
          if (!result.error) {
            resolve(result.data && result.data.verified === true)
          } else {
            resolve(false)
          }
        } catch (e) {
          console.error('Failed to verify token:', e)
          resolve(false)
        }
      },
      errorCallback: (error) => {
        console.error('Turnstile error:', error)
        resolve(false)
      },
      expiredCallback: () => {
        clearTurnstileToken()
        resolve(false)
      }
    })
  })
}

const getPrivateAccessState = (results) => {
  const privateSites = results.filter(result => !result.error && result.data && result.data.is_public === false)
  return {
    hasPrivateSite: privateSites.length > 0,
    hasUnauthorizedPrivateSite: privateSites.some(result => result.data.authorization !== true)
  }
}

const showTurnstileError = (title, desc) => {
  const loading = document.getElementById('loading')
  if (loading) {
    loading.innerHTML = `
      <div class="loading-content">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <div class="loading-text" style="color: #f85149;">${title}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 12px; max-width: 480px; text-align: center; line-height: 1.6;">${desc}</div>
      </div>
    `
  }
}

const showTurnstileUnsupported = () => {
  showTurnstileError(trans().turnstileNotSupported, trans().turnstileNotSupportedDesc)
}

const showTurnstileSiteKeyMismatch = () => {
  showTurnstileError(trans().turnstileSiteKeyMismatch, trans().turnstileSiteKeyMismatchDesc)
}

const renderStartupTurnstile = async (siteKey, apiIndex) => {
  const loading = document.getElementById('loading')
  if (loading) {
    loading.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">$ Verifying...</div>
        <div id="turnstile-container" style="margin-top: 20px;"></div>
      </div>
    `
  }

  try {
    await loadTurnstileScript()
    const verified = await verifyTurnstileByIndex(siteKey, apiIndex)

    if (!verified) {
      if (loading) {
        loading.innerHTML = `
          <div class="loading-content">
            <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
            <div class="loading-text" style="color: #f85149;">${trans().verificationFailed}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">${trans().refreshToRetry}</div>
          </div>
        `
      }
      return false
    }
    return true
  } catch (e) {
    console.error('Turnstile error:', e)
    if (loading) {
      loading.innerHTML = `
        <div class="loading-content">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div class="loading-text" style="color: #f85149;">${trans().verificationError}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">${trans().refreshToRetry}</div>
        </div>
      `
    }
    return false
  }
}

async function initApp() {
  // Load frontend runtime config (apiBase) first so all subsequent
  // HTTP / WebSocket requests go through the configured origin.
  await initConfig()

  const isMultipleMode = hasMultipleApiBases()
  const currentHash = window.location.hash
  const isAdmin = currentHash.startsWith('#/admin')

  // 多站模式公开页面：一次 getAll 获取所有站点配置，检查 Turnstile key 是否可共享。
  let config
  if (isMultipleMode && !isAdmin) {
    try {
      const results = await fetchAllTurnstileConfigs()
      const enabledTurnstileSites = getTurnstileEnabledSites(results, 'global')
      const first = results.find(r => !r.error && r.data)
      const sharedTurnstileSite = enabledTurnstileSites[0] || null
      const privateAccess = getPrivateAccessState(results)
      if (!privateAccess.hasPrivateSite && hasTurnstileSiteKeyMismatch(enabledTurnstileSites)) {
        showTurnstileSiteKeyMismatch()
        return
      }
      config = first ? {
        turnstile_enabled: isTurnstileValueEnabled(first.data.turnstile_enabled),
        turnstile_login_enabled: isTurnstileValueEnabled(first.data.turnstile_login_enabled),
        turnstile_site_key: sharedTurnstileSite?.siteKey || first.data.turnstile_site_key || '',
        turnstile_api_index: sharedTurnstileSite?.index || 0,
        version: first.data.version || '',
        last_workers_version: first.data.last_workers_version || '',
        last_agent_version: first.data.last_agent_version || '',
        verified: sharedTurnstileSite ? enabledTurnstileSites.every(site => site.verified) : first.data.verified === true,
        is_public: !privateAccess.hasPrivateSite,
        authorization: !privateAccess.hasUnauthorizedPrivateSite,
        site_title: first.data.site_title || '',
        display_mode: resolveDisplayMode(first.data)
      } : { turnstile_enabled: false, turnstile_login_enabled: false, turnstile_site_key: '', turnstile_api_index: 0, version: '', last_workers_version: '', last_agent_version: '', verified: false, is_public: true, authorization: false, site_title: '', display_mode: 'bar' }
      if (sharedTurnstileSite) {
        config.turnstile_enabled = true
        config.turnstile_site_key = sharedTurnstileSite.siteKey
        config.turnstile_api_index = sharedTurnstileSite.index
      }
      if (config.version) VERSION.value = config.version
      LAST_WORKERS_VERSION.value = config.last_workers_version || ''
      LAST_AGENT_VERSION.value = config.last_agent_version || ''
    } catch (_) {
      config = { turnstile_enabled: false, turnstile_login_enabled: false, turnstile_site_key: '', turnstile_api_index: 0, version: '', last_workers_version: '', last_agent_version: '', verified: false, is_public: true, authorization: false, site_title: '', display_mode: 'bar' }
    }
  } else {
    config = await fetchConfig()
  }

  // 仅全局模式需要在启动时验证 Turnstile；登录模式在 Admin 页面的登录表单中验证
  if (config.turnstile_enabled) {
    if (isMultipleMode) {
      if (!config.verified && config.turnstile_site_key) {
        const verified = await renderStartupTurnstile(config.turnstile_site_key, config.turnstile_api_index || 0)
        if (!verified) return
      }
    } else if (config.turnstile_site_key && !config.verified) {
      const verified = await renderStartupTurnstile(config.turnstile_site_key, 0)
      if (!verified) return
    }
  }

  const app = createApp(App)
  app.provide('appConfig', config || {})
  app.use(router)
  app.mount('#app').$nextTick(() => {
    if (!isAdmin && !config.is_public && !config.authorization) {
      router.push('/admin')
    }
    const loading = document.getElementById('loading')
    if (loading) {
      setTimeout(() => {
        loading.remove()
      }, 1000)
    }
  })
}

initApp()
