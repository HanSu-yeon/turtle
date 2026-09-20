import { useCallback, useRef, useState } from "react";
import { useCamera } from "./hooks/useCamera";
import { usePostureDetection } from "./hooks/usePostureDetection";
import { usePostureState } from "./hooks/usePostureState";
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
  const { status: modelStatus, error: modelError, result, metrics, lastInferenceMs } = usePostureDetection(
    videoRef,
    isStreaming,
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
        <h1>🐢 Turtle — Phase 2 Debug</h1>
        <p>Webcam + pose landmarks + baseline calibration + posture scoring. No overlay/tray yet.</p>
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
