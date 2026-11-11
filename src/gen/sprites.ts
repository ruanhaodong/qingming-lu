/** Atlas assembly: tiles, props, characters, icons, UI chrome. */

import { addWorldArt } from "./tiles";
import { drawCharacter, ensureChar, styleForEnemy, styleForNpc, type CharOpts, type CharStyle } from "./chars";
import { canv, px, rect, shade } from "./pix";

export { drawCharacter, ensureChar, styleForEnemy, styleForNpc };
export type { CharOpts, CharStyle };

function icon(kind: string): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  const frame = (bg: string, edge = "#1a2018") => {
    rect(x, 0, 0, 16, 16, edge);
    rect(x, 1, 1, 14, 14, bg);
  };
  if (kind === "sword" || kind === "blade") {
    frame("#162018");
    rect(x, 7, 1, 2, 10, kind === "blade" ? "#d0b070" : "#c0d0d8");
    px(x, 8, 1, "#e8f0f8");
    rect(x, 5, 10, 6, 2, "#d0a040");
    rect(x, 7, 12, 2, 3, "#6a4a28");
  } else if (kind === "robe" || kind === "armor" || kind === "cloak") {
    frame("#162018");
    const col = kind === "armor" ? "#6a7060" : kind === "cloak" ? "#3a2a50" : "#2a6050";
    rect(x, 4, 3, 8, 11, col);
    rect(x, 4, 3, 8, 3, shade(col, 40));
    if (kind === "armor") { px(x, 8, 8, "#c0c8b0"); px(x, 8, 10, "#c0c8b0"); }
  } else if (kind.startsWith("pill")) {
    frame("#162018");
    const col = kind.includes("green") ? "#50c070" : kind.includes("blue") ? "#50a0d0" : kind.includes("cyan") ? "#40d0c0" : kind.includes("purple") ? "#a060c0" : "#d0b040";
    rect(x, 4, 4, 8, 8, col);
    rect(x, 5, 5, 3, 3, "#fff8d0");
    px(x, 11, 10, shade(col, -30));
  } else if (kind === "herb") {
    frame("#162018");
    rect(x, 7, 5, 2, 9, "#308040");
    rect(x, 4, 4, 5, 4, "#80e060");
    px(x, 10, 3, "#50a050");
    px(x, 6, 3, "#c07090");
  } else if (kind === "book") {
    frame("#162018");
    rect(x, 3, 3, 10, 11, "#803020");
    rect(x, 4, 4, 8, 9, "#f0e0c0");
    rect(x, 5, 6, 6, 1, "#803020");
    rect(x, 5, 9, 6, 1, "#803020");
  } else if (kind === "talisman") {
    frame("#162018");
    rect(x, 4, 2, 8, 12, "#e0d0a0");
    rect(x, 7, 4, 2, 7, "#a02020");
    px(x, 6, 5, "#a02020"); px(x, 9, 5, "#a02020");
  } else if (kind === "core" || kind === "crystal" || kind === "stone") {
    frame("#162018");
    const col = kind === "stone" ? "#6a7068" : "#40c0a0";
    rect(x, 4, 4, 8, 8, col);
    px(x, 6, 6, "#e0fff8"); px(x, 7, 7, "#e0fff8");
    if (kind === "crystal") { px(x, 8, 4, "#80e0ff"); px(x, 10, 8, "#80e0ff"); }
  } else if (kind === "fan") {
    frame("#162018");
    rect(x, 3, 8, 10, 2, "#8a6a30");
    for (let i = 0; i < 5; i++) px(x, 4 + i * 2, 5 + (i % 2), "#80d0e0");
  } else if (kind === "bead") {
    frame("#162018");
    for (let i = 0; i < 4; i++) { px(x, 6, 3 + i * 3, "#50a070"); px(x, 9, 4 + i * 3, "#80d0a0"); }
  } else if (kind === "ring") {
    frame("#162018");
    rect(x, 4, 5, 8, 6, "#c0a050");
    rect(x, 6, 7, 4, 3, "#162018");
    px(x, 8, 5, "#80e0d0");
  } else if (kind === "pendant") {
    frame("#162018");
    rect(x, 7, 2, 2, 5, "#c0a050");
    rect(x, 5, 7, 6, 6, "#4080c0");
    px(x, 8, 9, "#e0f0ff");
  } else if (kind === "bell") {
    frame("#162018");
    rect(x, 5, 4, 6, 8, "#d0b050");
    rect(x, 7, 12, 2, 2, "#c0a040");
    px(x, 8, 6, "#fff0c0");
  } else if (kind === "furnace") {
    frame("#162018");
    rect(x, 4, 5, 8, 9, "#4a4040");
    rect(x, 6, 8, 4, 4, "#e06020");
    px(x, 8, 9, "#f0d060");
  } else if (kind === "mirror") {
    frame("#162018");
    rect(x, 4, 3, 8, 10, "#c0a050");
    rect(x, 5, 4, 6, 8, "#80c0c8");
    px(x, 7, 6, "#e8ffff");
  } else if (kind === "gourd") {
    frame("#162018");
    rect(x, 6, 2, 4, 3, "#4a3020");
    rect(x, 4, 5, 8, 9, "#2a7050");
    px(x, 6, 7, "#80d0a0");
  } else if (kind === "ore") {
    frame("#162018");
    rect(x, 4, 6, 8, 6, "#4a4840");
    px(x, 6, 8, "#80c0e0"); px(x, 9, 9, "#c0f0ff");
  } else if (kind === "wood") {
    frame("#162018");
    rect(x, 5, 3, 6, 11, "#4a3020");
    rect(x, 5, 6, 6, 1, "#2a1c10");
    rect(x, 5, 10, 6, 1, "#2a1c10");
  } else if (kind === "sand") {
    frame("#162018");
    rect(x, 4, 5, 8, 8, "#a04030");
    px(x, 6, 7, "#e07050");
  } else if (kind === "scale") {
    frame("#162018");
    px(x, 8, 4, "#60c090"); px(x, 6, 7, "#40a070"); px(x, 10, 7, "#40a070");
    px(x, 5, 10, "#2a8058"); px(x, 8, 10, "#80e0b0"); px(x, 11, 10, "#2a8058");
  } else if (kind === "silk") {
    frame("#162018");
    for (let i = 0; i < 6; i++) rect(x, 4 + i, 3 + (i % 3), 1, 10, i % 2 ? "#c0b0e0" : "#8070b0");
  } else if (kind === "dust") {
    frame("#162018");
    px(x, 5, 6, "#80a0c0"); px(x, 8, 5, "#c0d0e0"); px(x, 11, 8, "#80a0c0");
    px(x, 6, 10, "#a0b8d0"); px(x, 10, 11, "#c0d0e0");
  } else if (kind === "ruler") {
    frame("#162018");
    rect(x, 3, 6, 10, 4, "#c0a050");
    for (let i = 0; i < 4; i++) px(x, 5 + i * 2, 6, "#3a2a10");
  } else {
    frame("#162018");
    rect(x, 4, 4, 8, 8, "#80a090");
  }
  return c;
}

