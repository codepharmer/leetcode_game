import { GAME_TYPES } from "./constants";
import {
  MAX_ATTEMPT_EVENTS,
  MAX_ROUND_SNAPSHOTS,
  ONBOARDING_FLOW_KEYS,
  ONBOARDING_STATUS,
  ONBOARDING_TIP_KEYS,
  createDefaultProgress,
  getModeProgress,
  normalizeAttemptEvents,
  normalizeOnboarding,
  normalizeProgress,
  normalizeRoundSnapshots,
} from "./progressModel";

const ONBOARDING_STATUS_PRECEDENCE = Object.freeze({
  [ONBOARDING_STATUS.NOT_STARTED]: 0,
  [ONBOARDING_STATUS.IN_PROGRESS]: 1,
  [ONBOARDING_STATUS.SKIPPED]: 2,
  [ONBOARDING_STATUS.COMPLETED]: 3,
});

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

function normalizeMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const normalized = { ...meta };
  if ("attemptEvents" in normalized) normalized.attemptEvents = normalizeAttemptEvents(normalized.attemptEvents);
  if ("roundSnapshots" in normalized) normalized.roundSnapshots = normalizeRoundSnapshots(normalized.roundSnapshots);
  return normalized;
}

function attemptEventKey(entry) {
  return [
    Number(entry?.ts || 0),
    String(entry?.gameType || ""),
    String(entry?.itemId || ""),
    String(entry?.chosen || ""),
    entry?.correct === true ? "1" : "0",
    String(entry?.pattern || ""),
  ].join("|");
}

function roundSnapshotKey(entry) {
  return [
    Number(entry?.ts || 0),
    String(entry?.gameType || ""),
    Number(entry?.answered || 0),
    Number(entry?.correct || 0),
    Number(entry?.pct || 0),
  ].join("|");
}

function mergeAttemptEvents(remoteEvents, localEvents) {
  const remote = normalizeAttemptEvents(remoteEvents);
  const local = normalizeAttemptEvents(localEvents);
  const merged = new Map();

  for (const entry of [...remote, ...local]) {
    const key = attemptEventKey(entry);
    const previous = merged.get(key);
    merged.set(
      key,
      previous
        ? { ...previous, ...entry, ts: Math.max(Number(previous.ts || 0), Number(entry.ts || 0)) }
        : entry
    );
  }

  return [...merged.values()]
    .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0))
    .slice(-MAX_ATTEMPT_EVENTS);
}

function mergeRoundSnapshots(remoteSnapshots, localSnapshots) {
  const remote = normalizeRoundSnapshots(remoteSnapshots);
  const local = normalizeRoundSnapshots(localSnapshots);
  const merged = new Map();

  for (const entry of [...remote, ...local]) {
    const key = roundSnapshotKey(entry);
    const previous = merged.get(key);
    merged.set(
      key,
      previous
        ? { ...previous, ...entry, ts: Math.max(Number(previous.ts || 0), Number(entry.ts || 0)) }
        : entry
    );
  }

  return [...merged.values()]
    .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0))
    .slice(-MAX_ROUND_SNAPSHOTS);
}

function mergeLevelStars(remoteStars, localStars) {
  const remote = remoteStars && typeof remoteStars === "object" ? remoteStars : {};
  const local = localStars && typeof localStars === "object" ? localStars : {};
  const merged = {};
  const keys = new Set([...Object.keys(remote), ...Object.keys(local)]);

  for (const key of keys) {
    const rv = Math.max(0, Math.min(3, Math.round(Number(remote[key] || 0))));
    const lv = Math.max(0, Math.min(3, Math.round(Number(local[key] || 0))));
    const next = Math.max(rv, lv);
    if (next > 0) merged[key] = next;
  }
  return merged;
}

function mergeMeta(remoteMeta, localMeta) {
  const remote = normalizeMeta(remoteMeta);
  const local = normalizeMeta(localMeta);
  const merged = { ...remote, ...local };
  if ("levelStars" in remote || "levelStars" in local) {
    merged.levelStars = mergeLevelStars(remote.levelStars, local.levelStars);
  }
  if ("attemptEvents" in remote || "attemptEvents" in local) {
    merged.attemptEvents = mergeAttemptEvents(remote.attemptEvents, local.attemptEvents);
  }
  if ("roundSnapshots" in remote || "roundSnapshots" in local) {
    merged.roundSnapshots = mergeRoundSnapshots(remote.roundSnapshots, local.roundSnapshots);
  }
  return merged;
}

