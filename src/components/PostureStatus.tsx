import { useState } from "react";
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

const STATE_COPY: Record<string, { icon: string; label: string }> = {
  GOOD: { icon: "🙂", label: "자세가 좋아요" },
  WARNING: { icon: "😐", label: "목이 조금 나왔어요" },
  BAD: { icon: "😣", label: "목이 많이 나왔어요" },
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
  const [showSettings, setShowSettings] = useState(false);

  if (!baseline) {
    return (
      <div className="posture-status posture-status--empty">
        <p>먼저 기준 자세를 설정해주세요.</p>
      </div>
    );
  }

  const { smoothedState, shouldAlert } = state;
  const copy = STATE_COPY[smoothedState ?? "GOOD"] ?? STATE_COPY.GOOD;

  return (
    <div className={`posture-status posture-status--${(smoothedState ?? "good").toLowerCase()}`}>
      <div className="posture-state-badge" title={copy.label}>
        <span className="posture-state-icon" role="img" aria-label={copy.label}>
          {copy.icon}
        </span>
      </div>

      {shouldAlert && <div className="posture-alert">🐢 지금이면 거북이가 화면에 나타났을 시점이에요</div>}

      <button className="posture-settings-toggle" onClick={() => setShowSettings((v) => !v)}>
        {showSettings ? "설정 닫기" : "설정 ⚙"}
      </button>

      {showSettings && (
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
      )}
    </div>
  );
}
