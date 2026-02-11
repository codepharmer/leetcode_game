import { GAME_TYPES } from "./constants";
import { createDefaultProgress, getModeProgress, normalizeProgress } from "./progressModel";

export function normalizeHistoryEntry(entry) {
  const correct = Math.max(0, Number(entry?.correct || 0));
  const wrong = Math.max(0, Number(entry?.wrong || 0));
  return { correct, wrong };
}

export function historyIsSubset(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of keys) {
    const aValue = normalizeHistoryEntry(a?.[key]);
    const bValue = normalizeHistoryEntry(b?.[key]);
    if (aValue.correct > bValue.correct || aValue.wrong > bValue.wrong) return false;
  }
  return true;
}

export function mergeHistoryMax(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const merged = {};
  for (const key of keys) {
    const aValue = normalizeHistoryEntry(a?.[key]);
    const bValue = normalizeHistoryEntry(b?.[key]);
    const correct = Math.max(aValue.correct, bValue.correct);
    const wrong = Math.max(aValue.wrong, bValue.wrong);
    if (correct > 0 || wrong > 0) merged[key] = { correct, wrong };
  }
  return merged;
}

export function historyTotals(history = {}) {
  let totalCorrect = 0;
  let totalAnswered = 0;
  for (const key of Object.keys(history || {})) {
    const value = normalizeHistoryEntry(history[key]);
    totalCorrect += value.correct;
    totalAnswered += value.correct + value.wrong;
  }
  return { totalCorrect, totalAnswered };
}

export function normalizeStats(stats) {
  return {
    gamesPlayed: Math.max(0, Number(stats?.gamesPlayed || 0)),
    totalCorrect: Math.max(0, Number(stats?.totalCorrect || 0)),
    totalAnswered: Math.max(0, Number(stats?.totalAnswered || 0)),
    bestStreak: Math.max(0, Number(stats?.bestStreak || 0)),
  };
}

export function statsEqual(a, b) {
  const aValue = normalizeStats(a);
  const bValue = normalizeStats(b);
  return (
    aValue.gamesPlayed === bValue.gamesPlayed &&
    aValue.totalCorrect === bValue.totalCorrect &&
    aValue.totalAnswered === bValue.totalAnswered &&
    aValue.bestStreak === bValue.bestStreak
  );
}

function mergeModeProgress(remoteMode, localMode) {
  const remoteStats = normalizeStats(remoteMode?.stats);
  const localStats = normalizeStats(localMode?.stats);

  const remoteHistory = remoteMode?.history || {};
  const localHistory = localMode?.history || {};

  const localIsSubset = historyIsSubset(localHistory, remoteHistory);
  const remoteIsSubset = historyIsSubset(remoteHistory, localHistory);

  let mergedHistory;
  if (localIsSubset) mergedHistory = remoteHistory;
  else if (remoteIsSubset) mergedHistory = localHistory;
  else mergedHistory = mergeHistoryMax(remoteHistory, localHistory);

  const totals = historyTotals(mergedHistory);
  const mergedStats = {
    gamesPlayed: Math.max(remoteStats.gamesPlayed, localStats.gamesPlayed),
    bestStreak: Math.max(remoteStats.bestStreak, localStats.bestStreak),
    totalCorrect: Math.max(totals.totalCorrect, remoteStats.totalCorrect, localStats.totalCorrect),
    totalAnswered: Math.max(totals.totalAnswered, remoteStats.totalAnswered, localStats.totalAnswered),
  };

  return {
    mergedMode: { stats: mergedStats, history: mergedHistory },
    localIsSubset,
    remoteStats,
  };
}

export function mergeProgressData(remoteProgressLike, localProgressLike) {
  const remoteProgress = normalizeProgress(remoteProgressLike);
  const localProgress = normalizeProgress(localProgressLike);
  const mergedProgress = createDefaultProgress();

  let allLocalIsSubset = true;
  let shouldWriteRemote = false;

  for (const gameType of Object.values(GAME_TYPES)) {
    const remoteMode = getModeProgress(remoteProgress, gameType);
    const localMode = getModeProgress(localProgress, gameType);
    const { mergedMode, localIsSubset, remoteStats } = mergeModeProgress(remoteMode, localMode);
    mergedProgress.byGameType[gameType] = mergedMode;

    if (!localIsSubset) allLocalIsSubset = false;
    if (!localIsSubset || !statsEqual(mergedMode.stats, remoteStats)) shouldWriteRemote = true;
  }

  return {
    mergedProgress,
    allLocalIsSubset,
    shouldWriteRemote,
  };
}
