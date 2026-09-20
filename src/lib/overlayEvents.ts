export const OVERLAY_EVENT = "posture-overlay";

export type OverlayMood = "warning" | "happy";

export interface OverlayPayload {
  visible: boolean;
  mood: OverlayMood;
  message: string;
}

// Copy straight from the product spec (§8, §9) so the overlay says exactly
// what the PRD prescribes rather than an engineer's paraphrase of it.
export const WARNING_MESSAGE = "목이 조금 앞으로 나왔어요!\n턱을 살짝 당겨볼까요? 🐢";
export const HAPPY_MESSAGE = "좋아요!\n지금 자세가 훨씬 좋아요.";

// How long the "좋아요" recovery card stays up before the turtle goes back
// under the screen edge (spec §9: "약 2~3초 후 메시지가 사라지고").
export const HAPPY_DISPLAY_MS = 2800;
