import type { CameraStatus } from "../hooks/useCamera";
import type { ModelStatus } from "../hooks/usePostureDetection";
import type { PostureState } from "./postureScore";
import type { OverlayStage, OverlayMood } from "./overlayEvents";

export const OVERLAY_DEBUG_EVENT = "posture-overlay-debug";

export interface OverlayDebugPayload {
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  hasBaseline: boolean;
  confidence: number | null;
  smoothedState: PostureState | null;
  badDurationMs: number;
  stage: OverlayStage;
  mood: OverlayMood;
}
