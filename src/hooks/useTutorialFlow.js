import { useCallback, useEffect, useMemo, useRef } from "react";

import { ONBOARDING_STATUS } from "../lib/progressModel";

function normalizeFlowState(flowState) {
  const status = flowState?.status || ONBOARDING_STATUS.NOT_STARTED;
  const parsedLastStep = Number.parseInt(String(flowState?.lastStep ?? -1), 10);
  return {
    status,
    lastStep: Number.isFinite(parsedLastStep) ? Math.max(-1, parsedLastStep) : -1,
  };
}

function isStepReady(step, context) {
  if (!step) return false;
  if (typeof step.isReady !== "function") return true;
  try {
    return step.isReady(context);
  } catch (error) {
    return false;
  }
}

export function useTutorialFlow({
  flowKey,
  flowState,
  steps = [],
  context = {},
  autoStart = false,
  updateFlowState = () => {},
  onStarted = () => {},
  onStepCompleted = () => {},
  onCompleted = () => {},
  onSkipped = () => {},
}) {
  const normalizedFlow = normalizeFlowState(flowState);
  const startedAtRef = useRef(null);

  const stepIndex = normalizedFlow.lastStep + 1;
  const currentStep = steps[stepIndex] || null;
  const ready = isStepReady(currentStep, context);
  const isOpen = normalizedFlow.status === ONBOARDING_STATUS.IN_PROGRESS && !!currentStep && ready;

  const start = useCallback(
    ({ forceRestart = false, source = "manual" } = {}) => {
      const current = normalizeFlowState(flowState);
      const isFinalized =
        current.status === ONBOARDING_STATUS.COMPLETED || current.status === ONBOARDING_STATUS.SKIPPED;
      if (!forceRestart && (current.status === ONBOARDING_STATUS.IN_PROGRESS || isFinalized)) return false;

      const nextFlow = {
        status: ONBOARDING_STATUS.IN_PROGRESS,
        lastStep: forceRestart ? -1 : current.lastStep,
      };
      updateFlowState(flowKey, nextFlow);
      startedAtRef.current = Date.now();
      onStarted({
        flow: flowKey,
        source,
        totalSteps: steps.length,
      });
      return true;
    },
    [flowKey, flowState, onStarted, steps.length, updateFlowState]
  );

  const replay = useCallback(() => start({ forceRestart: true, source: "replay" }), [start]);

  useEffect(() => {
    if (!autoStart) return;
    if (normalizedFlow.status !== ONBOARDING_STATUS.NOT_STARTED) return;
    start({ source: "auto" });
  }, [autoStart, normalizedFlow.status, start]);

  useEffect(() => {
    if (normalizedFlow.status !== ONBOARDING_STATUS.IN_PROGRESS) return;
    if (startedAtRef.current) return;
    startedAtRef.current = Date.now();
  }, [normalizedFlow.status]);

  const next = useCallback(() => {
    const current = normalizeFlowState(flowState);
    if (current.status !== ONBOARDING_STATUS.IN_PROGRESS) return false;

    const nextIndex = current.lastStep + 1;
    const step = steps[nextIndex];
    if (!step) return false;

    const stepName = String(step.name || step.id || `step_${nextIndex}`);
    onStepCompleted({
      flow: flowKey,
      stepIndex: nextIndex,
      stepName,
    });

    const isLast = nextIndex >= steps.length - 1;
    if (isLast) {
      updateFlowState(flowKey, {
        status: ONBOARDING_STATUS.COMPLETED,
        lastStep: nextIndex,
      });
      const startedAt = Number(startedAtRef.current || Date.now());
      onCompleted({
        flow: flowKey,
        totalSteps: steps.length,
        durationMs: Math.max(0, Date.now() - startedAt),
      });
      return true;
    }

    updateFlowState(flowKey, {
      status: ONBOARDING_STATUS.IN_PROGRESS,
      lastStep: nextIndex,
    });
    return true;
  }, [flowKey, flowState, onCompleted, onStepCompleted, steps, updateFlowState]);

  const skip = useCallback(
    (reason = "skip") => {
      const current = normalizeFlowState(flowState);
      const atStep = Math.max(0, current.lastStep + 1);
      updateFlowState(flowKey, {
        status: ONBOARDING_STATUS.SKIPPED,
        lastStep: current.lastStep,
      });
      onSkipped({
        flow: flowKey,
        atStep,
        reason,
      });
    },
    [flowKey, flowState, onSkipped, updateFlowState]
  );

  const dontShowAgain = useCallback(() => skip("dont_show_again"), [skip]);

  return useMemo(
    () => ({
      status: normalizedFlow.status,
      lastStep: normalizedFlow.lastStep,
      isOpen,
      stepIndex,
      totalSteps: steps.length,
      currentStep,
      start,
      replay,
      next,
      skip,
      dontShowAgain,
    }),
    [
      currentStep,
      dontShowAgain,
      isOpen,
      next,
      normalizedFlow.lastStep,
      normalizedFlow.status,
      replay,
      skip,
      start,
      stepIndex,
      steps.length,
    ]
  );
}
