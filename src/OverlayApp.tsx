import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import warningTurtle from "./assets/turtle/warning.png";
import happyTurtle from "./assets/turtle/happy.png";
import { OVERLAY_EVENT, type OverlayPayload } from "./lib/overlayEvents";
import "./OverlayApp.css";

const SPRITES = {
  warning: warningTurtle,
  happy: happyTurtle,
};

function OverlayApp() {
  const [payload, setPayload] = useState<OverlayPayload | null>(null);

  useEffect(() => {
    const unlisten = listen<OverlayPayload>(OVERLAY_EVENT, (event) => {
      setPayload(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  const visible = payload?.visible ?? false;

  return (
    <div className="overlay-stage">
      <div className={`overlay-card ${visible ? "overlay-card--visible" : ""}`}>
        {payload && (
          <>
            <img src={SPRITES[payload.mood]} alt="" className="overlay-sprite" />
            <p className="overlay-message">
              {payload.message.split("\n").map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default OverlayApp;
