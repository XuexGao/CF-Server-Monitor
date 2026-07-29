<template>
  <div class="terminal-header">
    <div class="terminal-dots">
      <span class="terminal-dot red"></span>
      <span class="terminal-dot yellow"></span>
      <span class="terminal-dot green"></span>
    </div>
    <div class="terminal-title">{{ title }}</div>
    <div class="terminal-header-controls">
      <div class="lang-toggle">
        <button 
          class="lang-btn" 
          :class="{ active: currentLang === 'en' }"
          @click="setLang('en')"
          title="English"
        >EN</button>
        <button 
          class="lang-btn" 
          :class="{ active: currentLang === 'zh' }"
          @click="setLang('zh')"
          title="中文"
        >中</button>
      </div>
      <div class="theme-toggle-wrapper">
        <div class="theme-toggle">
          <button 
            class="theme-btn" 
            :class="{ active: currentTheme === 'auto' }"
            @click="setTheme('auto')"
            title="Auto - Follow System"
          >🌙☀</button>
          <button 
            class="theme-btn" 
            :class="{ active: currentTheme === 'dark' }"
            @click="setTheme('dark')"
            title="Dark Mode"
          >🌙</button>
          <button 
            class="theme-btn" 
            :class="{ active: currentTheme === 'light' }"
            @click="setTheme('light')"
            title="Light Mode"
          >☀</button>
        </div>
      </div>
      <a v-if="isAdminPage" href="/#/" class="admin-link-header">⚙ {{ t('dashboard') }}</a>
      <a v-else :href="adminHref" class="admin-link-header">⚙ {{ t('admin') }}</a>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { t, setLanguage, getLanguage } from '../utils/i18n'
import { useTheme } from '../composables/useTheme'
import { DEFAULT_SITE_TITLE } from '../utils/constants'
import { hasMultipleApiBases } from '../utils/config'

defineProps({
  title: {
    type: String,
    default: DEFAULT_SITE_TITLE
  }
})

const { currentTheme, setTheme } = useTheme()
const currentLang = ref('en')
const route = useRoute()
const isAdminPage = ref(route.path === '/admin')
const adminHref = computed(() => hasMultipleApiBases() ? '/#/admin' : '/admin#/admin')

const setLang = (lang) => {
  setLanguage(lang)
  currentLang.value = lang
}

const handleLanguageChange = (e) => {
  currentLang.value = e.detail.lang
}

onMounted(() => {
  currentLang.value = getLanguage()
  window.addEventListener('languageChanged', handleLanguageChange)
})

onUnmounted(() => {
  window.removeEventListener('languageChanged', handleLanguageChange)
})
</script>