function uiPanel(): HTMLCanvasElement {
  const { c, x } = canv(32, 32);
  rect(x, 0, 0, 32, 32, "#0a1210");
  rect(x, 1, 1, 30, 30, "#141c18");
  rect(x, 2, 2, 28, 28, "#0e1612");
  // jade corners
  const j = "#80c0a0";
  for (const [ox, oy, sx, sy] of [[0, 0, 1, 1], [31, 0, -1, 1], [0, 31, 1, -1], [31, 31, -1, -1]] as const) {
    px(x, ox, oy, j);
    px(x, ox + sx, oy, j);
    px(x, ox, oy + sy, j);
    px(x, ox + sx * 3, oy, "#3a6a50");
    px(x, ox, oy + sy * 3, "#3a6a50");
  }
  return c;
}

function uiBtn(w = 48, h = 16, col = "#1c2c24"): HTMLCanvasElement {
  const { c, x } = canv(w, h);
  rect(x, 0, 0, w, h, "#0a1210");
  rect(x, 1, 1, w - 2, h - 2, col);
  // jade rim
  for (let i = 0; i < w; i++) {
    px(x, i, 0, "#6ab090");
    px(x, i, h - 1, "#3a6a50");
  }
  for (let i = 0; i < h; i++) {
    px(x, 0, i, "#6ab090");
    px(x, w - 1, i, "#3a6a50");
  }
  return c;
}

