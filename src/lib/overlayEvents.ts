export const OVERLAY_EVENT = "posture-overlay";

export type OverlayStage = "idle" | "peek" | "full";
export type OverlayMood = "bad" | "happy";

export interface OverlayPayload {
  stage: OverlayStage;
  mood: OverlayMood;
}

// Timing straight from the interaction spec: nothing for the first ~3s of
// BAD (ignore momentary slouches), a head peek from 3s, the full character
// from 5s. Recovery holds the happy pose briefly before sliding back down.
export const PEEK_MS = 3000;
export const FULL_MS = 5000;
export const HAPPY_HOLD_MS = 1500;
export const DESCEND_MS = 650;
