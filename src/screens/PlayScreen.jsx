import { DIFF_COLORS } from "../lib/constants";
import { S } from "../styles";

import { AccuracyDot } from "../components/AccuracyDot";
import { CodeBlock } from "../components/CodeBlock";
import { TemplateViewer } from "../components/TemplateViewer";

export function PlayScreen({
  currentItem,
  currentIdx,
  total,
  score,
  streak,
  choices,
  selected,
  showDesc,
  setShowDesc,
  showNext,
  onSelect,
  onNext,
  onBack,
  showTemplate,
  setShowTemplate,
  history,
  promptLabel,
  revealTemplateAfterAnswer,
}) {
  if (!currentItem) return null;

  const isCodePrompt = currentItem.promptKind === "code";
  const description = typeof currentItem.desc === "string" ? currentItem.desc.trim() : "";
  const hasDescription = description.length > 0;

  return (
    <div style={S.playContainer}>
      <div style={S.topBar}>
        <button onClick={onBack} style={S.backBtn}>
          {" "}back
        </button>
        <div style={S.stats2}>
          <span style={S.statItem}>
            {currentIdx + 1}
            <span style={S.statDim}>/{total}</span>
          </span>
          <span style={{ ...S.statItem, color: "var(--accent)" }}>
            {score}
            <span style={S.statDim}> correct</span>
          </span>
          {streak > 1 && <span style={{ ...S.statItem, color: "#e5c07b", animation: "pulse 1s ease-in-out infinite" }}>🔥 {streak}</span>}
        </div>
      </div>

      <div style={S.progressTrack}>
        <div style={{ ...S.progressBar, width: `${((currentIdx + 1) / total) * 100}%` }} />
      </div>

      <div style={S.questionArea}>
        <div data-tutorial-anchor="play-question-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...S.diffBadge, color: DIFF_COLORS[currentItem.difficulty], borderColor: DIFF_COLORS[currentItem.difficulty] + "40" }}>
            {currentItem.difficulty}
          </span>
          <AccuracyDot qId={currentItem.id} history={history} />
        </div>
        <h2 style={S.questionName}>{isCodePrompt ? "Code Template" : currentItem.title}</h2>

        {!isCodePrompt && (
          <>
            <button className="hover-row" onClick={() => setShowDesc((p) => !p)} style={S.descToggle}>
              {showDesc ? " hide description" : " show description"}
              <span style={S.descHotkey}>D</span>
            </button>

            {showDesc && (
              <div style={{ ...S.descBox, animation: "descReveal 0.25s ease-out" }}>
                {hasDescription ? description : "Description unavailable for this prompt."}
              </div>
            )}
          </>
        )}

        {isCodePrompt && (
          <div data-tutorial-anchor="play-code-block" style={{ width: "100%" }}>
            <CodeBlock code={currentItem.code} />
          </div>
        )}

        <p style={S.questionPrompt}>{promptLabel}</p>
      </div>

      <div data-tutorial-anchor="play-choices" style={S.choicesGrid}>
        {choices.map((c, i) => {
          let bg = "var(--surface-1)",
            border = "var(--border)",
            fg = "var(--text)";
          if (selected !== null) {
            if (c === currentItem.pattern) {
              bg = "rgba(16, 185, 129, 0.15)";
              border = "var(--accent)";
              fg = "var(--accent)";
            } else if (c === selected) {
              bg = "rgba(239, 68, 68, 0.12)";
              border = "var(--danger)";
              fg = "var(--danger)";
            }
          }

          return (
            <button
              key={c}
              onClick={() => onSelect(c)}
              style={{
                ...S.choiceBtn,
                borderColor: border,
                background: bg,
                color: fg,
                cursor: selected !== null ? "default" : "pointer",
                animation: `fadeUp 0.2s ease-out ${i * 0.05}s both`,
              }}
            >
              <span style={S.choiceNum}>{i + 1}</span>
              {c}
            </button>
          );
        })}
      </div>

      <div data-tutorial-anchor="play-hotkeys" style={S.hotkeyRow}>
        <span style={S.hotkeyChip}>1-4 answer</span>
        <span style={S.hotkeyChip}>Enter next</span>
        {!isCodePrompt ? <span style={S.hotkeyChip}>D description</span> : null}
        <span style={S.hotkeyChip}>T template</span>
      </div>

      {showNext && (
        <div style={{ animation: "fadeUp 0.2s ease-out" }}>
          <div data-tutorial-anchor="play-feedback" style={S.nextArea}>
            {selected === currentItem.pattern ? (
              <span style={{ color: "var(--accent)", fontSize: 14, fontWeight: 600 }}> correct</span>
            ) : (
              <span style={{ color: "var(--danger)", fontSize: 14, fontWeight: 600 }}>
                {" "}answer: <span style={{ color: "var(--text)" }}>{currentItem.pattern}</span>
              </span>
            )}
            <button onClick={onNext} style={S.nextBtn}>
              {currentIdx + 1 >= total ? "see results" : "next"}{" "}
            </button>
          </div>

          {revealTemplateAfterAnswer && (
            <TemplateViewer
              pattern={currentItem.templatePattern || currentItem.pattern}
              open={showTemplate}
              onOpenChange={setShowTemplate}
            />
          )}
        </div>
      )}
    </div>
  );
}
