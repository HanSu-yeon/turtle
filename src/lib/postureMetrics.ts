// BlazePose (MediaPipe Pose Landmarker) landmark indices we care about.
// Full topology has 33 points; Turtle only needs the head + shoulder subset.
export const LANDMARK = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
} as const;

export interface NormalizedPoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PostureMetrics {
  nose: NormalizedPoint;
  leftEye: NormalizedPoint;
  rightEye: NormalizedPoint;
  leftEar: NormalizedPoint;
  rightEar: NormalizedPoint;
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
  /** Midpoint of the eyes — stand-in for "face center". */
  faceCenter: { x: number; y: number };
  /** Midpoint of the shoulders. */
  shoulderCenter: { x: number; y: number };
  /** Ear-to-ear distance: shrinks/grows as the head moves away from/toward the camera. */
  earDistance: number;
  /** Eye-to-eye distance: a steadier alternative to earDistance when ears are partly occluded. */
  eyeDistance: number;
  /** faceCenter.y - shoulderCenter.y, normalized by shoulder width. Grows when the head drops (looking down). */
  headDropRatio: number;
  /** faceCenter.x - shoulderCenter.x, normalized by shoulder width. Nonzero when leaning sideways. */
  headLeanRatio: number;
  /** Average landmark visibility, used to gate low-confidence frames. */
  confidence: number;
}

type RawLandmark = { x: number; y: number; z: number; visibility?: number };

function toPoint(l: RawLandmark): NormalizedPoint {
  return { x: l.x, y: l.y, z: l.z, visibility: l.visibility ?? 0 };
}

function dist(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function extractPostureMetrics(landmarks: RawLandmark[]): PostureMetrics | null {
  if (landmarks.length < 13) return null;

  const nose = toPoint(landmarks[LANDMARK.NOSE]);
  const leftEye = toPoint(landmarks[LANDMARK.LEFT_EYE]);
  const rightEye = toPoint(landmarks[LANDMARK.RIGHT_EYE]);
  const leftEar = toPoint(landmarks[LANDMARK.LEFT_EAR]);
  const rightEar = toPoint(landmarks[LANDMARK.RIGHT_EAR]);
  const leftShoulder = toPoint(landmarks[LANDMARK.LEFT_SHOULDER]);
  const rightShoulder = toPoint(landmarks[LANDMARK.RIGHT_SHOULDER]);

  const faceCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
  const shoulderWidth = dist(leftShoulder, rightShoulder) || 1e-6;

  const earDistance = dist(leftEar, rightEar);
  const eyeDistance = dist(leftEye, rightEye);

  const headDropRatio = (faceCenter.y - shoulderCenter.y) / shoulderWidth;
  const headLeanRatio = (faceCenter.x - shoulderCenter.x) / shoulderWidth;

  const confidence =
    [nose, leftEye, rightEye, leftEar, rightEar, leftShoulder, rightShoulder].reduce(
      (sum, p) => sum + p.visibility,
      0,
    ) / 7;

  return {
    nose,
    leftEye,
    rightEye,
    leftEar,
    rightEar,
    leftShoulder,
    rightShoulder,
    faceCenter,
    shoulderCenter,
    earDistance,
    eyeDistance,
    headDropRatio,
    headLeanRatio,
    confidence,
  };
}
