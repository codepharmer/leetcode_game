import { DIFF_COLORS, PATTERN_COLORS } from "../lib/constants";
import { S } from "../styles";

import { AccuracyDot } from "../components/AccuracyDot";
import { TemplateViewer } from "../components/TemplateViewer";

export function BrowseScreen({
  browseFilter,
  setBrowseFilter,
  groupedByPattern,
  expandedBrowse,
  setExpandedBrowse,
  goMenu,
  history,
}) {
  return (
    <div style={S.browseContainer}>
      <div style={S.topBar}>
        <button onClick={goMenu} style={S.backBtn}>
          {" "}back
        </button>
        <div style={S.pillGroup}>
          {["All", "Easy", "Medium", "Hard"].map((d) => (
            <button
              key={d}
              onClick={() => setBrowseFilter(d)}
              style={{ ...S.pillSmall, ...(browseFilter === d ? S.pillActive : {}) }}
            >
              {d.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <h2 style={S.browseTitle}>All Patterns</h2>

      <div style={S.browseGrid}>
        {Object.entries(groupedByPattern)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([pattern, qs]) => (
            <div key={pattern} style={S.patternCard}>
              <div style={S.patternHeader}>
                <span style={{ ...S.patternDot, background: PATTERN_COLORS[pattern] || "var(--text)" }} />
                <span style={{ ...S.patternName, color: PATTERN_COLORS[pattern] || "var(--text)" }}>{pattern}</span>
                <span style={S.patternCount}>{qs.length}</span>
              </div>

              {qs.map((q) => (
                <div key={q.id}>
                  <div className="hover-row" onClick={() => setExpandedBrowse((p) => ({ ...p, [q.id]: !p[q.id] }))} style={S.patternQ}>
                    <span style={{ ...S.patternQDiff, color: DIFF_COLORS[q.difficulty] }}></span>
                    <span style={{ flex: 1 }}>{q.name}</span>
                    <AccuracyDot qId={q.id} history={history} />
                    <span style={S.chevron}>{expandedBrowse[q.id] ? "" : ""}</span>
                  </div>
                  {expandedBrowse[q.id] && <div style={{ ...S.browseDescBox, animation: "descReveal 0.2s ease-out" }}>{q.desc}</div>}
                </div>
              ))}

              <TemplateViewer pattern={pattern} compact />
            </div>
          ))}
      </div>
    </div>
  );
}
