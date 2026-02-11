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
