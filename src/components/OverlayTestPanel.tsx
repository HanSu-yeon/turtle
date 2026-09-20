import { emit } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../lib/tauriRuntime";
import { OVERLAY_EVENT, WARNING_MESSAGE, HAPPY_MESSAGE, type OverlayPayload } from "../lib/overlayEvents";

// Sustaining BAD posture for the full alert delay every time is slow to test
// manually — this lets Phase 4's actual question ("does the overlay show up
// over other apps?") get answered without waiting on the camera at all.
export function OverlayTestPanel() {
  function send(payload: OverlayPayload) {
    void emit(OVERLAY_EVENT, payload);
  }

  if (!isTauriRuntime()) {
    return <p className="debug-hint">오버레이 테스트는 네이티브 앱에서만 동작해요 (Tauri 런타임 필요).</p>;
  }

  return (
    <div className="overlay-test-panel">
      <button onClick={() => send({ visible: true, mood: "warning", message: WARNING_MESSAGE })}>
        경고 오버레이 테스트
      </button>
      <button onClick={() => send({ visible: true, mood: "happy", message: HAPPY_MESSAGE })}>
        칭찬 오버레이 테스트
      </button>
      <button onClick={() => send({ visible: false, mood: "happy", message: "" })}>오버레이 숨기기</button>
    </div>
  );
}
