import { DIFF_COLORS, PATTERN_COLORS } from "../lib/constants";
import { S } from "../styles";

import { AccuracyDot } from "../components/AccuracyDot";
import { CodeBlock } from "../components/CodeBlock";
import { TemplateViewer } from "../components/TemplateViewer";

export function BrowseScreen({
  browseFilter,
  setBrowseFilter,
  groupedByPattern,
  expandedBrowse,
  setExpandedBrowse,
  goMenu,
  history,
  browseTitle,
}) {
  return (
    <div style={S.browseContainer}>
      <div style={S.topBar}>
        <button className="tap-target" onClick={goMenu} style={S.backBtn}>
          {" "}back
        </button>
        <div style={S.pillGroup}>
          {["All", "Easy", "Medium", "Hard"].map((d) => (
            <button
              className="tap-target"
              key={d}
              onClick={() => setBrowseFilter(d)}
              aria-pressed={browseFilter === d}
              style={{ ...S.pillSmall, ...(browseFilter === d ? S.pillActive : {}) }}
            >
              {d.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <h2 style={S.browseTitle}>{browseTitle || "All Patterns"}</h2>

      <div style={S.browseGrid}>
        {Object.entries(groupedByPattern)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([pattern, items]) => {
            const templatePatternOptions = [...new Set(items.map((item) => item.templatePattern || item.pattern).filter(Boolean))];
            const templatePattern = templatePatternOptions.length === 1 ? templatePatternOptions[0] : null;

            return (
              <div key={pattern} style={S.patternCard}>
                <div style={S.patternHeader}>
                  <span style={{ ...S.patternDot, background: PATTERN_COLORS[pattern] || "var(--text)" }} />
                  <span style={{ ...S.patternName, color: PATTERN_COLORS[pattern] || "var(--text)" }}>{pattern}</span>
                  <span style={S.patternCount}>{items.length}</span>
                </div>

                {items.map((item) => {
                  const diffTag = String(item.difficulty || "?").slice(0, 1).toUpperCase();

                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        className="hover-row tap-target"
                        aria-expanded={!!expandedBrowse[item.id]}
                        onClick={() => setExpandedBrowse((p) => ({ ...p, [item.id]: !p[item.id] }))}
                        style={{
                          ...S.patternQ,
                          width: "100%",
                          border: "none",
                          textAlign: "left",
                          background: "transparent",
                        }}
                      >
                        <span style={{ ...S.patternQDiff, color: DIFF_COLORS[item.difficulty] }}>[{diffTag}]</span>
                        <span style={{ flex: 1 }}>{item.title || item.name || item.id}</span>
                        <AccuracyDot qId={item.id} history={history} />
                        <span style={S.chevron}>{expandedBrowse[item.id] ? "[-]" : "[+]"}</span>
                      </button>
                      {expandedBrowse[item.id] && (
                        <div style={{ ...S.browseDescBox, animation: "descReveal 0.2s ease-out" }}>
                          {item.promptKind === "code" ? <CodeBlock code={item.code} /> : item.desc}
                        </div>
                      )}
                    </div>
                  );
                })}

                {templatePattern && <TemplateViewer pattern={templatePattern} compact />}
              </div>
            );
          })}
      </div>
    </div>
  );
}
