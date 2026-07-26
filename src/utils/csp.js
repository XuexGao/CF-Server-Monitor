const TURNSTILE_DOMAIN = 'https://challenges.cloudflare.com';
const INSIGHTS_DOMAIN = 'https://static.cloudflareinsights.com';
const FONTS_API_DOMAIN = 'https://fonts.googleapis.com';
const FONTS_STATIC_DOMAIN = 'https://fonts.gstatic.com';
const RAW_GITHUB_DOMAIN = 'https://raw.githubusercontent.com';
const DEFAULT_CONNECT_DOMAINS = [
  'https://api.iconify.design',
  'https://api.unisvg.com',
  'https://api.simplesvg.com',
  'https://api.frankfurter.app',
  'https://api.frankfurter.dev',
  'https://open.er-api.com',
  'https://api.ip.sb',
  'https://ipwho.is',
  'https://api.ipapi.is',
  'https://ipapi.co',
  'https://api.vore.top'
];

const CSP_META_TAG_RE_GLOBAL = /<meta\b(?=[^>]*http-equiv=["']Content-Security-Policy["'])[^>]*>\s*/gi;

export function stripCspMeta(html) {
  return html.replace(CSP_META_TAG_RE_GLOBAL, '');
}

function uniqueSources(sources) {
  return [...new Set(sources.filter(Boolean))];
}

function buildDirective(name, sources) {
  return `${name} ${uniqueSources(sources).join(' ')}`;
}

export function normalizeCspOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw || /[\s;"']/.test(raw)) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return '';
    if (url.username || url.password || url.search || url.hash) return '';
    if (url.pathname && url.pathname !== '/') return '';
    return url.origin;
  } catch (_) {
    return '';
  }
}

export function parseCspOrigins(value) {
  return [...new Set(String(value || '')
    .split(',')
    .map(normalizeCspOrigin)
    .filter(Boolean))];
}

export function buildApiDomainsWithWs(rawApiDomains) {
  const domains = [];
  for (const domain of [...new Set(rawApiDomains)]) {
    domains.push(domain);
    if (domain.startsWith('https://')) {
      domains.push(domain.replace('https://', 'wss://'));
    }
  }
  return domains;
}

export function buildCspHeader({ staticDomains = [], apiDomains = [] } = {}) {
  return [
    buildDirective('default-src', ["'self'"]),
    buildDirective('script-src', ["'self'", "'unsafe-inline'", TURNSTILE_DOMAIN, INSIGHTS_DOMAIN, ...staticDomains]),
    buildDirective('style-src', ["'self'", "'unsafe-inline'", TURNSTILE_DOMAIN, FONTS_API_DOMAIN, ...staticDomains]),
    buildDirective('img-src', ["'self'", TURNSTILE_DOMAIN, RAW_GITHUB_DOMAIN, ...staticDomains, 'data:']),
    buildDirective('font-src', ["'self'", TURNSTILE_DOMAIN, FONTS_STATIC_DOMAIN, ...staticDomains]),
    buildDirective('connect-src', ["'self'", TURNSTILE_DOMAIN, INSIGHTS_DOMAIN, ...DEFAULT_CONNECT_DOMAINS, ...apiDomains]),
    buildDirective('frame-src', [TURNSTILE_DOMAIN]),
    buildDirective('frame-ancestors', ["'none'"]),
    buildDirective('form-action', ["'self'"]),
    buildDirective('object-src', ["'none'"]),
    buildDirective('base-uri', ["'self'"])
  ].join(';');
}

export function injectTitle(html, title) {
  if (!title) return html;
  return html.replace(/<title>.*?<\/title>/, `<title>${String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</title>`);
}

export function injectApiBase(html, apiBases) {
  if (!apiBases || apiBases.length === 0) return html;
  const content = Array.isArray(apiBases) ? apiBases.join(',') : String(apiBases);
  return html.replace(
    /<meta name="apiBase" content="[^"]*">/,
    `<meta name="apiBase" content="${content.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`
  );
}

export function buildBackgroundStyle(url) {
  if (!url) return '';
  const safe = String(url).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
  return `<style>body{background-image:url('${safe}') !important;background-size:cover !important;background-attachment:fixed !important;background-position:center !important;}</style>`;
}
