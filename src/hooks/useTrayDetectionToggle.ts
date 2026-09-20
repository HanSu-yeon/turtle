import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

// @tauri-apps/api/event throws when there's no Tauri webview underneath it
// (e.g. running the Vite dev server in a plain browser for iteration).
function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Tracks the tray menu's "자세 감지" checkbox so the frontend can pause
 * detection when the user turns it off from the tray, even with the main
 * window hidden in the background (Phase 3).
 */
export function useTrayDetectionToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    const unlisten = listen<boolean>("posture-detection-toggled", (event) => {
      setEnabled(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  return enabled;
}
