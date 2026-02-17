import { useEffect, useRef } from "react";

import { S } from "../../styles";

function TutorialTooltipArrow({ placement }) {
  if (!placement || placement === "center") return null;

  const isTop = placement === "top";
  const isBottom = placement === "bottom";
  const isLeft = placement === "left";
  const isRight = placement === "right";

  const style = {
    ...S.tutorialTooltipArrow,
    top: isTop ? "100%" : isBottom ? -5 : "50%",
    left: isLeft ? "100%" : isRight ? -5 : "50%",
    transform: isTop
      ? "translate(-50%, -50%) rotate(45deg)"
      : isBottom
        ? "translate(-50%, -50%) rotate(45deg)"
        : isLeft
          ? "translate(-50%, -50%) rotate(45deg)"
          : "translate(-50%, -50%) rotate(45deg)",
  };

  return <span aria-hidden="true" style={style} />;
}

export function TutorialTooltip({
  kind = "flow",
  title = "",
  body = "",
  stepIndex = 0,
  totalSteps = 0,
  placement = "bottom",
  onNext = () => {},
  onSkip = () => {},
  onDontShowAgain = () => {},
  onDismiss = () => {},
}) {
  const nextBtnRef = useRef(null);

  useEffect(() => {
    if (kind !== "flow") return;
    const id = window.setTimeout(() => {
      nextBtnRef.current?.focus?.();
    }, 0);
    return () => window.clearTimeout(id);
  }, [kind, stepIndex, title]);

  if (kind === "tip") {
    return (
      <div
        className="tap-target"
        role="dialog"
        aria-modal="false"
        style={S.tutorialTip}
        onClick={() => onDismiss("tap")}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onDismiss("tap");
        }}
        tabIndex={0}
      >
        <div style={S.tutorialTipTitle}>{title}</div>
        <div style={S.tutorialTipBody}>{body}</div>
        <div style={S.tutorialTipHint}>Tap or press Escape to dismiss</div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="false" style={S.tutorialTooltip}>
      <TutorialTooltipArrow placement={placement} />
      {title ? <div style={S.tutorialTooltipTitle}>{title}</div> : null}
      <div style={S.tutorialTooltipBody}>{body}</div>
      <div style={S.tutorialTooltipMeta}>
        Step {Math.max(1, stepIndex + 1)} of {Math.max(1, totalSteps)}
      </div>
      <div style={S.tutorialTooltipActions}>
        <button className="tap-target" type="button" onClick={onSkip} style={S.tutorialTooltipGhostBtn}>
          Skip
        </button>
        <button className="tap-target" type="button" onClick={onDontShowAgain} style={S.tutorialTooltipGhostBtn}>
          Don't show again
        </button>
        <button className="tap-target" ref={nextBtnRef} type="button" onClick={onNext} style={S.tutorialTooltipNextBtn}>
          Next
        </button>
      </div>
      <div aria-live="polite" style={S.tutorialLiveRegion}>
        {title}. {body}
      </div>
    </div>
  );
}
