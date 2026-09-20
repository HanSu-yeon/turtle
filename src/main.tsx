import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import OverlayApp from "./OverlayApp";
import { isTauriRuntime } from "./lib/tauriRuntime";

// Static imports on purpose — an earlier version used dynamic import() to
// pick the component per-window, but that broke silently in the packaged
// production build (the overlay window rendered nothing at all: no error,
// just a blank page, because the custom tauri:// asset protocol doesn't
// resolve Vite's code-split chunk the same way the dev server does). Both
// App and OverlayApp always load now; each window renders only one of them.
const isOverlay = isTauriRuntime() && getCurrentWindow().label === "overlay";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isOverlay ? <OverlayApp /> : <App />}</React.StrictMode>,
);
