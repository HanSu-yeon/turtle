import { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { extractPostureMetrics, type PostureMetrics } from "../lib/postureMetrics";

// MVP target per spec: ~5-10 FPS is plenty for posture tracking and keeps CPU/battery usage low.
const DETECTION_INTERVAL_MS = 125; // ~8 FPS

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type ModelStatus = "loading" | "ready" | "error";

export interface PostureDetectionState {
  status: ModelStatus;
  error: string | null;
  result: PoseLandmarkerResult | null;
  metrics: PostureMetrics | null;
  lastInferenceMs: number | null;
}

/**
 * Runs MediaPipe Pose Landmarker against a live <video> element at a throttled
 * rate and derives the posture metrics Turtle's algorithm needs (head position,
 * face size, vertical drop, shoulder-relative offset).
 */
export function usePostureDetection(videoRef: React.RefObject<HTMLVideoElement | null>, active: boolean) {
  const [state, setState] = useState<PostureDetectionState>({
    status: "loading",
    error: null,
    result: null,
    metrics: null,
    lastInferenceMs: null,
  });

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setState((s) => ({ ...s, status: "ready" }));
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({ ...s, status: "error", error: String(err) }));
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    if (state.status !== "ready") return;

    intervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) return;

      const start = performance.now();
      const result = landmarker.detectForVideo(video, start);
      const elapsed = performance.now() - start;

      const landmarks = result.landmarks[0];
      const metrics = landmarks ? extractPostureMetrics(landmarks) : null;

      setState((s) => ({ ...s, result, metrics, lastInferenceMs: elapsed }));
    }, DETECTION_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, state.status]);

  return state;
}
