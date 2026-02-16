import { DEFAULT_STATS, GAME_TYPES } from "./constants";

export const PROGRESS_VERSION = 2;
export const MAX_ATTEMPT_EVENTS = 2000;
export const MAX_ROUND_SNAPSHOTS = 365;

export const ONBOARDING_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
});

export const ONBOARDING_FLOWS = Object.freeze({
  GLOBAL: "global",
  QUESTION_TO_PATTERN: GAME_TYPES.QUESTION_TO_PATTERN,
  TEMPLATE_TO_PATTERN: GAME_TYPES.TEMPLATE_TO_PATTERN,
  BLUEPRINT_BUILDER: GAME_TYPES.BLUEPRINT_BUILDER,
});

export const ONBOARDING_FLOW_KEYS = Object.freeze([
  ONBOARDING_FLOWS.GLOBAL,
  ONBOARDING_FLOWS.QUESTION_TO_PATTERN,
  ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN,
  ONBOARDING_FLOWS.BLUEPRINT_BUILDER,
]);

export const ONBOARDING_TIP_KEYS = Object.freeze({
  QUIZ_SHORTCUTS: "quizShortcuts",
  BLUEPRINT_DRAG_TAP: "blueprintDragTap",
  BLUEPRINT_HINT_PENALTY: "blueprintHintPenalty",
});

const ONBOARDING_STATUS_VALUES = new Set(Object.values(ONBOARDING_STATUS));

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

function normalizeMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const normalized = { ...meta };

  if ("attemptEvents" in normalized) {
    normalized.attemptEvents = normalizeAttemptEvents(normalized.attemptEvents);
  }

  if ("roundSnapshots" in normalized) {
    normalized.roundSnapshots = normalizeRoundSnapshots(normalized.roundSnapshots);
  }

  return normalized;
}

function toSafeTimestamp(value) {
  const ts = Math.floor(Number(value));
  if (!Number.isFinite(ts) || ts <= 0) return 0;
  return ts;
}

function toSafePercent(value, fallback = 0) {
  const pct = Number(value);
  if (!Number.isFinite(pct)) return fallback;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function toSafeCount(value) {
  const count = Math.floor(Number(value));
  if (!Number.isFinite(count) || count < 0) return 0;
  return count;
}

export function normalizeAttemptEvent(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;

  const itemId = String(entry.itemId ?? "").trim();
  if (!itemId) return null;

  const gameType = String(entry.gameType ?? "").trim();
  const chosen = typeof entry.chosen === "string" ? entry.chosen : "";
  const pattern = typeof entry.pattern === "string" ? entry.pattern : "";
  const title = typeof entry.title === "string" ? entry.title : "";
  const sourceLeetcodeId = Number(entry.sourceLeetcodeId);

  const out = {
    ts: toSafeTimestamp(entry.ts),
    gameType,
    itemId,
    title,
    chosen,
    pattern,
    correct: entry.correct === true,
  };

  if (Number.isInteger(sourceLeetcodeId) && sourceLeetcodeId > 0) {
    out.sourceLeetcodeId = sourceLeetcodeId;
  }

  return out;
}

export function normalizeAttemptEvents(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const normalized = [];

  for (const entry of list) {
    const event = normalizeAttemptEvent(entry);
    if (event) normalized.push(event);
  }

  return normalized.slice(-MAX_ATTEMPT_EVENTS);
}

export function normalizeRoundSnapshotEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;

  const answered = toSafeCount(entry.answered);
  if (answered <= 0) return null;

  const correct = Math.min(answered, toSafeCount(entry.correct));
  const computedPct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const pct = toSafePercent(entry.pct, computedPct);

  return {
    ts: toSafeTimestamp(entry.ts),
    gameType: String(entry.gameType ?? "").trim(),
    answered,
    correct,
    pct,
  };
}

export function normalizeRoundSnapshots(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const normalized = [];

  for (const entry of list) {
    const snapshot = normalizeRoundSnapshotEntry(entry);
    if (snapshot) normalized.push(snapshot);
  }

  return normalized.slice(-MAX_ROUND_SNAPSHOTS);
}

function normalizeOnboardingStatus(status) {
  if (ONBOARDING_STATUS_VALUES.has(status)) return status;
  return ONBOARDING_STATUS.NOT_STARTED;
}

function normalizeLastStep(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return -1;
  return Math.max(-1, parsed);
}

