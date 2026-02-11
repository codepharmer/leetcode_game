import { DEFAULT_STATS, GAME_TYPES } from "./constants";

const PROGRESS_VERSION = 2;

function cloneStats(stats = DEFAULT_STATS) {
  return {
    gamesPlayed: Math.max(0, Number(stats?.gamesPlayed || 0)),
    totalCorrect: Math.max(0, Number(stats?.totalCorrect || 0)),
    totalAnswered: Math.max(0, Number(stats?.totalAnswered || 0)),
    bestStreak: Math.max(0, Number(stats?.bestStreak || 0)),
  };
}

function normalizeHistory(history = {}) {
  const out = {};
  for (const key of Object.keys(history || {})) {
    const entry = history?.[key];
    const correct = Math.max(0, Number(entry?.correct || 0));
    const wrong = Math.max(0, Number(entry?.wrong || 0));
    if (correct > 0 || wrong > 0) out[key] = { correct, wrong };
  }
  return out;
}

export function createEmptyModeProgress() {
  return { stats: cloneStats(), history: {} };
}

export function createDefaultProgress() {
  return {
    version: PROGRESS_VERSION,
    byGameType: {
      [GAME_TYPES.QUESTION_TO_PATTERN]: createEmptyModeProgress(),
      [GAME_TYPES.TEMPLATE_TO_PATTERN]: createEmptyModeProgress(),
    },
  };
}

export function normalizeProgress(payload) {
  const base = createDefaultProgress();
  if (!payload || typeof payload !== "object") return base;

  // Legacy shape: { stats, history }.
  if ("stats" in payload || "history" in payload) {
    return {
      ...base,
      byGameType: {
        ...base.byGameType,
        [GAME_TYPES.QUESTION_TO_PATTERN]: {
          stats: cloneStats(payload?.stats),
          history: normalizeHistory(payload?.history || {}),
        },
      },
    };
  }

  const byGameType = payload?.byGameType;
  if (!byGameType || typeof byGameType !== "object") return base;

  const out = { ...base, byGameType: { ...base.byGameType } };
  for (const gameType of Object.values(GAME_TYPES)) {
    const mode = byGameType?.[gameType];
    out.byGameType[gameType] = {
      stats: cloneStats(mode?.stats),
      history: normalizeHistory(mode?.history || {}),
    };
  }

  return out;
}

export function getModeProgress(progress, gameType) {
  const normalized = normalizeProgress(progress);
  return normalized.byGameType?.[gameType] || createEmptyModeProgress();
}

export function setModeProgress(progress, gameType, modeProgress) {
  const normalized = normalizeProgress(progress);
  return {
    ...normalized,
    byGameType: {
      ...normalized.byGameType,
      [gameType]: {
        stats: cloneStats(modeProgress?.stats),
        history: normalizeHistory(modeProgress?.history || {}),
      },
    },
  };
}
