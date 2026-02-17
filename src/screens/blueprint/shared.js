export const DIFF_COLOR = {
  Tutorial: "var(--accent)",
  Practice: "var(--warn)",
  Boss: "var(--danger)",
  Easy: "var(--accent)",
  Medium: "var(--warn)",
  Hard: "var(--danger)",
};

export function normalizeStars(stars) {
  const out = {};
  for (const key of Object.keys(stars || {})) {
    const value = Number(stars?.[key] || 0);
    if (!Number.isFinite(value) || value <= 0) continue;
    out[String(key)] = Math.max(0, Math.min(3, Math.round(value)));
  }
  return out;
}

export function getLevelStars(starsByLevel, levelId) {
  return Number(starsByLevel?.[String(levelId)] || 0);
}

export function getChallengeBadgeColor(challenge) {
  if (challenge?.isBossRush) return "var(--danger)";
  if (challenge?.tier === 1) return "var(--accent)";
  if (challenge?.tier === 2) return "var(--warn)";
  return "var(--danger)";
}

export function formatElapsed(ms) {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.round(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function sortCardsForGuided(cards, slotIds) {
  const slotOrder = new Map(slotIds.map((slotId, index) => [slotId, index]));
  return [...cards].sort((a, b) => {
    const slotA = slotOrder.get(a.correctSlot) ?? 999;
    const slotB = slotOrder.get(b.correctSlot) ?? 999;
    if (slotA !== slotB) return slotA - slotB;
    return (a.correctOrder || 0) - (b.correctOrder || 0);
  });
}

export function buildHintMessage(card, hintsMode) {
  if (card?.isDistractor) return "This card may be a distractor.";
  if (hintsMode === "limited") return `Focus on the ${String(card?.hint || card?.correctSlot || "correct")} phase.`;
  return `This card belongs in ${card?.hint || card?.correctSlot || "a different slot"}.`;
}
