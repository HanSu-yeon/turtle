import { useEffect, useRef } from "react";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { LANDMARK } from "../lib/postureMetrics";

interface PoseOverlayProps {
  result: PoseLandmarkerResult | null;
  width: number;
  height: number;
}

const HIGHLIGHT_POINTS: Array<{ index: number; color: string; label: string }> = [
  { index: LANDMARK.NOSE, color: "#ff5757", label: "nose" },
  { index: LANDMARK.LEFT_EYE, color: "#ffd23f", label: "L eye" },
  { index: LANDMARK.RIGHT_EYE, color: "#ffd23f", label: "R eye" },
  { index: LANDMARK.LEFT_EAR, color: "#3fa8ff", label: "L ear" },
  { index: LANDMARK.RIGHT_EAR, color: "#3fa8ff", label: "R ear" },
  { index: LANDMARK.LEFT_SHOULDER, color: "#63e6a0", label: "L shoulder" },
  { index: LANDMARK.RIGHT_SHOULDER, color: "#63e6a0", label: "R shoulder" },
];

export function PoseOverlay({ result, width, height }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const landmarks = result?.landmarks[0];
    if (!landmarks) return;

    // Faint skeleton of all 33 points for context.
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (const l of landmarks) {
      ctx.beginPath();
      ctx.arc(l.x * width, l.y * height, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shoulder line.
    const ls = landmarks[LANDMARK.LEFT_SHOULDER];
    const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
    if (ls && rs) {
      ctx.strokeStyle = "#63e6a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ls.x * width, ls.y * height);
      ctx.lineTo(rs.x * width, rs.y * height);
      ctx.stroke();
    }

    // Highlighted landmarks Turtle's algorithm actually uses.
    for (const { index, color, label } of HIGHLIGHT_POINTS) {
      const l = landmarks[index];
      if (!l) continue;
      const x = l.x * width;
      const y = l.y * height;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "11px sans-serif";
      ctx.fillText(label, x + 7, y - 7);
    }
  }, [result, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="pose-overlay" />;
}
