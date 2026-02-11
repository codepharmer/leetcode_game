export function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function genChoices(correct, allPatterns) {
  return shuffle([correct, ...shuffle(allPatterns.filter((p) => p !== correct)).slice(0, 3)]);
}

export function genChoicesWithConfusions(correct, allPatterns, confusionMap = {}, totalChoices = 4) {
  const all = Array.isArray(allPatterns) ? allPatterns : [];
  const pool = all.includes(correct) ? all : [correct, ...all];

  const picked = new Set([correct]);

  const confusion = shuffle(
    (confusionMap?.[correct] || []).filter((pattern) => pattern !== correct && pool.includes(pattern))
  );

  for (const pattern of confusion) {
    if (picked.size >= Math.min(totalChoices, pool.length)) break;
    picked.add(pattern);
    if (picked.size >= 3) break; // Reserve at least one slot for a random distractor.
  }

  const randomPool = shuffle(pool.filter((pattern) => !picked.has(pattern)));
  while (picked.size < Math.min(totalChoices, pool.length) && randomPool.length > 0) {
    picked.add(randomPool.shift());
  }

  return shuffle([...picked]);
}
