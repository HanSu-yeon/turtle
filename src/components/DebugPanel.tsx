import type { PostureMetrics } from "../lib/postureMetrics";
import type { ModelStatus } from "../hooks/usePostureDetection";
import type { PostureStateResult } from "../hooks/usePostureState";
import type { Sensitivity } from "../lib/postureScore";

interface DebugPanelProps {
  modelStatus: ModelStatus;
  modelError: string | null;
  metrics: PostureMetrics | null;
  lastInferenceMs: number | null;
  postureState: PostureStateResult;
  sensitivity: Sensitivity;
}

function row(label: string, value: string) {
  return (
    <div className="debug-row" key={label}>
      <span className="debug-label">{label}</span>
      <span className="debug-value">{value}</span>
    </div>
  );
}

function fmt(n: number, digits = 3) {
  return n.toFixed(digits);
}

export function DebugPanel({
  modelStatus,
  modelError,
  metrics,
  lastInferenceMs,
  postureState,
  sensitivity,
}: DebugPanelProps) {
  const { deviation, badDurationMs } = postureState;

  return (
    <div className="debug-panel">
      <h2>이 창의 감지 상태</h2>
      {row("모델 상태", modelStatus)}
      {modelError && <div className="debug-error">{modelError}</div>}
      {row("추론 시간", lastInferenceMs !== null ? `${fmt(lastInferenceMs, 1)} ms` : "—")}
      {row("신뢰도", metrics ? fmt(metrics.confidence) : "—")}

      <h3>랜드마크 좌표 (정규화)</h3>
      {row("코", metrics ? `${fmt(metrics.nose.x)}, ${fmt(metrics.nose.y)}` : "—")}
      {row("얼굴 중심", metrics ? `${fmt(metrics.faceCenter.x)}, ${fmt(metrics.faceCenter.y)}` : "—")}
      {row("어깨 중심", metrics ? `${fmt(metrics.shoulderCenter.x)}, ${fmt(metrics.shoulderCenter.y)}` : "—")}

      <h3>자세 신호</h3>
      {row("귀 간격 (얼굴 크기)", metrics ? fmt(metrics.earDistance) : "—")}
      {row("눈 간격 (얼굴 크기)", metrics ? fmt(metrics.eyeDistance) : "—")}
      {row("고개 숙임 정도", metrics ? fmt(metrics.headDropRatio) : "—")}
      {row("좌우 기울임 정도", metrics ? fmt(metrics.headLeanRatio) : "—")}

      <p className="debug-hint">
        이 네 가지 값(얼굴 크기, 고개 숙임, 좌우 기울임, 위치)을 기준 자세와 비교해서 자세 점수를 계산해요.
      </p>

      <h3>자세 점수 상세</h3>
      {row(
        "Score",
        deviation
          ? `${fmt(deviation.score)} (경고 ${sensitivity.warningThreshold} / 나쁨 ${sensitivity.badThreshold})`
          : "—",
      )}
      {row("Head shift", deviation ? fmt(deviation.headShift) : "—")}
      {row("Size ratio", deviation ? fmt(deviation.sizeRatio) : "—")}
      {row("Drop delta", deviation ? fmt(deviation.dropDelta) : "—")}
      {row("Lean delta", deviation ? fmt(deviation.leanDelta) : "—")}
      {row("BAD 지속 시간", `${(badDurationMs / 1000).toFixed(1)}s`)}
    </div>
  );
}
