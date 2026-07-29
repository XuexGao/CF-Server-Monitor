const THEMES_URL = 'https://raw.githubusercontent.com/huilang-me/CFSM-Theme-Store/refs/heads/main/themes.json'
const CACHE_TTL = 300
const COMMIT_LIMIT = 10
const SAFE_GITHUB_PART = /^[A-Za-z0-9._-]+$/

let cachedThemeStore = null
let cacheTime = 0

const createEmptyThemeStore = () => ({ schema: 1, themes: [] })

const normalizeGithubRepo = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null
    if (url.username || url.password || url.search || url.hash) return null

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const owner = parts[0]
    const repo = parts[1].replace(/\.git$/i, '')
    if (!SAFE_GITHUB_PART.test(owner) || !SAFE_GITHUB_PART.test(repo)) return null
    if (parts.length > 2 && parts[2] !== 'tree') return null

    return {
      owner,
      repo,
      branch: parts[2] === 'tree' && parts.length === 4 ? parts[3] || '' : '',
      url: `https://github.com/${owner}/${repo}`
    }
  } catch (_) {
    return null
  }
}

const normalizeBranch = (value) => {
  if (typeof value !== 'string') return ''
  const branch = value.trim()
  if (!branch || /[\0\r\n]/.test(branch)) return ''
  return branch
}

const getCommitDate = (commit) => {
  const value = commit?.commit?.author?.date || commit?.commit?.committer?.date || ''
  if (typeof value !== 'string') return ''
  return value.split('T')[0] || ''
}

const getCommitSummary = (commit) => {
  const message = commit?.commit?.message
  if (typeof message !== 'string') return ''
  return message.split('\n')[0].trim()
}

const buildCommitVersion = (repoUrl, commit) => {
  const sha = typeof commit?.sha === 'string' ? commit.sha.trim() : ''
  if (!/^[a-f0-9]{40}$/i.test(sha)) return null

  const releaseDate = getCommitDate(commit)
  const summary = getCommitSummary(commit) || `commit ${sha.slice(0, 7)}`
  const title = releaseDate ? `${summary} to ${releaseDate}` : summary

  return {
    version: sha,
    short_version: sha.slice(0, 7),
    title,
    releaseDate,
    changelog: summary,
    commit_id: sha,
    commitId: sha,
    theme_url: `${repoUrl}/tree/${sha}`
  }
}

const fetchThemeCommitVersions = async (theme) => {
  const repo = normalizeGithubRepo(theme?.url)
  const branch = normalizeBranch(theme?.branch) || normalizeBranch(repo?.branch)
  if (!repo || !branch) return null

  try {
    const apiUrl = new URL(`https://api.github.com/repos/${repo.owner}/${repo.repo}/commits`)
    apiUrl.searchParams.set('sha', branch)
    apiUrl.searchParams.set('per_page', String(COMMIT_LIMIT))

    const res = await fetch(apiUrl.href, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'CFSM-Theme-Store'
      }
    })

    if (!res.ok) return null

    const commits = await res.json()
    if (!Array.isArray(commits)) return null

    const versions = commits
      .map(commit => buildCommitVersion(repo.url, commit))
      .filter(Boolean)

    return versions.length ? versions : null
  } catch (_) {
    return null
  }
}

const normalizeTheme = async (theme) => {
  const normalizedTheme = theme && typeof theme === 'object' && !Array.isArray(theme) ? theme : {}
  const versions = Array.isArray(normalizedTheme.versions) ? normalizedTheme.versions : []
  const commitVersions = await fetchThemeCommitVersions(normalizedTheme)

  return {
    ...normalizedTheme,
    versions: commitVersions || versions
  }
}

const normalizeThemeStore = async (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const themes = Array.isArray(data.themes)
      ? await Promise.all(data.themes.map(normalizeTheme))
      : []

    return {
      ...data,
      schema: data.schema || 1,
      themes
    }
  }

  return createEmptyThemeStore()
}

export async function handleTheme() {
  const now = Math.floor(Date.now() / 1000)
  if (cachedThemeStore && (now - cacheTime) < CACHE_TTL) {
    return cachedThemeStore
  }

  try {
    const res = await fetch(THEMES_URL, {
      headers: { 'User-Agent': 'CFSM-Theme-Store' }
    })

    if (!res.ok) {
      return cachedThemeStore || createEmptyThemeStore()
    }

    const data = await res.json()
    const themeStore = await normalizeThemeStore(data)
    cachedThemeStore = themeStore
    cacheTime = now
    return themeStore
  } catch (e) {
    return cachedThemeStore || createEmptyThemeStore()
  }
}
