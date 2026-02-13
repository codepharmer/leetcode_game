const ROUND_SESSION_STORAGE_KEY = "lc-pattern-round-session-v1";

function canUseSessionStorage() {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

function parseStoredRound(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

export function loadRoundSession() {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(ROUND_SESSION_STORAGE_KEY);
  return parseStoredRound(raw);
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
  if (!canUseSessionStorage()) return;
  const withMeta = { ...(payload || {}), savedAt: Date.now() };
  window.sessionStorage.setItem(ROUND_SESSION_STORAGE_KEY, JSON.stringify(withMeta));
}

export function clearRoundSession() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(ROUND_SESSION_STORAGE_KEY);
}
