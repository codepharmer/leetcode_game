export function AccuracyDot({ qId, history }) {
  const h = history[qId];
  if (!h || (h.correct === 0 && h.wrong === 0)) return null;

  const total = h.correct + h.wrong;
  const pct = Math.round((h.correct / total) * 100);
  const color = pct >= 80 ? "var(--accent)" : pct >= 50 ? "var(--warn)" : "var(--danger)";

  return (
    <span style={{ fontSize: 13, color, flexShrink: 0, marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>
      {pct}%<span style={{ color: "var(--faint)", fontSize: 13 }}> ({total})</span>
    </span>
  );
}
