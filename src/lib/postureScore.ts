import type { PostureMetrics } from "./postureMetrics";
import type { PostureBaseline } from "./postureBaseline";

export type PostureState = "GOOD" | "WARNING" | "BAD";

export interface Sensitivity {
  key: "loose" | "normal" | "sensitive";
  label: string;
  warningThreshold: number;
  badThreshold: number;
}

// Deviation score only reacts to signals that actually mean turtle-neck:
// leaning toward the screen (face growing larger) and dropping the head.
// headShift (raw position shift) and lean (sideways tilt) are still computed
// below for the debug panel, but deliberately excluded from the score —
// they fired on repositioning in the frame or tilting your head sideways,
// neither of which is the "목이 나왔어요" this app is meant to catch.
const WEIGHTS = {
  sizeRatio: 1.5,
  drop: 1.5,
};

export const SENSITIVITY_PRESETS: Record<Sensitivity["key"], Sensitivity> = {
  loose: { key: "loose", label: "느슨하게", warningThreshold: 0.35, badThreshold: 0.55 },
  normal: { key: "normal", label: "보통", warningThreshold: 0.25, badThreshold: 0.4 },
  sensitive: { key: "sensitive", label: "민감하게", warningThreshold: 0.15, badThreshold: 0.28 },
};

export interface PostureDeviation {
  headShift: number;
  sizeRatio: number;
  dropDelta: number;
  leanDelta: number;
  score: number;
  state: PostureState;
}

export function computeDeviation(
  current: PostureMetrics,
  baseline: PostureBaseline,
  sensitivity: Sensitivity,
): PostureDeviation {
  const headShift = Math.hypot(
    current.faceCenter.x - baseline.faceCenter.x,
    current.faceCenter.y - baseline.faceCenter.y,
  );
  const sizeRatio = current.earDistance / (baseline.earDistance || 1e-6);
  const dropDelta = current.headDropRatio - baseline.headDropRatio;
  const leanDelta = current.headLeanRatio - baseline.headLeanRatio;

  // Only penalize leaning IN (sizeRatio > 1) and dropping DOWN (dropDelta > 0) —
  // sitting back further or tilting the head up isn't the problem this app watches for.
  const score = WEIGHTS.sizeRatio * Math.max(0, sizeRatio - 1) + WEIGHTS.drop * Math.max(0, dropDelta);

  const state: PostureState =
    score >= sensitivity.badThreshold ? "BAD" : score >= sensitivity.warningThreshold ? "WARNING" : "GOOD";

  return { headShift, sizeRatio, dropDelta, leanDelta, score, state };
}
