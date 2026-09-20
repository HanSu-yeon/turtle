import { useEffect, useRef } from "react";
import { emit } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../lib/tauriRuntime";
import type { PostureStateResult } from "./usePostureState";
import { OVERLAY_EVENT, WARNING_MESSAGE, HAPPY_MESSAGE, HAPPY_DISPLAY_MS, type OverlayPayload } from "../lib/overlayEvents";

/**
 * Drives the overlay window from the main window's posture state:
 * bad-sustained → show the warning card, recovery afterward → show the
 * happy card briefly, then hide. A brief BAD blip that never crosses the
 * alert threshold never touches the overlay at all (matches spec §7).
 */
export function useOverlayBroadcast(state: PostureStateResult) {
  const wasAlertingRef = useRef(false);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    function send(payload: OverlayPayload) {
      void emit(OVERLAY_EVENT, payload);
    }

    if (state.shouldAlert && !wasAlertingRef.current) {
      wasAlertingRef.current = true;
      if (hideTimeoutRef.current !== null) window.clearTimeout(hideTimeoutRef.current);
      send({ visible: true, mood: "warning", message: WARNING_MESSAGE });
    } else if (!state.shouldAlert && wasAlertingRef.current && state.smoothedState === "GOOD") {
      wasAlertingRef.current = false;
      send({ visible: true, mood: "happy", message: HAPPY_MESSAGE });
      hideTimeoutRef.current = window.setTimeout(() => {
        send({ visible: false, mood: "happy", message: "" });
      }, HAPPY_DISPLAY_MS);
    }
  }, [state.shouldAlert, state.smoothedState]);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current !== null) window.clearTimeout(hideTimeoutRef.current);
    },
    [],
  );
}
