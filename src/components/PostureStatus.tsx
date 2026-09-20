import type { PostureBaseline } from "../lib/postureBaseline";
import { SENSITIVITY_PRESETS, type Sensitivity } from "../lib/postureScore";
import type { PostureStateResult } from "../hooks/usePostureState";

interface PostureStatusProps {
  baseline: PostureBaseline | null;
  state: PostureStateResult;
  sensitivity: Sensitivity;
  onSensitivityChange: (key: Sensitivity["key"]) => void;
  alertAfterMs: number;
  onAlertAfterMsChange: (ms: number) => void;
}

const STATE_LABEL: Record<string, string> = {
  GOOD: "GOOD",
  WARNING: "WARNING",
  BAD: "BAD",
};

const ALERT_OPTIONS = [3000, 5000, 10000];

export function PostureStatus({
  baseline,
  state,
  sensitivity,
  onSensitivityChange,
  alertAfterMs,
  onAlertAfterMsChange,
}: PostureStatusProps) {
  if (!baseline) {
    return (
      <div className="posture-status posture-status--empty">
        <p>먼저 기준 자세를 설정해주세요.</p>
      </div>
    );
  }

  const { deviation, smoothedState, badDurationMs, shouldAlert } = state;

  return (
    <div className={`posture-status posture-status--${(smoothedState ?? "good").toLowerCase()}`}>
      <div className="posture-state-badge">{smoothedState ? STATE_LABEL[smoothedState] : "—"}</div>

      <div className="posture-controls">
        <label>
          감도
          <select
            value={sensitivity.key}
            onChange={(e) => onSensitivityChange(e.target.value as Sensitivity["key"])}
          >
            {Object.values(SENSITIVITY_PRESETS).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          알림까지
          <select value={alertAfterMs} onChange={(e) => onAlertAfterMsChange(Number(e.target.value))}>
            {ALERT_OPTIONS.map((ms) => (
              <option key={ms} value={ms}>
                {ms / 1000}초
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="debug-row">
        <span className="debug-label">Score</span>
        <span className="debug-value">
          {deviation ? deviation.score.toFixed(3) : "—"} (경고 {sensitivity.warningThreshold} / 나쁨{" "}
          {sensitivity.badThreshold})
        </span>
      </div>
      <div className="debug-row">
        <span className="debug-label">Head shift</span>
        <span className="debug-value">{deviation ? deviation.headShift.toFixed(3) : "—"}</span>
      </div>
      <div className="debug-row">
        <span className="debug-label">Size ratio</span>
        <span className="debug-value">{deviation ? deviation.sizeRatio.toFixed(3) : "—"}</span>
      </div>
      <div className="debug-row">
        <span className="debug-label">Drop delta</span>
        <span className="debug-value">{deviation ? deviation.dropDelta.toFixed(3) : "—"}</span>
      </div>
      <div className="debug-row">
        <span className="debug-label">Lean delta</span>
        <span className="debug-value">{deviation ? deviation.leanDelta.toFixed(3) : "—"}</span>
      </div>
      <div className="debug-row">
        <span className="debug-label">BAD 지속 시간</span>
        <span className="debug-value">{(badDurationMs / 1000).toFixed(1)}s</span>
      </div>
      {shouldAlert && <div className="posture-alert">🐢 지금이면 거북이가 등장했을 시점이에요</div>}
    </div>
  );
}
