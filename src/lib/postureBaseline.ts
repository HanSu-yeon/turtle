import type { PostureMetrics } from "./postureMetrics";

export interface PostureBaseline {
  faceCenter: { x: number; y: number };
  shoulderCenter: { x: number; y: number };
  earDistance: number;
  eyeDistance: number;
  headDropRatio: number;
  headLeanRatio: number;
  capturedAt: number;
}

export function averageBaseline(samples: PostureMetrics[]): PostureBaseline {
  const n = samples.length;
  const sum = samples.reduce(
    (acc, m) => ({
      faceCenterX: acc.faceCenterX + m.faceCenter.x,
      faceCenterY: acc.faceCenterY + m.faceCenter.y,
      shoulderCenterX: acc.shoulderCenterX + m.shoulderCenter.x,
      shoulderCenterY: acc.shoulderCenterY + m.shoulderCenter.y,
      earDistance: acc.earDistance + m.earDistance,
      eyeDistance: acc.eyeDistance + m.eyeDistance,
      headDropRatio: acc.headDropRatio + m.headDropRatio,
      headLeanRatio: acc.headLeanRatio + m.headLeanRatio,
    }),
    {
      faceCenterX: 0,
      faceCenterY: 0,
      shoulderCenterX: 0,
      shoulderCenterY: 0,
      earDistance: 0,
      eyeDistance: 0,
      headDropRatio: 0,
      headLeanRatio: 0,
    },
  );

  return {
    faceCenter: { x: sum.faceCenterX / n, y: sum.faceCenterY / n },
    shoulderCenter: { x: sum.shoulderCenterX / n, y: sum.shoulderCenterY / n },
    earDistance: sum.earDistance / n,
    eyeDistance: sum.eyeDistance / n,
    headDropRatio: sum.headDropRatio / n,
    headLeanRatio: sum.headLeanRatio / n,
    capturedAt: Date.now(),
  };
}

const STORAGE_KEY = "turtle.baseline.v1";

export function saveBaseline(baseline: PostureBaseline) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline));
}

export function loadBaseline(): PostureBaseline | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PostureBaseline;
  } catch {
    return null;
  }
}

export function clearBaseline() {
  localStorage.removeItem(STORAGE_KEY);
}
