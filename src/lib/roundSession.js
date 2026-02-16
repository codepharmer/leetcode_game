const ROUND_SESSION_STORAGE_KEY = "lc-pattern-round-session-v1";
export const ROUND_SESSION_SCHEMA_VERSION = 2;

function canUseLocalStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

function parseStoredRound(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...parsed,
      savedAt: Number(parsed.savedAt) || 0,
      schemaVersion: Number(parsed.schemaVersion) || 1,
    };
  } catch (error) {
    return null;
  }
}

function loadFromStorage(storage) {
  if (!storage) return null;
  return parseStoredRound(storage.getItem(ROUND_SESSION_STORAGE_KEY));
}

export function loadRoundSession() {
  if (canUseLocalStorage()) {
    const local = loadFromStorage(window.localStorage);
    if (local) return local;
  }

  if (canUseSessionStorage()) {
    const session = loadFromStorage(window.sessionStorage);
    if (session) return session;
  }

  return null;
}

export function loadRoundSessionForGameType(gameType) {
  const round = loadRoundSession();
  const keyPrefix = String(gameType || "");

  if (!round || round.gameType !== gameType) {
    return { key: `${keyPrefix}:none`, state: null };
  }

  const timestamp = Number(round.savedAt || 0);
  return {
    key: `${keyPrefix}:${timestamp}`,
    state: round,
  };
}

export function saveRoundSession(payload) {
  const withMeta = {
    ...(payload || {}),
    savedAt: Date.now(),
    schemaVersion: ROUND_SESSION_SCHEMA_VERSION,
  };
  const encoded = JSON.stringify(withMeta);

  if (canUseLocalStorage()) window.localStorage.setItem(ROUND_SESSION_STORAGE_KEY, encoded);
  if (canUseSessionStorage()) window.sessionStorage.setItem(ROUND_SESSION_STORAGE_KEY, encoded);
}

export function clearRoundSession() {
  if (canUseLocalStorage()) window.localStorage.removeItem(ROUND_SESSION_STORAGE_KEY);
  if (canUseSessionStorage()) window.sessionStorage.removeItem(ROUND_SESSION_STORAGE_KEY);
}
