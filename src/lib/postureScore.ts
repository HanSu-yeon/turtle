import type { PostureMetrics } from "./postureMetrics";
import type { PostureBaseline } from "./postureBaseline";

export type PostureState = "GOOD" | "WARNING" | "BAD";

export interface Sensitivity {
  key: "loose" | "normal" | "sensitive";
  label: string;
  warningThreshold: number;
  badThreshold: number;
}

// Deviation score is a unitless blend of normalized signals. Weights favor
// head-drop (looking down) and face-size growth (leaning toward the screen)
// since those are the clearest turtle-neck signals from this landmark set;
// sideways lean and raw position shift are secondary. Tuned empirically —
// adjust here while testing against the debug panel, not by guessing blind.
const WEIGHTS = {
  headShift: 1.0,
  sizeRatio: 1.5,
  drop: 1.5,
  lean: 0.5,
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
  const score =
    WEIGHTS.headShift * headShift +
    WEIGHTS.sizeRatio * Math.max(0, sizeRatio - 1) +
    WEIGHTS.drop * Math.max(0, dropDelta) +
    WEIGHTS.lean * Math.abs(leanDelta);

  const state: PostureState =
    score >= sensitivity.badThreshold ? "BAD" : score >= sensitivity.warningThreshold ? "WARNING" : "GOOD";

  return { headShift, sizeRatio, dropDelta, leanDelta, score, state };
}
