import type { PostureMetrics } from "../lib/postureMetrics";
import type { ModelStatus } from "../hooks/usePostureDetection";

interface DebugPanelProps {
  modelStatus: ModelStatus;
  modelError: string | null;
  metrics: PostureMetrics | null;
  lastInferenceMs: number | null;
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

export function DebugPanel({ modelStatus, modelError, metrics, lastInferenceMs }: DebugPanelProps) {
  return (
    <div className="debug-panel">
      <h2>Debug</h2>
      {row("Model status", modelStatus)}
      {modelError && <div className="debug-error">{modelError}</div>}
      {row("Inference time", lastInferenceMs !== null ? `${fmt(lastInferenceMs, 1)} ms` : "—")}
      {row("Confidence", metrics ? fmt(metrics.confidence) : "—")}

      <h3>Raw landmarks (normalized)</h3>
      {row("Nose", metrics ? `${fmt(metrics.nose.x)}, ${fmt(metrics.nose.y)}` : "—")}
      {row("Face center", metrics ? `${fmt(metrics.faceCenter.x)}, ${fmt(metrics.faceCenter.y)}` : "—")}
      {row("Shoulder center", metrics ? `${fmt(metrics.shoulderCenter.x)}, ${fmt(metrics.shoulderCenter.y)}` : "—")}

      <h3>Posture signals</h3>
      {row("Ear distance (face size)", metrics ? fmt(metrics.earDistance) : "—")}
      {row("Eye distance (face size)", metrics ? fmt(metrics.eyeDistance) : "—")}
      {row("Head drop ratio", metrics ? fmt(metrics.headDropRatio) : "—")}
      {row("Head lean ratio", metrics ? fmt(metrics.headLeanRatio) : "—")}

      <p className="debug-hint">
        These four signals (face size, head drop, head lean, and raw position) are what Phase 2's baseline
        calibration will diff against to compute a posture score.
      </p>
    </div>
  );
}
