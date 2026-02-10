import { PATTERN_COLORS } from "../lib/constants";
import { TEMPLATE_GROUPS, UNIVERSAL_TEMPLATE } from "../lib/templates";
import { S } from "../styles";

import { CodeBlock } from "../components/CodeBlock";

export function TemplatesScreen({ goMenu }) {
  return (
    <div style={S.browseContainer}>
      <div style={S.topBar}>
        <button onClick={goMenu} style={S.backBtn}>
          {" "}back
        </button>
        <span style={{ fontSize: 14, color: "#c0caf5", fontWeight: 600 }}>All Templates</span>
      </div>

      <div style={S.templateFullCard}>
        <div style={{ ...S.patternHeader, marginBottom: 6 }}>
          <span style={{ ...S.patternDot, background: "#98c379" }} />
          <span style={{ ...S.patternName, color: "#98c379" }}>Universal Interview Skeleton</span>
        </div>
        <CodeBlock code={UNIVERSAL_TEMPLATE.code} />
      </div>

      {TEMPLATE_GROUPS.map((g, gi) => (
        <div key={gi} style={S.templateFullCard}>
          <div style={S.patternHeader}>
            <span style={{ ...S.patternDot, background: PATTERN_COLORS[g.patterns[0]] || "#a9b1d6" }} />
            <span style={{ ...S.patternName, color: PATTERN_COLORS[g.patterns[0]] || "#a9b1d6" }}>{g.category}</span>
            <span style={S.patternCount}>{g.templates.length} templates</span>
          </div>
          <div style={{ fontSize: 11, color: "#3b3d52", marginBottom: 8 }}>patterns: {g.patterns.join(", ")}</div>
          {g.templates.map((t, ti) => (
            <div key={ti} style={S.templateItem}>
              <div style={S.templateName}>{t.name}</div>
              <CodeBlock code={t.code} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
