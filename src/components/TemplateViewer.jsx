import { useState } from "react";

import { PATTERN_TO_TEMPLATES, UNIVERSAL_TEMPLATE } from "../lib/templates";
import { S } from "../styles";
import { CodeBlock } from "./CodeBlock";

export function TemplateViewer({ pattern, compact, open: openProp, onOpenChange }) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [showUniversal, setShowUniversal] = useState(false);
  const info = PATTERN_TO_TEMPLATES[pattern];
  if (!info) return null;

  if (compact) {
    return (
      <div style={{ marginTop: 6 }}>
        <button className="hover-row" onClick={() => setOpen(!open)} style={S.templateToggle}>
          {open ? "" : ""} {info.category} templates
          <span style={S.templateCount}>{info.templates.length}</span>
        </button>
        {open && (
          <div style={{ ...S.templatePanel, animation: "descReveal 0.25s ease-out" }}>
            {info.templates.map((t, i) => (
              <div key={i} style={S.templateItem}>
                <div style={S.templateName}>{t.name}</div>
                <CodeBlock code={t.code} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={S.templateSection}>
      <button className="hover-row" onClick={() => setOpen(!open)} style={S.templateToggleLg}>
        {open ? "" : ""} view template: {info.category}
        <span style={S.descHotkey}>T</span>
      </button>
      {open && (
        <div style={{ ...S.templatePanelLg, animation: "descReveal 0.25s ease-out" }}>
          <button
            className="hover-row"
            onClick={() => setShowUniversal(!showUniversal)}
            style={{ ...S.templateToggle, marginBottom: 8, color: "var(--dim)" }}
          >
            {showUniversal ? "" : ""} universal skeleton
          </button>
          {showUniversal && <CodeBlock code={UNIVERSAL_TEMPLATE.code} />}
          {info.templates.map((t, i) => (
            <div key={i} style={S.templateItem}>
              <div style={S.templateName}>{t.name}</div>
              <CodeBlock code={t.code} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
