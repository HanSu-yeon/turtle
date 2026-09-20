import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
// TODO: swap for the dedicated "목을 앞으로 길게 내민" (neck-stretched) sprite
// once it's provided — warning.png (surprised face) is a placeholder stand-in.
import badSprite from "./assets/turtle/warning.png";
import happySprite from "./assets/turtle/happy.png";
import { OVERLAY_EVENT, type OverlayPayload } from "./lib/overlayEvents";
import "./OverlayApp.css";

const SPRITES = {
  bad: badSprite,
  happy: happySprite,
};

function OverlayApp() {
  const [payload, setPayload] = useState<OverlayPayload>({ stage: "idle", mood: "bad" });

  useEffect(() => {
    const unlisten = listen<OverlayPayload>(OVERLAY_EVENT, (event) => {
      setPayload(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  return (
    <div className="overlay-stage">
      <img src={SPRITES[payload.mood]} alt="" className="overlay-creature" data-stage={payload.stage} />
    </div>
  );
}

export default OverlayApp;
