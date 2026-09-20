export const BASELINE_UPDATED_EVENT = "posture-baseline-updated";

export type OverlayStage = "idle" | "peek" | "full";
export type OverlayMood = "bad" | "happy";

// Tuned down from the spec's original 3s/5s after live testing felt too
// slow — peek fires fast enough to read as "reacting to me", full escalation
// still waits long enough that a quick glance at the screen doesn't trigger
// it. Easy to retune here if it overshoots the other way.
export const PEEK_MS = 1200;
export const FULL_MS = 4000;
export const HAPPY_HOLD_MS = 1500;
