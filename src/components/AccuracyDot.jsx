export function AccuracyDot({ qId, history }) {
  const h = history[qId];
  if (!h || (h.correct === 0 && h.wrong === 0)) return null;

  const total = h.correct + h.wrong;
  const pct = Math.round((h.correct / total) * 100);
  const color = pct >= 80 ? "#98c379" : pct >= 50 ? "#e5c07b" : "#e06c75";

  return (
    <span style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0, marginLeft: 4 }}>
      {pct}%<span style={{ color: "#3b3d52", fontSize: 9 }}> ({total})</span>
    </span>
  );
}