export function createDefaultOnboardingFlow() {
  return {
    status: ONBOARDING_STATUS.NOT_STARTED,
    lastStep: -1,
  };
}

function normalizeOnboardingFlow(flow) {
  const base = createDefaultOnboardingFlow();
  if (!flow || typeof flow !== "object" || Array.isArray(flow)) return base;
  return {
    status: normalizeOnboardingStatus(flow.status),
    lastStep: normalizeLastStep(flow.lastStep),
  };
}

export function createDefaultOnboarding() {
  return {
    [ONBOARDING_FLOWS.GLOBAL]: createDefaultOnboardingFlow(),
    [ONBOARDING_FLOWS.QUESTION_TO_PATTERN]: createDefaultOnboardingFlow(),
    [ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN]: createDefaultOnboardingFlow(),
    [ONBOARDING_FLOWS.BLUEPRINT_BUILDER]: createDefaultOnboardingFlow(),
    tips: {
      [ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS]: false,
      [ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP]: false,
      [ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY]: false,
    },
  };
}

export function normalizeOnboarding(onboarding) {
  const base = createDefaultOnboarding();
  if (!onboarding || typeof onboarding !== "object" || Array.isArray(onboarding)) return base;

  const out = {
    [ONBOARDING_FLOWS.GLOBAL]: normalizeOnboardingFlow(onboarding?.[ONBOARDING_FLOWS.GLOBAL]),
    [ONBOARDING_FLOWS.QUESTION_TO_PATTERN]: normalizeOnboardingFlow(onboarding?.[ONBOARDING_FLOWS.QUESTION_TO_PATTERN]),
    [ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN]: normalizeOnboardingFlow(onboarding?.[ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN]),
    [ONBOARDING_FLOWS.BLUEPRINT_BUILDER]: normalizeOnboardingFlow(onboarding?.[ONBOARDING_FLOWS.BLUEPRINT_BUILDER]),
    tips: { ...base.tips },
  };

  const tips = onboarding?.tips;
  if (tips && typeof tips === "object" && !Array.isArray(tips)) {
    out.tips[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS] = tips[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS] === true;
    out.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP] = tips[ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP] === true;
    out.tips[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY] = tips[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY] === true;
  }

  return out;
}

export function createEmptyModeProgress() {
  return { stats: cloneStats(), history: {}, meta: {} };
}

export function createDefaultProgress() {
  return {
    version: PROGRESS_VERSION,
    byGameType: {
      [GAME_TYPES.QUESTION_TO_PATTERN]: createEmptyModeProgress(),
      [GAME_TYPES.TEMPLATE_TO_PATTERN]: createEmptyModeProgress(),
      [GAME_TYPES.BLUEPRINT_BUILDER]: createEmptyModeProgress(),
    },
    onboarding: createDefaultOnboarding(),
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
          meta: {},
        },
      },
    };
  }

  const byGameType = payload?.byGameType;
  const out = { ...base, byGameType: { ...base.byGameType }, onboarding: normalizeOnboarding(payload?.onboarding) };
  if (!byGameType || typeof byGameType !== "object") return out;

  for (const gameType of Object.values(GAME_TYPES)) {
    const mode = byGameType?.[gameType];
    out.byGameType[gameType] = {
      stats: cloneStats(mode?.stats),
      history: normalizeHistory(mode?.history || {}),
      meta: normalizeMeta(mode?.meta),
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
        meta: normalizeMeta(modeProgress?.meta),
      },
    },
  };
}

export function getOnboardingState(progress) {
  const normalized = normalizeProgress(progress);
  return normalizeOnboarding(normalized.onboarding);
}

export function setOnboardingState(progress, onboarding) {
  const normalized = normalizeProgress(progress);
  return {
    ...normalized,
    onboarding: normalizeOnboarding(onboarding),
  };
}

export function setOnboardingFlow(progress, flowKey, flowState) {
  const normalized = normalizeProgress(progress);
  if (!ONBOARDING_FLOW_KEYS.includes(flowKey)) return normalized;
  return {
    ...normalized,
    onboarding: {
      ...normalized.onboarding,
      [flowKey]: normalizeOnboardingFlow(flowState),
    },
  };
}

export function setOnboardingTip(progress, tipKey, value = true) {
  const normalized = normalizeProgress(progress);
  return {
    ...normalized,
    onboarding: {
      ...normalized.onboarding,
      tips: {
        ...(normalized.onboarding?.tips || {}),
        [tipKey]: value === true,
      },
    },
  };
}
