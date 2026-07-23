import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from 'vite-plugin-mkcert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseCspOrigins, buildApiDomainsWithWs, rebuildCsp, buildBackgroundStyle, injectTitle, injectApiBase } from './src/utils/csp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '.env')
  const env = {}
  if (!fs.existsSync(envPath)) return env
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function envPlugin() {
  const env = loadEnvFile()
  const apiBaseRaw = env.API_BASE || ''
  const cspStaticRaw = env.CSP_STATIC || ''
  const cspApiRaw = env.CSP_API || ''
  const backgroundImage = env.BACKGROUND_IMAGE || ''
  const title = env.TITLE || ''

  // API_BASE 与 CSP_API 合并，作为 connect-src 白名单（含 wss）
  const rawApiDomains = [
    ...parseCspOrigins(apiBaseRaw),
    ...parseCspOrigins(cspApiRaw)
  ]
  const apiDomains = buildApiDomainsWithWs(rawApiDomains)
  const staticDomains = parseCspOrigins(cspStaticRaw)

  return {
    name: 'env-inject',
    transformIndexHtml(html) {
      html = injectTitle(html, title)
      html = injectApiBase(html, rawApiDomains)
      if (staticDomains.length > 0 || apiDomains.length > 0) {
        html = rebuildCsp(html, { staticDomains, apiDomains })
      }
      if (backgroundImage) {
        const bgStyle = buildBackgroundStyle(backgroundImage)
        html = html.replace('</head>', `${bgStyle}\n</head>`)
      }
      return html
    }
  }
}

export default defineConfig({
  plugins: [vue(), mkcert(), envPlugin()],
  base: process.env.VITE_BASE || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/frontend')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    https: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
})
