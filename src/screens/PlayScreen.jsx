import { DIFF_COLORS } from "../lib/constants";
import { S } from "../styles";

import { AccuracyDot } from "../components/AccuracyDot";
import { TemplateViewer } from "../components/TemplateViewer";

export function PlayScreen({
  currentQ,
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
}) {
  if (!currentQ) return null;

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
          <span style={{ ...S.statItem, color: "#98c379" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...S.diffBadge, color: DIFF_COLORS[currentQ.difficulty], borderColor: DIFF_COLORS[currentQ.difficulty] + "40" }}>
            {currentQ.difficulty}
          </span>
          <AccuracyDot qId={currentQ.id} history={history} />
        </div>
        <h2 style={S.questionName}>{currentQ.name}</h2>

        <button className="hover-row" onClick={() => setShowDesc((p) => !p)} style={S.descToggle}>
          {showDesc ? " hide description" : " show description"}
          <span style={S.descHotkey}>D</span>
        </button>

        {showDesc && <div style={{ ...S.descBox, animation: "descReveal 0.25s ease-out" }}>{currentQ.desc}</div>}

        <p style={S.questionPrompt}>What pattern solves this?</p>
      </div>

      <div style={S.choicesGrid}>
        {choices.map((c, i) => {
          let bg = "transparent",
            border = "#3b3d52",
            fg = "#a9b1d6";
          if (selected !== null) {
            if (c === currentQ.pattern) {
              bg = "#98c37918";
              border = "#98c379";
              fg = "#98c379";
            } else if (c === selected) {
              bg = "#e06c7518";
              border = "#e06c75";
              fg = "#e06c75";
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

      {showNext && (
        <div style={{ animation: "fadeUp 0.2s ease-out" }}>
          <div style={S.nextArea}>
            {selected === currentQ.pattern ? (
              <span style={{ color: "#98c379", fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}> correct</span>
            ) : (
              <span style={{ color: "#e06c75", fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>
                {" "}answer: <span style={{ color: "#a9b1d6" }}>{currentQ.pattern}</span>
              </span>
            )}
            <button onClick={onNext} style={S.nextBtn}>
              {currentIdx + 1 >= total ? "see results" : "next"}{" "}
            </button>
          </div>

          <TemplateViewer pattern={currentQ.pattern} open={showTemplate} onOpenChange={setShowTemplate} />
        </div>
      )}
    </div>
  );
}
