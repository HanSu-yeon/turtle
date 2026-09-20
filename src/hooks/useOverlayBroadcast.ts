import { useEffect, useRef } from "react";
import { emit } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../lib/tauriRuntime";
import type { PostureStateResult } from "./usePostureState";
import {
  OVERLAY_EVENT,
  PEEK_MS,
  FULL_MS,
  HAPPY_HOLD_MS,
  type OverlayPayload,
  type OverlayStage,
} from "../lib/overlayEvents";

/**
 * Drives the overlay purely off how long BAD has been continuously held
 * (state.badDurationMs) plus a one-shot recovery hold/descend timer — no
 * button, no dismiss, the character itself is the notification (per the
 * interaction spec). A blip that never reaches PEEK_MS never touches the
 * overlay at all.
 */
export function useOverlayBroadcast(state: PostureStateResult) {
  const lastSentRef = useRef<OverlayPayload | null>(null);
  const wasShownForBadRef = useRef(false);
  const recoveryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    function send(payload: OverlayPayload) {
      const last = lastSentRef.current;
      if (last && last.stage === payload.stage && last.mood === payload.mood) return;
      lastSentRef.current = payload;
      void emit(OVERLAY_EVENT, payload);
    }

    if (state.smoothedState === "BAD") {
      if (recoveryTimeoutRef.current !== null) {
        window.clearTimeout(recoveryTimeoutRef.current);
        recoveryTimeoutRef.current = null;
      }
      let stage: OverlayStage = "idle";
      if (state.badDurationMs >= FULL_MS) stage = "full";
      else if (state.badDurationMs >= PEEK_MS) stage = "peek";

      if (stage !== "idle") wasShownForBadRef.current = true;
      send({ stage, mood: "bad" });
    } else if (wasShownForBadRef.current && recoveryTimeoutRef.current === null) {
      // Just recovered to GOOD (or bounced through WARNING) after the
      // character had appeared — show the happy pose, hold, then descend.
      send({ stage: "full", mood: "happy" });
      recoveryTimeoutRef.current = window.setTimeout(() => {
        wasShownForBadRef.current = false;
        recoveryTimeoutRef.current = null;
        send({ stage: "idle", mood: "happy" });
      }, HAPPY_HOLD_MS);
    }
  }, [state.smoothedState, state.badDurationMs]);

  useEffect(
    () => () => {
      if (recoveryTimeoutRef.current !== null) window.clearTimeout(recoveryTimeoutRef.current);
    },
    [],
  );
}
