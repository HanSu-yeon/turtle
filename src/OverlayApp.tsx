import { useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
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
import { OVERLAY_DEBUG_EVENT } from "./lib/overlayDebugEvent";
import "./OverlayApp.css";

const SPRITES = { bad: badSprite, happy: happySprite };

// Only shown at the "full" stage (peek stays wordless per spec) — no
// emoji, kept short and plain per the interaction spec. "피자" instead of
// the grammatically-correct "펴자" is the character's deliberate speech
// quirk, not a typo — don't "fix" it.
const BAD_MESSAGE = "목이 나왔어요";
const RECOVERY_MESSAGE = "목 피자~\n팔자 피자~";
const MESSAGES: Record<OverlayMood, string> = { bad: BAD_MESSAGE, happy: RECOVERY_MESSAGE };

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
  // App.tsx and OverlayApp.tsx are both statically imported into every
  // window (see main.tsx), so a plain CSS rule targeting html/body/#root
  // would leak into the main window too. Apply/undo it imperatively
  // instead, scoped to exactly when this component is actually mounted.
  useEffect(() => {
    const targets = [document.documentElement, document.body, document.getElementById("root")].filter(
      (el): el is HTMLElement => el !== null,
    );
    const previous = targets.map((el) => ({ background: el.style.background, overflow: el.style.overflow }));
    targets.forEach((el) => {
      el.style.background = "transparent";
      el.style.overflow = "hidden";
    });
    return () => {
      targets.forEach((el, i) => {
        el.style.background = previous[i].background;
        el.style.overflow = previous[i].overflow;
      });
    };
  }, []);

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

  const { status: modelStatus, metrics } = usePostureDetection(videoRef, detectionActive);
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
    } else if (
      postureState.smoothedState === "GOOD" &&
      wasShownForBadRef.current &&
      recoveryTimeoutRef.current === null
    ) {
      // Only a real recovery to GOOD dismisses the character — bouncing
      // through WARNING on the way there previously triggered this too,
      // which made the character vanish after only a partial correction.
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

  // This window has no UI to look at, so this is the only way to see what
  // it's actually doing — the main debug window listens and displays it.
  useEffect(() => {
    void emit(OVERLAY_DEBUG_EVENT, {
      cameraStatus,
      modelStatus,
      hasBaseline: baseline !== null,
      confidence: metrics?.confidence ?? null,
      smoothedState: postureState.smoothedState,
      badDurationMs: postureState.badDurationMs,
      stage: display.stage,
      mood: display.mood,
    });
  }, [cameraStatus, modelStatus, baseline, metrics, postureState, display]);

  return (
    <div className="overlay-stage">
      {/* Hidden — MediaPipe just needs a playing <video> element to read frames from. */}
      <video ref={videoRef} className="overlay-video" muted playsInline />
      <div className="overlay-anchor" data-stage={display.stage}>
        <div className="overlay-creature-inner">
          {display.stage === "full" && (
            <div className={`overlay-speech-bubble overlay-speech-bubble--${display.mood}`}>
              {MESSAGES[display.mood].split("\n").map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          )}
          <img src={SPRITES[display.mood]} alt="" className="overlay-creature" />
        </div>
      </div>
    </div>
  );
}

export default OverlayApp;