function slot(size: number, col = "#6ab090"): HTMLCanvasElement {
  const { c, x } = canv(size, size);
  rect(x, 0, 0, size, size, "#0a1210");
  rect(x, 1, 1, size - 2, size - 2, "#141c18");
  for (let i = 0; i < size; i++) {
    px(x, i, 0, col);
    px(x, i, size - 1, shade(col, -40));
    px(x, 0, i, col);
    px(x, size - 1, i, shade(col, -40));
  }
  // inner corner ticks
  px(x, 2, 2, col); px(x, size - 3, 2, col);
  px(x, 2, size - 3, col); px(x, size - 3, size - 3, col);
  return c;
}

export function generateAtlas(textures: Phaser.Textures.TextureManager) {
  const add = (key: string, canvas: HTMLCanvasElement) => {
    if (textures.exists(key)) textures.remove(key);
    textures.addCanvas(key, canvas);
  };

  addWorldArt(add);

  const pPal = [0x102018, 0x2a6050, 0x80d0b0];
  for (let d = 0; d < 4; d++) for (let f = 0; f < 2; f++) {
    add(`char_player_${d}_${f}`, drawCharacter(pPal, d, f, { weapon: true, style: "hero" }));
  }

  add("ui_panel", uiPanel());
  add("ui_btn", uiBtn(64, 16));
  add("ui_btn_wide", uiBtn(96, 16));
  add("ui_btn_small", uiBtn(32, 14));
  add("ui_btn_gold", uiBtn(64, 16, "#3a2c14"));
  add("ui_slot", slot(28, "#6ab090"));
  add("ui_slot_sm", slot(22, "#6ab090"));

  const icons = [
    "sword", "blade", "robe", "armor", "cloak",
    "pill_green", "pill_blue", "pill_cyan", "pill_purple", "pill_gold",
    "herb", "book", "talisman", "core", "crystal", "stone",
    "fan", "bead", "ring", "pendant", "bell", "furnace", "mirror", "gourd",
    "ore", "wood", "sand", "scale", "silk", "dust", "ruler",
  ];
  for (const ic of icons) add("icon_" + ic, icon(ic));

  const { c: jb, x: jx } = canv(72, 72);
  jx.beginPath(); jx.arc(36, 36, 34, 0, Math.PI * 2);
  jx.fillStyle = "rgba(12,24,18,0.5)"; jx.fill();
  jx.strokeStyle = "rgba(128,208,160,0.75)"; jx.lineWidth = 2; jx.stroke();
  // inner ring
  jx.beginPath(); jx.arc(36, 36, 28, 0, Math.PI * 2);
  jx.strokeStyle = "rgba(58,106,80,0.7)"; jx.lineWidth = 1; jx.stroke();
  add("ui_joy_base", jb);
  const { c: jk, x: ky } = canv(28, 28);
  ky.beginPath(); ky.arc(14, 14, 12, 0, Math.PI * 2);
  ky.fillStyle = "rgba(160,224,192,0.9)"; ky.fill();
  ky.strokeStyle = "#e8fff8"; ky.stroke();
  add("ui_joy_knob", jk);

  const { c: bar, x: bx } = canv(80, 6);
  bx.fillStyle = "#08100c";
  bx.fillRect(0, 0, 80, 6);
  bx.strokeStyle = "#203028";
  bx.strokeRect(0.5, 0.5, 79, 5);
  add("ui_bar", bar);

  // window header ornament
  const { c: orn, x: ox } = canv(24, 8);
  for (let i = 0; i < 24; i++) {
    px(ox, i, 3, i % 4 === 0 ? "#80c0a0" : "#3a6a50");
    if (i % 8 === 4) px(ox, i, 2, "#c0e8d0");
  }
  add("ui_ornament", orn);

  return { tiles: [] as string[], icons };
}