function metaEqual(a, b) {
  return JSON.stringify(normalizeMeta(a)) === JSON.stringify(normalizeMeta(b));
}

function onboardingStatusRank(status) {
  return ONBOARDING_STATUS_PRECEDENCE[status] ?? ONBOARDING_STATUS_PRECEDENCE[ONBOARDING_STATUS.NOT_STARTED];
}

export function mergeOnboardingStatus(remoteStatus, localStatus) {
  const remoteRank = onboardingStatusRank(remoteStatus);
  const localRank = onboardingStatusRank(localStatus);
  return localRank > remoteRank ? localStatus : remoteStatus;
}

export function mergeOnboardingFlow(remoteFlow, localFlow) {
  const remote = remoteFlow && typeof remoteFlow === "object" ? remoteFlow : {};
  const local = localFlow && typeof localFlow === "object" ? localFlow : {};
  return {
    status: mergeOnboardingStatus(remote.status, local.status),
    lastStep: Math.max(-1, Number(remote.lastStep || -1), Number(local.lastStep || -1)),
  };
}

export function mergeOnboarding(remoteOnboardingLike, localOnboardingLike) {
  const remoteOnboarding = normalizeOnboarding(remoteOnboardingLike);
  const localOnboarding = normalizeOnboarding(localOnboardingLike);
  const merged = normalizeOnboarding();

  for (const flowKey of ONBOARDING_FLOW_KEYS) {
    merged[flowKey] = mergeOnboardingFlow(remoteOnboarding?.[flowKey], localOnboarding?.[flowKey]);
  }

  merged.tips = {
    [ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS]:
      remoteOnboarding?.tips?.[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS] === true ||
      localOnboarding?.tips?.[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS] === true,
    [ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP]:
      remoteOnboarding?.tips?.[ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP] === true ||
      localOnboarding?.tips?.[ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP] === true,
    [ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY]:
      remoteOnboarding?.tips?.[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY] === true ||
      localOnboarding?.tips?.[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY] === true,
  };

  return merged;
}

function onboardingEqual(a, b) {
  return JSON.stringify(normalizeOnboarding(a)) === JSON.stringify(normalizeOnboarding(b));
}

function onboardingIsSubset(localOnboardingLike, remoteOnboardingLike) {
  const local = normalizeOnboarding(localOnboardingLike);
  const remote = normalizeOnboarding(remoteOnboardingLike);

  for (const flowKey of ONBOARDING_FLOW_KEYS) {
    const localFlow = local?.[flowKey] || {};
    const remoteFlow = remote?.[flowKey] || {};
    if (onboardingStatusRank(localFlow.status) > onboardingStatusRank(remoteFlow.status)) return false;
    if (Number(localFlow.lastStep || -1) > Number(remoteFlow.lastStep || -1)) return false;
  }

  for (const tipKey of Object.values(ONBOARDING_TIP_KEYS)) {
    if (local?.tips?.[tipKey] === true && remote?.tips?.[tipKey] !== true) return false;
  }

  return true;
}

function mergeModeProgress(remoteMode, localMode) {
  const remoteStats = normalizeStats(remoteMode?.stats);
  const localStats = normalizeStats(localMode?.stats);
  const remoteMeta = normalizeMeta(remoteMode?.meta);

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
    mergedMode: { stats: mergedStats, history: mergedHistory, meta: mergeMeta(remoteMode?.meta, localMode?.meta) },
    localIsSubset,
    remoteStats,
    remoteMeta,
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
    const { mergedMode, localIsSubset, remoteStats, remoteMeta } = mergeModeProgress(remoteMode, localMode);
    mergedProgress.byGameType[gameType] = mergedMode;

    if (!localIsSubset) allLocalIsSubset = false;
    if (!localIsSubset || !statsEqual(mergedMode.stats, remoteStats) || !metaEqual(mergedMode.meta, remoteMeta)) {
      shouldWriteRemote = true;
    }
  }

  mergedProgress.onboarding = mergeOnboarding(remoteProgress.onboarding, localProgress.onboarding);
  if (!onboardingIsSubset(localProgress.onboarding, remoteProgress.onboarding)) {
    allLocalIsSubset = false;
  }
  if (!onboardingEqual(mergedProgress.onboarding, remoteProgress.onboarding)) {
    shouldWriteRemote = true;
  }

  return {
    mergedProgress,
    allLocalIsSubset,
    shouldWriteRemote,
  };
}
