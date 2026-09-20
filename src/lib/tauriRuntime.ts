// @tauri-apps/api throws when there's no Tauri webview underneath it (e.g.
// running the Vite dev server in a plain browser for iteration).
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
