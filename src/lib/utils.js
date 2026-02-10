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
