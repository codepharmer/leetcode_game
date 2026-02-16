import { S } from "../styles";

function formatAttemptTime(ts) {
  const safeTs = Math.floor(Number(ts));
  if (!Number.isFinite(safeTs) || safeTs <= 0) return "time unavailable";
  return new Date(safeTs).toLocaleString();
}

export function ReviewScreen({ attempts = [], goMenu }) {
  const rows = Array.isArray(attempts) ? attempts : [];

  return (
    <div style={S.resultsContainer}>
      <div style={S.resultsHeader}>
        <div style={{ textAlign: "center" }}>
          <div style={S.logo}>
            <span style={S.logoAccent}>$</span>
            <span style={{ color: "var(--text-strong)" }}>pattern</span>
            <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>.</span>
            <span style={S.logoDim}>match</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--faint)",
            }}
          >
            review mistakes
          </div>
        </div>
      </div>

      <div style={S.resultsList}>
        {rows.length === 0 ? (
          <div style={S.syncBanner}>
            <div style={S.syncBannerTitle}>No mistakes saved yet.</div>
            <div style={S.syncBannerText}>Finish a round to start building your review feed.</div>
          </div>
        ) : (
          rows.map((entry, index) => (
            <div key={`${entry.itemId}-${entry.ts}-${index}`} style={S.resultRowOuter}>
              <div style={{ ...S.resultRow, cursor: "default", alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "center" }}>
                  <span style={{ ...S.resultIcon, color: "var(--danger)" }}>x</span>
                  <span style={S.resultName}>{entry.title || entry.itemId}</span>
                  <span style={{ ...S.chevron, marginLeft: "auto" }}>{formatAttemptTime(entry.ts)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.45, marginLeft: 26 }}>
                  <div>your answer: {entry.chosen || "n/a"}</div>
                  <div>correct pattern: {entry.pattern || "n/a"}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={S.resultsActions}>
        <button onClick={goMenu} style={S.browseBtn}>
          menu
        </button>
      </div>
    </div>
  );
}
