import { useEffect, useRef, useState } from "react";
import type { PostureMetrics } from "../lib/postureMetrics";
import type { PostureBaseline } from "../lib/postureBaseline";
import { computeDeviation, type PostureDeviation, type PostureState, type Sensitivity } from "../lib/postureScore";

// A raw state must hold steady this long before it's "committed" — otherwise a
// half-second glance at the screen flips GOOD/WARNING/BAD back and forth.
const DEBOUNCE_MS = 500;

export interface PostureStateResult {
  deviation: PostureDeviation | null;
  smoothedState: PostureState | null;
  badDurationMs: number;
  shouldAlert: boolean;
}

const EMPTY_RESULT: PostureStateResult = {
  deviation: null,
  smoothedState: null,
  badDurationMs: 0,
  shouldAlert: false,
};

/**
 * Diffs live posture metrics against the calibrated baseline every time new
 * metrics arrive, debounces the resulting GOOD/WARNING/BAD state, and tracks
 * how long BAD has been continuously held so callers can decide when to alert.
 */
export function usePostureState(
  metrics: PostureMetrics | null,
  baseline: PostureBaseline | null,
  sensitivity: Sensitivity,
  alertAfterMs: number,
): PostureStateResult {
  const [result, setResult] = useState<PostureStateResult>(EMPTY_RESULT);

  const pendingStateRef = useRef<PostureState | null>(null);
  const pendingSinceRef = useRef(0);
  const smoothedStateRef = useRef<PostureState | null>(null);
  const badSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!metrics || !baseline) {
      pendingStateRef.current = null;
      smoothedStateRef.current = null;
      badSinceRef.current = null;
      setResult(EMPTY_RESULT);
      return;
    }

    const now = performance.now();
    const deviation = computeDeviation(metrics, baseline, sensitivity);

    if (deviation.state !== pendingStateRef.current) {
      pendingStateRef.current = deviation.state;
      pendingSinceRef.current = now;
    }
    if (smoothedStateRef.current !== pendingStateRef.current && now - pendingSinceRef.current >= DEBOUNCE_MS) {
      smoothedStateRef.current = pendingStateRef.current;
    }
    const smoothedState = smoothedStateRef.current ?? deviation.state;

    if (smoothedState === "BAD") {
      if (badSinceRef.current === null) badSinceRef.current = now;
    } else {
      badSinceRef.current = null;
    }
    const badDurationMs = badSinceRef.current !== null ? now - badSinceRef.current : 0;

    setResult({ deviation, smoothedState, badDurationMs, shouldAlert: badDurationMs >= alertAfterMs });
  }, [metrics, baseline, sensitivity, alertAfterMs]);

  return result;
}
