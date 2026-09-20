import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../lib/tauriRuntime";
import { OVERLAY_DEBUG_EVENT, type OverlayDebugPayload } from "../lib/overlayDebugEvent";

function row(label: string, value: string) {
  return (
    <div className="debug-row" key={label}>
      <span className="debug-label">{label}</span>
      <span className="debug-value">{value}</span>
    </div>
  );
}

/**
 * Since Phase 4's real detection engine lives in the (invisible,
 * headless) overlay window, this is the only window into whether it's
 * actually working — camera permission, model load, and live state.
 */
export function OverlayEngineStatus() {
  const [debug, setDebug] = useState<OverlayDebugPayload | null>(null);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    const unlisten = listen<OverlayDebugPayload>(OVERLAY_DEBUG_EVENT, (event) => {
      setDebug(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  return (
    <div className="debug-panel">
      <h2>오버레이 엔진 상태</h2>
      {!isTauriRuntime() && <p className="debug-hint">네이티브 앱에서만 확인 가능해요.</p>}
      {isTauriRuntime() && !debug && <p className="debug-hint">아직 신호 없음 — 오버레이 창이 아직 안 떴을 수 있어요.</p>}
      {debug && (
        <>
          {row("카메라 상태", debug.cameraStatus)}
          {row("모델 상태", debug.modelStatus)}
          {row("기준 자세 있음", debug.hasBaseline ? "예" : "아니오 — 캘리브레이션 필요")}
          {row("얼굴 인식 신뢰도", debug.confidence !== null ? debug.confidence.toFixed(2) : "—")}
          {row("자세 상태", debug.smoothedState ?? "—")}
          {row("BAD 지속 시간", `${(debug.badDurationMs / 1000).toFixed(1)}s`)}
          {row("오버레이 단계", `${debug.stage} / ${debug.mood}`)}
        </>
      )}
    </div>
  );
}
