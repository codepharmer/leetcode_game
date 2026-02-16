import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { S } from "../../styles";
import { TutorialSpotlight } from "./TutorialSpotlight";
import { TutorialTooltip } from "./TutorialTooltip";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveTargetElement(targetRef, targetSelector) {
  if (targetRef?.current instanceof Element) return targetRef.current;
  if (!targetSelector || typeof document === "undefined") return null;
  return document.querySelector(targetSelector);
}

function measureRect(targetRef, targetSelector) {
  const element = resolveTargetElement(targetRef, targetSelector);
  if (!element || typeof element.getBoundingClientRect !== "function") return null;
  const rect = element.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function getTooltipPosition({ kind, rect, placement = "bottom" }) {
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const maxWidth = Math.min(380, viewportWidth - 24);
  const spacing = 14;

  if (!rect) {
    return {
      width: maxWidth,
      left: Math.max(12, Math.round((viewportWidth - maxWidth) / 2)),
      top: kind === "tip" ? 18 : Math.max(14, Math.round((viewportHeight - 220) / 2)),
      placement: "center",
    };
  }

  const centerLeft = clamp(Math.round(rect.left + rect.width / 2 - maxWidth / 2), 8, viewportWidth - maxWidth - 8);
  const bottomTop = clamp(Math.round(rect.bottom + spacing), 8, viewportHeight - 180);
  const topTop = clamp(Math.round(rect.top - spacing - 172), 8, viewportHeight - 180);
  const leftLeft = clamp(Math.round(rect.left - maxWidth - spacing), 8, viewportWidth - maxWidth - 8);
  const rightLeft = clamp(Math.round(rect.right + spacing), 8, viewportWidth - maxWidth - 8);
  const middleTop = clamp(Math.round(rect.top + rect.height / 2 - 86), 8, viewportHeight - 180);

  if (placement === "top") {
    return { width: maxWidth, left: centerLeft, top: topTop, placement };
  }
  if (placement === "left") {
    return { width: maxWidth, left: leftLeft, top: middleTop, placement };
  }
  if (placement === "right") {
    return { width: maxWidth, left: rightLeft, top: middleTop, placement };
  }
  return { width: maxWidth, left: centerLeft, top: bottomTop, placement: "bottom" };
}

export function TutorialOverlay({
  open,
  kind = "flow",
  title = "",
  body = "",
  stepIndex = 0,
  totalSteps = 0,
  targetRef = null,
  targetSelector = "",
  placement = "bottom",
  onNext = () => {},
  onSkip = () => {},
  onDontShowAgain = () => {},
  onDismiss = () => {},
}) {
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (!open) {
      setTargetRect(null);
      return undefined;
    }

    const refresh = () => {
      setTargetRect(measureRect(targetRef, targetSelector));
    };

    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    const intervalId = window.setInterval(refresh, 550);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
      window.clearInterval(intervalId);
    };
  }, [open, targetRef, targetSelector]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (kind === "tip") {
        onDismiss("escape");
      } else {
        onSkip("escape");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [kind, onDismiss, onSkip, open]);

  const tooltipPosition = useMemo(
    () => getTooltipPosition({ kind, rect: targetRect, placement }),
    [kind, placement, targetRect]
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div style={S.tutorialLayer}>
      {kind === "flow" ? (
        <>
          {!targetRect ? <div aria-hidden="true" style={S.tutorialBackdrop} /> : null}
          <TutorialSpotlight rect={targetRect} />
        </>
      ) : null}
      <div
        style={{
          ...S.tutorialTooltipWrap,
          left: tooltipPosition.left,
          top: tooltipPosition.top,
          width: tooltipPosition.width,
        }}
      >
        <TutorialTooltip
          kind={kind}
          title={title}
          body={body}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          placement={tooltipPosition.placement}
          onNext={onNext}
          onSkip={onSkip}
          onDontShowAgain={onDontShowAgain}
          onDismiss={onDismiss}
        />
      </div>
    </div>,
    document.body
  );
}
