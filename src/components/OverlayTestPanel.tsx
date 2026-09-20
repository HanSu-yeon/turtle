import { emit } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../lib/tauriRuntime";
import { OVERLAY_EVENT, type OverlayPayload } from "../lib/overlayEvents";

// Sustaining BAD posture for a full 3-5s every time is slow to test manually
// — this lets Phase 4's actual question ("does the overlay show up over
// other apps?") get answered without waiting on the camera at all.
export function OverlayTestPanel() {
  function send(payload: OverlayPayload) {
    void emit(OVERLAY_EVENT, payload);
  }

  if (!isTauriRuntime()) {
    return <p className="debug-hint">오버레이 테스트는 네이티브 앱에서만 동작해요 (Tauri 런타임 필요).</p>;
  }

  return (
    <div className="overlay-test-panel">
      <button onClick={() => send({ stage: "peek", mood: "bad" })}>3초: 머리 빼꼼</button>
      <button onClick={() => send({ stage: "full", mood: "bad" })}>5초: 크게 출몰</button>
      <button onClick={() => send({ stage: "full", mood: "happy" })}>자세 교정: 웃음</button>
      <button onClick={() => send({ stage: "idle", mood: "happy" })}>내려가기</button>
    </div>
  );
}
