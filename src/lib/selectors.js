export function calcRoundPct(score, total) {
  if (!total || total <= 0) return 0;
  return Math.round((score / total) * 100);
}

export function calcLifetimePct(stats) {
  const totalAnswered = Number(stats?.totalAnswered || 0);
  const totalCorrect = Number(stats?.totalCorrect || 0);
  if (totalAnswered <= 0) return 0;
  return Math.round((totalCorrect / totalAnswered) * 100);
}

export function getWeakSpots(items, history) {
  return items
    .filter((item) => {
      const entry = history?.[item.id];
      if (!entry) return false;
      const total = Number(entry.correct || 0) + Number(entry.wrong || 0);
      return total >= 2 && entry.correct / total < 0.6;
    })
    .sort((a, b) => {
      const aEntry = history[a.id];
      const bEntry = history[b.id];
      return aEntry.correct / (aEntry.correct + aEntry.wrong) - bEntry.correct / (bEntry.correct + bEntry.wrong);
    });
}

export function getMasteredCount(items, history) {
  return items.filter((item) => {
    const entry = history?.[item.id];
    if (!entry) return false;
    const total = Number(entry.correct || 0) + Number(entry.wrong || 0);
    return total >= 2 && entry.correct / total >= 0.8;
  }).length;
}

export function groupItemsByPattern(items, difficultyFilter) {
  const grouped = {};
  const filteredItems =
    difficultyFilter === "All" ? items : items.filter((item) => item.difficulty === difficultyFilter);

  filteredItems.forEach((item) => {
    if (!grouped[item.pattern]) grouped[item.pattern] = [];
    grouped[item.pattern].push(item);
  });

  return grouped;
}

function toSafeTimestamp(value) {
  const ts = Math.floor(Number(value));
  if (!Number.isFinite(ts) || ts <= 0) return 0;
  return ts;
}

function toSafeLimit(value) {
  const limit = Math.floor(Number(value));
  if (!Number.isFinite(limit) || limit <= 0) return Infinity;
  return limit;
}

export function selectIncorrectAttempts(meta, options = {}) {
  const entries = Array.isArray(meta?.attemptEvents) ? meta.attemptEvents : [];
  const gameTypeFilter = typeof options.gameType === "string" && options.gameType ? options.gameType : null;
  const limit = toSafeLimit(options.limit);

  return entries
    .filter((entry) => {
      if (!entry || typeof entry !== "object") return false;
      if (entry.correct === true) return false;
      if (gameTypeFilter && entry.gameType !== gameTypeFilter) return false;
      return true;
    })
    .sort((a, b) => toSafeTimestamp(b.ts) - toSafeTimestamp(a.ts))
    .slice(0, limit);
}

export function selectAccuracyTrend(meta, options = {}) {
  const entries = Array.isArray(meta?.roundSnapshots) ? meta.roundSnapshots : [];
  const gameTypeFilter = typeof options.gameType === "string" && options.gameType ? options.gameType : null;

  return entries
    .filter((entry) => {
      if (!entry || typeof entry !== "object") return false;
      if (gameTypeFilter && entry.gameType !== gameTypeFilter) return false;
      return Number(entry.answered || 0) > 0;
    })
    .map((entry) => ({
      ts: toSafeTimestamp(entry.ts),
      gameType: String(entry.gameType || ""),
      answered: Math.max(0, Math.floor(Number(entry.answered || 0))),
      correct: Math.max(0, Math.floor(Number(entry.correct || 0))),
      pct: Math.max(0, Math.min(100, Math.round(Number(entry.pct || 0)))),
    }))
    .sort((a, b) => a.ts - b.ts);
}
