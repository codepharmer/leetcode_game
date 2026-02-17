import { S } from "../../styles";
import { formatElapsed } from "./shared";

export function BlueprintExecution({
  trace,
  step,
  setStep,
  testResults,
  allPassed,
  divergence,
  runSummary,
  onBackToBuild,
  onComplete,
  onReset,
}) {
  const current = trace[step];
  const phaseTone = {
    setup: { color: "var(--text-accent-cool)", background: "var(--info-fill-soft)" },
    update: { color: "var(--accent2)", background: "var(--info-fill-soft)" },
    check: { color: "var(--warn)", background: "var(--warn-fill-soft)" },
    return: { color: "var(--accent-pink)", background: "var(--error-fill-soft)" },
    loop: { color: "var(--accent)", background: "var(--accent-fill-soft)" },
    error: { color: "var(--danger)", background: "var(--error-fill-soft)" },
  };

  return (
    <div style={S.blueprintExecutionWrap}>
      <div style={S.blueprintExecCard}>
        <div style={S.execHeader}>
          <span style={S.execLabel}>execution trace</span>
          <span style={S.blueprintTopMeta}>
            step {Math.min(step + 1, Math.max(trace.length, 1))}/{Math.max(trace.length, 1)}
          </span>
        </div>

        {current ? (
          <>
            <div style={S.blueprintPhaseRow}>
              <span
                style={{
                  ...S.phasePill,
                  background: phaseTone[current.phase]?.background || "var(--surface-1)",
                  color: phaseTone[current.phase]?.color || "var(--dim)",
                }}
              >
                {current.phase}
              </span>
              {current.iteration !== undefined ? <span style={S.blueprintTopMeta}>iteration {current.iteration}</span> : null}
            </div>

            <div style={S.execCard}>
              <pre style={S.blueprintCardCode}>{current.card}</pre>
            </div>

            {current.arr ? (
              <div style={S.blueprintArrayRow}>
                {current.arr.map((value, index) => {
                  const isLeft = current.pointers?.left === index;
                  const isRight = current.pointers?.right === index;
                  const hasWindow =
                    current.pointers?.left !== undefined &&
                    current.pointers?.right !== undefined &&
                    index >= current.pointers.left &&
                    index <= current.pointers.right;

                  return (
                    <div key={index} style={S.blueprintArrayCellWrap}>
                      <div
                        style={{
                          ...S.blueprintArrayCell,
                          background: hasWindow ? "var(--accent-fill-soft)" : "var(--surface-1)",
                          borderColor: isLeft
                            ? "var(--text-accent-cool)"
                            : isRight
                              ? "var(--accent-pink)"
                              : hasWindow
                                ? "var(--accent-ring-soft)"
                                : "var(--border)",
                        }}
                      >
                        {String(value)}
                      </div>
                      <span style={S.blueprintArrayMarker}>{isLeft && isRight ? "L,R" : isLeft ? "L" : isRight ? "R" : ""}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div style={S.stateBox}>
              <div style={S.blueprintStateLabel}>state</div>
              <div style={S.blueprintStateVars}>
                {Object.entries(current.state || {})
                  .filter(([key, value]) => key !== "seen" || typeof value === "string")
                  .map(([key, value]) => (
                    <div key={key} style={S.stateVar}>
                      <span style={{ color: "var(--dim)" }}>{key}</span>
                      <span style={{ color: "var(--text-strong)", fontWeight: 700 }}>
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {current.result !== undefined ? (
              <div style={S.blueprintResultPill}>result: {JSON.stringify(current.result)}</div>
            ) : null}
          </>
        ) : null}

        <div data-tutorial-anchor="blueprint-step-navigator" style={S.stepControls}>
          <button className="tap-target" onClick={() => setStep(0)} disabled={step === 0} style={{ ...S.stepBtn, opacity: step === 0 ? 0.4 : 1 }}>
            first
          </button>
          <button className="tap-target" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ ...S.stepBtn, opacity: step === 0 ? 0.4 : 1 }}>
            prev
          </button>
          <button
            className="tap-target"
            onClick={() => setStep(Math.min(trace.length - 1, step + 1))}
            disabled={step >= trace.length - 1}
            style={{ ...S.stepBtn, opacity: step >= trace.length - 1 ? 0.4 : 1 }}
          >
            next
          </button>
          <button
            className="tap-target"
            onClick={() => setStep(Math.max(trace.length - 1, 0))}
            disabled={step >= trace.length - 1}
            style={{ ...S.stepBtn, opacity: step >= trace.length - 1 ? 0.4 : 1 }}
          >
            last
          </button>
        </div>
      </div>

      <div style={S.resultsPanel}>
        <div style={S.execLabel}>test cases</div>
        {testResults?.map((result, index) => (
          <div key={index} style={{ ...S.testRow, borderLeftColor: result.passed ? "var(--accent)" : "var(--danger)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
              <span style={{ ...S.blueprintNodeMeta, fontSize: 13 }}>case {index + 1}</span>
              <span style={{ ...S.blueprintNodeMeta, fontSize: 13, color: result.passed ? "var(--accent)" : "var(--danger)" }}>
                {result.passed ? "pass" : "fail"}
              </span>
            </div>
            <div style={S.blueprintTestBody}>
              <div style={S.blueprintTestLine}>input: {JSON.stringify(result.input)}</div>
              <div style={S.blueprintTestLine}>expected: {JSON.stringify(result.expected)}</div>
              {!result.passed ? <div style={{ ...S.blueprintTestLine, color: "var(--danger)" }}>got: {JSON.stringify(result.got)}</div> : null}
            </div>
          </div>
        ))}
      </div>

      {!allPassed && divergence ? (
        <div style={{ ...S.feedbackBox, borderColor: "var(--warn-ring-soft)", background: "var(--warn-fill-soft)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--warn)", marginBottom: 8 }}>Where it diverged</div>
          <p style={S.blueprintFeedbackText}>
            Divergence at step {divergence.step + 1} in {divergence.player?.phase || "unknown"} phase.
          </p>
          <p style={S.blueprintFeedbackText}>
            Check card order in the {divergence.player?.phase || "current"} slot.
          </p>
        </div>
      ) : null}

      {allPassed ? (
        <div
          data-tutorial-anchor="blueprint-stars-info"
          style={{ ...S.feedbackBox, borderColor: "var(--accent-ring-soft)", background: "var(--accent-fill-soft)" }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)", textAlign: "center" }}>Blueprint Correct</div>
          <div style={S.blueprintStarRow}>
            {[1, 2, 3].map((n) => (
              <span key={n} style={{ ...S.blueprintStar, color: n <= Number(runSummary?.stars || 0) ? "var(--warn)" : "var(--faint)" }}>
                *
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            <div>1 star: complete the level</div>
            <div style={{ color: runSummary?.underTime ? "var(--accent)" : "var(--dim)" }}>
              +1 star: finish under {formatElapsed((runSummary?.timeLimitSec || 0) * 1000)} ({formatElapsed(runSummary?.elapsedMs)})
            </div>
            <div style={{ color: runSummary?.noHintBonus ? "var(--accent)" : "var(--dim)" }}>
              +1 star: no hint button usage
            </div>
          </div>
        </div>
      ) : null}

      <div style={S.actionBar}>
        {!allPassed ? (
          <>
            <button className="tap-target" onClick={onBackToBuild} style={S.resetBtn}>
              edit blueprint
            </button>
            <button className="tap-target" onClick={onReset} style={S.resetBtn}>
              reset all
            </button>
          </>
        ) : (
          <button className="tap-target" onClick={onComplete} style={{ ...S.startBtn, padding: "10px 20px" }}>
            continue
          </button>
        )}
      </div>
    </div>
  );
}
