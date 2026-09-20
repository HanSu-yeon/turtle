import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import OverlayApp from "./OverlayApp";
import { isTauriRuntime } from "./lib/tauriRuntime";

// The overlay window has previously gone silently blank in packaged builds
// with no visible console to explain why (see the static-import fix above).
// Paint any uncaught error/rejection directly into the page so a repeat
// failure is diagnosable without reaching for a WKWebView inspector.
window.addEventListener("error", (e) => {
  document.body.innerHTML = `<pre style="color:red;font-size:10px;white-space:pre-wrap">ONERROR: ${e.message}\n${e.error?.stack ?? ""}</pre>`;
});
window.addEventListener("unhandledrejection", (e) => {
  document.body.innerHTML = `<pre style="color:red;font-size:10px;white-space:pre-wrap">UNHANDLED: ${e.reason}</pre>`;
});

// Static imports on purpose — an earlier version used dynamic import() to
// pick the component per-window, but that broke silently in the packaged
// production build (the overlay window rendered nothing at all: no error,
// just a blank page, because the custom tauri:// asset protocol doesn't
// resolve Vite's code-split chunk the same way the dev server does). Both
// App and OverlayApp always load now; each window renders only one of them.
try {
  const isOverlay = isTauriRuntime() && getCurrentWindow().label === "overlay";
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>{isOverlay ? <OverlayApp /> : <App />}</React.StrictMode>,
  );
} catch (err) {
  document.body.innerHTML = `<pre style="color:red;font-size:10px;white-space:pre-wrap">SYNC THROW: ${err}</pre>`;
}
