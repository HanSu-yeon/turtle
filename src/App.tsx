import { useCallback, useRef, useState } from "react";
import { emit } from "@tauri-apps/api/event";
import { useCamera } from "./hooks/useCamera";
import { usePostureDetection } from "./hooks/usePostureDetection";
import { usePostureState } from "./hooks/usePostureState";
import { useTrayDetectionToggle } from "./hooks/useTrayDetectionToggle";
import { PoseOverlay } from "./components/PoseOverlay";
import { DebugPanel } from "./components/DebugPanel";
import { Calibration } from "./components/Calibration";
import { PostureStatus } from "./components/PostureStatus";
import { OverlayEngineStatus } from "./components/OverlayEngineStatus";
import { loadBaseline, saveBaseline, type PostureBaseline } from "./lib/postureBaseline";
import { SENSITIVITY_PRESETS, type Sensitivity } from "./lib/postureScore";
import { BASELINE_UPDATED_EVENT } from "./lib/overlayEvents";
import { isTauriRuntime } from "./lib/tauriRuntime";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const sensitivity = SENSITIVITY_PRESETS[sensitivityKey];

  const postureState = usePostureState(metrics, baseline, sensitivity, alertAfterMs);

  const handleCalibrationComplete = useCallback((next: PostureBaseline) => {
    setBaseline(next);
    saveBaseline(next);
    // The overlay window runs its own independent detection engine (see
    // OverlayApp) — it needs to hear about a fresh calibration explicitly
    // rather than re-reading localStorage on its own.
    if (isTauriRuntime()) void emit(BASELINE_UPDATED_EVENT, next);
  }, []);

  return (
    <main className="app">
      <header className="app-header">
        <h1>🐢 꼬북이</h1>
        <p>
          카메라로 자세를 확인하고, 목이 앞으로 나오면 화면 오른쪽 아래에 꼬북이가 나타나요. 이 창을 닫아도 꼬북이는
          계속 지켜보고 있어요 — 메뉴바 아이콘에서 다시 열 수 있어요.
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
              <button onClick={start}>{cameraStatus === "requesting" ? "요청 중…" : "카메라 켜기"}</button>
            ) : (
              <button onClick={stop}>카메라 끄기</button>
            )}
            {cameraStatus === "denied" && (
              <p className="camera-error">
                카메라 권한이 거부됐어요. 시스템 설정 → 개인정보 보호 및 보안 → 카메라에서 꼬북이를 허용한 뒤 다시
                시도해주세요.
              </p>
            )}
            {cameraStatus === "error" && cameraError && <p className="camera-error">{cameraError}</p>}
          </div>

          <Calibration
            latestMetrics={metrics}
            onComplete={handleCalibrationComplete}
            disabled={!isStreaming}
            baseline={baseline}
          />

          <PostureStatus
            baseline={baseline}
            state={postureState}
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivityKey}
            alertAfterMs={alertAfterMs}
            onAlertAfterMsChange={setAlertAfterMs}
          />

          <button className="advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "개발자 정보 숨기기" : "개발자 정보 보기"}
          </button>
        </div>

        {showAdvanced && (
          <div className="debug-column">
            <p className="debug-hint">
              오버레이는 이 창과 별개로 자체 카메라를 켜서 항상 감지 중이에요 (다른 앱을 보고 있어도 반응하도록).
              아래는 이 창만의 감지 결과예요.
            </p>
            <DebugPanel
              modelStatus={modelStatus}
              modelError={modelError}
              metrics={metrics}
              lastInferenceMs={lastInferenceMs}
              postureState={postureState}
              sensitivity={sensitivity}
            />
            <OverlayEngineStatus />
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
