import { useEffect, useRef, useState } from "react";
import type { PostureMetrics } from "../lib/postureMetrics";
import { averageBaseline, type PostureBaseline } from "../lib/postureBaseline";

const CAPTURE_MS = 3000;
const SAMPLE_INTERVAL_MS = 125;

interface CalibrationProps {
  latestMetrics: PostureMetrics | null;
  onComplete: (baseline: PostureBaseline) => void;
  disabled: boolean;
  baseline: PostureBaseline | null;
}

type Phase = "idle" | "countdown" | "capturing" | "done";

export function Calibration({ latestMetrics, onComplete, disabled, baseline }: CalibrationProps) {
  const hasBaseline = baseline !== null;
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const samplesRef = useRef<PostureMetrics[]>([]);
  // Read via ref inside the capture interval so it always sees the latest
  // metrics without re-subscribing the interval on every detection tick.
  const metricsRef = useRef<PostureMetrics | null>(latestMetrics);
  metricsRef.current = latestMetrics;

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("capturing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "capturing") return;
    samplesRef.current = [];
    const interval = setInterval(() => {
      if (metricsRef.current) samplesRef.current.push(metricsRef.current);
    }, SAMPLE_INTERVAL_MS);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (samplesRef.current.length > 0) {
        onComplete(averageBaseline(samplesRef.current));
      }
      setPhase("done");
    }, CAPTURE_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase, onComplete]);

  function start() {
    setCountdown(3);
    setPhase("countdown");
  }

  return (
    <div className="calibration">
      {phase === "idle" && (
        <>
          {baseline && (
            <p className="calibration-saved-notice">
              ✅ 저장된 자세가 있어요 ({new Date(baseline.capturedAt).toLocaleDateString("ko-KR")} 측정) — 지금 이 기준으로
              감지하고 있어요.
            </p>
          )}
          <button onClick={start} disabled={disabled}>
            {disabled ? "카메라를 먼저 켜주세요" : hasBaseline ? "재측정하기" : "기준 자세 설정하기"}
          </button>
        </>
      )}
      {phase === "countdown" && (
        <div className="calibration-active">
          <p>평소 생각하는 좋은 자세로 앉아주세요</p>
          <span className="countdown-number">{countdown}</span>
        </div>
      )}
      {phase === "capturing" && (
        <div className="calibration-active">
          <p>측정 중... 그대로 있어주세요 🐢</p>
        </div>
      )}
      {phase === "done" && (
        <div className="calibration-active">
          <p>기준 자세가 저장되었어요 ✅</p>
          <button onClick={start}>다시 설정하기</button>
        </div>
      )}
    </div>
  );
}
