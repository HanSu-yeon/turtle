import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
// TODO: swap for the dedicated "목을 앞으로 길게 내민" (neck-stretched) sprite
// once it's provided — warning.png (surprised face) is a placeholder stand-in.
import badSprite from "./assets/turtle/warning.png";
import happySprite from "./assets/turtle/happy.png";
import { useCamera } from "./hooks/useCamera";
import { usePostureDetection } from "./hooks/usePostureDetection";
import { usePostureState } from "./hooks/usePostureState";
import { useTrayDetectionToggle } from "./hooks/useTrayDetectionToggle";
import { loadBaseline, type PostureBaseline } from "./lib/postureBaseline";
import { SENSITIVITY_PRESETS } from "./lib/postureScore";
import {
  BASELINE_UPDATED_EVENT,
  PEEK_MS,
  FULL_MS,
  HAPPY_HOLD_MS,
  type OverlayStage,
  type OverlayMood,
} from "./lib/overlayEvents";
import "./OverlayApp.css";

const SPRITES = { bad: badSprite, happy: happySprite };

// Shown only for the happy/recovery moment — everything else stays
// text-free per the "character IS the notification" design.
const RECOVERY_MESSAGE = "목 피자~ 팔자 피자~ 🐢";

/**
 * This window is the actual posture-watching engine, not just a display.
 * It owns its own camera capture + detection loop, independent of the main
 * debug window, because this window is always-on-top and therefore never
 * occluded — macOS throttles a WebView's timers hard once another window
 * covers it, which is exactly why running the engine in the (occludable)
 * main window meant posture changes stopped being noticed while some other
 * app was in front.
 */
function OverlayApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { status: cameraStatus, start } = useCamera(videoRef);
  const isStreaming = cameraStatus === "streaming";
  const trayDetectionEnabled = useTrayDetectionToggle();
  const detectionActive = isStreaming && trayDetectionEnabled;

  useEffect(() => {
    // No UI here to click a "start camera" button — permission was already
    // granted via the main window's camera use (same origin, so this
    // shouldn't re-prompt), so just start as soon as the window exists.
    start();
  }, [start]);

  const [baseline, setBaseline] = useState<PostureBaseline | null>(() => loadBaseline());
  useEffect(() => {
    const unlisten = listen<PostureBaseline>(BASELINE_UPDATED_EVENT, (event) => {
      setBaseline(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  const { metrics } = usePostureDetection(videoRef, detectionActive);
  const postureState = usePostureState(metrics, baseline, SENSITIVITY_PRESETS.normal, FULL_MS);

  const [display, setDisplay] = useState<{ stage: OverlayStage; mood: OverlayMood }>({
    stage: "idle",
    mood: "bad",
  });
  const wasShownForBadRef = useRef(false);
  const recoveryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (postureState.smoothedState === "BAD") {
      if (recoveryTimeoutRef.current !== null) {
        window.clearTimeout(recoveryTimeoutRef.current);
        recoveryTimeoutRef.current = null;
      }
      let stage: OverlayStage = "idle";
      if (postureState.badDurationMs >= FULL_MS) stage = "full";
      else if (postureState.badDurationMs >= PEEK_MS) stage = "peek";

      if (stage !== "idle") wasShownForBadRef.current = true;
      setDisplay((prev) => (prev.stage === stage && prev.mood === "bad" ? prev : { stage, mood: "bad" }));
    } else if (wasShownForBadRef.current && recoveryTimeoutRef.current === null) {
      setDisplay({ stage: "full", mood: "happy" });
      recoveryTimeoutRef.current = window.setTimeout(() => {
        wasShownForBadRef.current = false;
        recoveryTimeoutRef.current = null;
        setDisplay({ stage: "idle", mood: "happy" });
      }, HAPPY_HOLD_MS);
    }
  }, [postureState.smoothedState, postureState.badDurationMs]);

  useEffect(
    () => () => {
      if (recoveryTimeoutRef.current !== null) window.clearTimeout(recoveryTimeoutRef.current);
    },
    [],
  );

  return (
    <div className="overlay-stage">
      {/* Hidden — MediaPipe just needs a playing <video> element to read frames from. */}
      <video ref={videoRef} className="overlay-video" muted playsInline />
      <div className="overlay-creature-wrap" data-stage={display.stage}>
        {display.mood === "happy" && display.stage === "full" && (
          <p className="overlay-recovery-message">{RECOVERY_MESSAGE}</p>
        )}
        <img src={SPRITES[display.mood]} alt="" className="overlay-creature" />
      </div>
    </div>
  );
}

export default OverlayApp;
