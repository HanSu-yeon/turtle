import { useCallback, useRef, useState } from "react";
import { useCamera } from "./hooks/useCamera";
import { usePostureDetection } from "./hooks/usePostureDetection";
import { usePostureState } from "./hooks/usePostureState";
import { useTrayDetectionToggle } from "./hooks/useTrayDetectionToggle";
import { PoseOverlay } from "./components/PoseOverlay";
import { DebugPanel } from "./components/DebugPanel";
import { Calibration } from "./components/Calibration";
import { PostureStatus } from "./components/PostureStatus";
import { loadBaseline, saveBaseline, type PostureBaseline } from "./lib/postureBaseline";
import { SENSITIVITY_PRESETS, type Sensitivity } from "./lib/postureScore";
import "./App.css";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { status: cameraStatus, error: cameraError, start, stop } = useCamera(videoRef);
  const isStreaming = cameraStatus === "streaming";
  const trayDetectionEnabled = useTrayDetectionToggle();
  // The tray's "자세 감지" checkbox can pause inference (e.g. while the user
  // is in a video call) without stopping the camera stream itself.
  const detectionActive = isStreaming && trayDetectionEnabled;
  const { status: modelStatus, error: modelError, result, metrics, lastInferenceMs } = usePostureDetection(
    videoRef,
    detectionActive,
  );

  const [baseline, setBaseline] = useState<PostureBaseline | null>(() => loadBaseline());
  const [sensitivityKey, setSensitivityKey] = useState<Sensitivity["key"]>("normal");
  const [alertAfterMs, setAlertAfterMs] = useState(5000);
  const sensitivity = SENSITIVITY_PRESETS[sensitivityKey];

  const postureState = usePostureState(metrics, baseline, sensitivity, alertAfterMs);

  const handleCalibrationComplete = useCallback((next: PostureBaseline) => {
    setBaseline(next);
    saveBaseline(next);
  }, []);

  return (
    <main className="app">
      <header className="app-header">
        <h1>🐢 Turtle — Phase 3 Debug</h1>
        <p>
          Webcam + pose landmarks + calibration + posture scoring + background/tray. Closing this window keeps
          Turtle running — reopen it from the menu bar icon.
        </p>
        {!trayDetectionEnabled && (
          <p className="tray-notice">메뉴바에서 자세 감지가 꺼져 있어요. 감지를 다시 켜려면 트레이 메뉴를 확인하세요.</p>
        )}
      </header>

      <div className="app-body">
        <div className="camera-pane">
          <div className="camera-frame" style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}>
            <video ref={videoRef} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} muted playsInline />
            <PoseOverlay result={result} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} />
          </div>

          <div className="camera-controls">
            {!isStreaming ? (
              <button onClick={start}>{cameraStatus === "requesting" ? "Requesting…" : "Start camera"}</button>
            ) : (
              <button onClick={stop}>Stop camera</button>
            )}
            {cameraStatus === "denied" && (
              <p className="camera-error">
                Camera permission was denied. Allow camera access for Turtle in System Settings → Privacy &amp;
                Security → Camera, then try again.
              </p>
            )}
            {cameraStatus === "error" && cameraError && <p className="camera-error">{cameraError}</p>}
          </div>

          <Calibration
            latestMetrics={metrics}
            onComplete={handleCalibrationComplete}
            disabled={!isStreaming}
            hasBaseline={baseline !== null}
          />

          <PostureStatus
            baseline={baseline}
            state={postureState}
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivityKey}
            alertAfterMs={alertAfterMs}
            onAlertAfterMsChange={setAlertAfterMs}
          />
        </div>

        <DebugPanel
          modelStatus={modelStatus}
          modelError={modelError}
          metrics={metrics}
          lastInferenceMs={lastInferenceMs}
        />
      </div>
    </main>
  );
}

export default App;
