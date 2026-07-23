const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/huilang-me/CF-Server-Monitor/refs/heads/main/version.json';
const REMOTE_VERSION_TTL = 5 * 60 * 1000;
const REMOTE_VERSION_FAILURE_TTL = 30 * 1000;

let cachedRemoteVersion = null;
let cachedRemoteVersionAt = 0;
let cachedRemoteVersionFailureAt = 0;
let remoteVersionPromise = null;

export async function getRemoteVersion() {
  const now = Date.now();
  if (cachedRemoteVersion && now - cachedRemoteVersionAt < REMOTE_VERSION_TTL) {
    return cachedRemoteVersion;
  }
  if (cachedRemoteVersionFailureAt && now - cachedRemoteVersionFailureAt < REMOTE_VERSION_FAILURE_TTL) {
    return cachedRemoteVersion;
  }
  if (remoteVersionPromise) {
    return remoteVersionPromise;
  }

  remoteVersionPromise = fetchRemoteVersion(now).finally(() => {
    remoteVersionPromise = null;
  });

  return remoteVersionPromise;
}

async function fetchRemoteVersion(now) {
  try {
    const response = await fetch(REMOTE_VERSION_URL, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      cachedRemoteVersionFailureAt = Date.now();
      return cachedRemoteVersion;
    }

    const data = await response.json();
    cachedRemoteVersion = {
      workers: typeof data.workers === 'string' ? data.workers : '',
      agent: typeof data.agent === 'string' ? data.agent : ''
    };
    cachedRemoteVersionAt = now;
    cachedRemoteVersionFailureAt = 0;
    return cachedRemoteVersion;
  } catch (_) {
    cachedRemoteVersionFailureAt = Date.now();
    return cachedRemoteVersion;
  }
}
