import React from "react";
import ReactDOM from "react-dom/client";
import { isTauriRuntime } from "./lib/tauriRuntime";

// Dynamic imports so each window only ever loads ONE of App/OverlayApp (and
// therefore only one of App.css/OverlayApp.css) into its JS context. A
// static import of both here previously leaked OverlayApp.css's global
// html/body/#root rules (transparent background, overflow:hidden) into the
// main debug window too, turning its dark theme white and killing scroll.
async function main() {
  let isOverlay = false;
  if (isTauriRuntime()) {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    isOverlay = getCurrentWindow().label === "overlay";
  }

  const { default: Root } = isOverlay ? await import("./OverlayApp") : await import("./App");

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
}

main();
