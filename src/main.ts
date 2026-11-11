import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { WorldScene } from "./scenes/WorldScene";
import { HEIGHT, WIDTH } from "./types";

function blockDefault() {
  const stop = (e: Event) => e.preventDefault();
  document.addEventListener("gesturestart", stop, { passive: false });
  document.addEventListener("dblclick", stop, { passive: false });
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) e.preventDefault();
      else e.preventDefault();
    },
    { passive: false },
  );
  window.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  const el = document.getElementById("game");
  el?.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  el?.addEventListener("pointerdown", (e) => {
    // keep focus on canvas; prevent page scroll
    if (e.target instanceof HTMLElement) e.target.setPointerCapture?.(e.pointerId);
  });
}

blockDefault();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#070b09",
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  banner: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: Phaser.Scale.MAX_ZOOM,
    width: WIDTH,
    height: HEIGHT,
  },
  input: {
    activePointers: 3,
    windowEvents: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
    powerPreference: "high-performance",
  },
  fps: { target: 60, smoothStep: true },
  scene: [BootScene, TitleScene, WorldScene],
};

new Phaser.Game(config);
