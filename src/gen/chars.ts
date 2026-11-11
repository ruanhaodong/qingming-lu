/** Distinct 24×32 isometric character / beast sprites. */

import { canv, hex, px, rect, shade } from "./pix";

export type CharStyle =
  | "hero" | "elder" | "maiden" | "alchemist" | "merchant"
  | "official" | "blood" | "smith" | "guard" | "youth" | "stele"
  | "bird" | "rabbit" | "snake" | "wolf" | "quad" | "lizard"
  | "bat" | "construct" | "spirit" | "undead" | "toad" | "tiger"
  | "dragon" | "boss" | "human";

export interface CharOpts {
  weapon?: boolean;
  horns?: boolean;
  beast?: boolean;
  style?: CharStyle;
}

const SKIN = "#d0b090";
const SKIN_D = "#a08068";

function shadow(x: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  rect(x, cx - (w >> 1), cy, w, 2, "rgba(0,0,0,0.32)");
}

function eyes(x: CanvasRenderingContext2D, dir: number, hx: number, hy: number, col = "#1a1010") {
  if (dir === 3) return;
  if (dir === 2) px(x, hx + 4, hy, col);
  else if (dir === 1) px(x, hx, hy, col);
  else {
    px(x, hx, hy, col);
    px(x, hx + 3, hy, col);
  }
}

function sword(x: CanvasRenderingContext2D, dir: number, fy: number, blade = "#c0d0d0", hilt = "#d0a040") {
  if (dir === 1) {
    rect(x, 3, 6 + fy, 1, 12, blade);
    rect(x, 2, 16 + fy, 3, 1, hilt);
  } else if (dir === 3) {
    rect(x, 18, 7 + fy, 1, 10, blade);
    rect(x, 17, 15 + fy, 3, 1, hilt);
  } else {
    rect(x, 18, 6 + fy, 1, 12, blade);
    rect(x, 17, 16 + fy, 3, 1, hilt);
  }
}

function drawHuman(pal: string[], dir: number, frame: number, style: CharStyle, weapon: boolean): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const bob = frame ? 1 : 0;
  const fy = bob;
  const step = frame ? 1 : -1;
  shadow(x, 12, 30, 10);

  const elder = style === "elder";
  const maiden = style === "maiden" || style === "alchemist";
  const wide = style === "smith" || style === "official";
  const bodyW = wide ? 8 : maiden ? 6 : 7;
  const bx = 12 - (bodyW >> 1);
  const headY = (elder ? 7 : 5) + fy;
  const bodyY = headY + 7;
  const hair =
    style === "elder" ? "#c8d0c8" :
    style === "blood" ? "#1a0808" :
    style === "maiden" ? shade(d, 20) :
    style === "alchemist" ? "#3a2a18" :
    style === "hero" ? "#1a1810" :
    d;

  // legs / hem
  const legY = bodyY + 7;
  const boot = shade(d, -10);
  if (dir === 1 || dir === 2) {
    rect(x, 9, legY, 2, 6 + (step > 0 ? 1 : 0), boot);
    rect(x, 13, legY, 2, 6 + (step < 0 ? 1 : 0), boot);
  } else {
    rect(x, 9, legY, 2, 6, boot);
    rect(x, 13, legY, 2, 6, boot);
    if (frame) rect(x, dir === 0 ? 8 : 15, legY + 5, 2, 1, boot);
  }

  // body / robe
  rect(x, bx, bodyY, bodyW, 8, m);
  // sash
  rect(x, bx, bodyY + 4, bodyW, 2, style === "hero" || style === "official" ? l : shade(m, -20));
  // collar / trim
  if (dir !== 3) rect(x, bx, bodyY, bodyW, 2, l);
  else rect(x, bx, bodyY, bodyW, 2, shade(m, -15));
  // sleeves / arms
  if (dir === 2) {
    rect(x, bx + bodyW, bodyY + 1, 2, 6, m);
    rect(x, bx - 2, bodyY + 2, 2, 5, m);
    rect(x, bx + bodyW, bodyY + 6, 2, 1, SKIN);
  } else if (dir === 1) {
    rect(x, bx - 2, bodyY + 1, 2, 6, m);
    rect(x, bx + bodyW, bodyY + 2, 2, 5, m);
    rect(x, bx - 2, bodyY + 6, 2, 1, SKIN);
  } else {
    rect(x, bx - 2, bodyY + 2, 2, 5, m);
    rect(x, bx + bodyW, bodyY + 2, 2, 5, m);
    if (dir === 0) {
      px(x, bx - 2, bodyY + 6, SKIN);
      px(x, bx + bodyW + 1, bodyY + 6, SKIN);
    }
  }
  // flowing robe hem for maiden / official / blood
  if (maiden || style === "blood" || style === "official" || style === "hero") {
    const hem = shade(m, dir === 3 ? -10 : 0);
    px(x, bx - 1, bodyY + 7, hem);
    px(x, bx + bodyW, bodyY + 7, hem);
  }
  // apron for alchemist / smith
  if (style === "alchemist" || style === "smith") {
    rect(x, bx + 1, bodyY + 2, bodyW - 2, 6, style === "smith" ? "#4a3a28" : "#d0c8a0");
  }
  // merchant pouch
  if (style === "merchant") {
    px(x, bx + bodyW, bodyY + 5, "#c0a050");
    px(x, bx + bodyW, bodyY + 6, "#a08030");
  }

  // head
  const hx = 9, hw = 6, hh = 6;
  rect(x, hx, headY, hw, hh, SKIN);
  px(x, hx, headY + hh - 1, SKIN_D);
  // hair
  rect(x, hx, headY - 1, hw, 2, hair);
  if (dir === 3) rect(x, hx, headY - 1, hw, 4, hair);
  else rect(x, hx, headY - 1, hw, 3, hair);
  if (style === "hero") {
    // topknot
    rect(x, 11, headY - 3, 2, 2, hair);
    px(x, 11, headY - 4, "#c0a050");
  }
  if (elder) {
    rect(x, 11, headY - 3, 2, 2, hair);
    // beard
    if (dir !== 3) {
      rect(x, hx + 1, headY + 5, 4, 3, hair);
      px(x, hx + 2, headY + 8, hair);
    }
  }
  if (maiden) {
    // long hair sides
    rect(x, hx - 1, headY + 1, 1, 7, hair);
    rect(x, hx + hw, headY + 1, 1, dir === 2 ? 5 : 8, hair);
    if (style === "alchemist") {
      rect(x, 10, headY - 3, 4, 2, hair); // bun
      px(x, 14, headY - 3, "#50a050"); // herb sprig
    } else {
      px(x, 10, headY, "#e0d080"); // hairpin
    }
  }
  if (style === "official" || style === "blood") {
    rect(x, 10, headY - 3, 4, 2, hair);
    px(x, 11, headY - 4, style === "blood" ? "#c04040" : "#d0a040");
  }
  if (style === "merchant") {
    // cloth wrap / cap
    rect(x, hx - 1, headY, hw + 2, 2, shade(m, -10));
    rect(x, hx, headY - 2, hw, 2, d);
  }
  if (style === "smith") {
    rect(x, hx - 1, headY, 1, 2, "#4a3a28"); // sideburn / kerchief
  }
  eyes(x, dir, hx + 1, headY + 3, style === "blood" ? "#801010" : "#1a1010");
  if (style === "maiden" && dir === 0) px(x, hx + 1, headY + 4, "#d08080"); // blush

  // weapons / staff
  if (style === "elder") {
    const sx = dir === 1 ? 4 : 18;
    rect(x, sx, 8 + fy, 1, 18, "#6a4a28");
    px(x, sx, 8 + fy, "#c0a070");
  } else if (weapon || style === "hero" || style === "official" || style === "blood") {
    const blade = style === "blood" ? "#e06070" : style === "hero" ? "#b0d0c8" : "#c0d0d0";
    const hilt = style === "blood" ? "#801018" : "#d0a040";
    sword(x, dir, fy, blade, hilt);
  }
  // blood cloak
  if (style === "blood") {
    const cloak = d;
    if (dir !== 0) {
      rect(x, bx - 3, bodyY, 2, 9, cloak);
      rect(x, bx + bodyW + 1, bodyY, 2, 9, shade(cloak, -10));
    } else {
      rect(x, bx - 3, bodyY + 1, 2, 8, cloak);
      rect(x, bx + bodyW + 1, bodyY + 1, 2, 8, cloak);
    }
  }
  return c;
}

function drawSteleChar(pal: string[]): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  shadow(x, 12, 30, 10);
  const d = pal[0], m = pal[1], l = pal[2];
  rect(x, 7, 6, 10, 22, m);
  rect(x, 7, 6, 5, 22, l);
  rect(x, 6, 4, 12, 3, shade(m, 20));
  rect(x, 8, 10, 8, 4, d);
  px(x, 11, 12, l); px(x, 12, 14, l); px(x, 11, 16, l);
  return c;
}

function drawBird(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? -1 : 0;
  shadow(x, 12, 28, 8);
  // body
  rect(x, 9, 16 + fy, 7, 5, m);
  rect(x, 10, 15 + fy, 5, 2, l);
  // head
  const hx = dir === 1 ? 7 : 14;
  rect(x, hx, 13 + fy, 4, 3, m);
  px(x, dir === 1 ? hx - 1 : hx + 4, 14 + fy, "#e0c040"); // beak
  px(x, dir === 1 ? hx + 1 : hx + 2, 14 + fy, "#1a1010");
  // crest
  px(x, hx + 1, 12 + fy, l);
  // tail
  const tx = dir === 1 ? 16 : 6;
  rect(x, tx, 17 + fy, 3, 2, l);
  // wing
  const wy = 16 + fy + (frame ? -2 : 0);
  rect(x, 8, wy, 9, 2, d);
  px(x, 7, wy + (frame ? -1 : 1), m);
  px(x, 17, wy + (frame ? -1 : 1), m);
  // legs
  px(x, 10, 21 + fy, "#c0a040");
  px(x, 14, 21 + fy, "#c0a040");
  return c;
}

function drawRabbit(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? 1 : 0;
  shadow(x, 12, 29, 8);
  rect(x, 8, 18 + fy, 8, 6, m);
  rect(x, 9, 17 + fy, 6, 2, l);
  // head
  rect(x, dir === 1 ? 6 : dir === 2 ? 10 : 8, 13 + fy, 6, 5, m);
  // ears
  const ex = dir === 1 ? 7 : 10;
  rect(x, ex, 7 + fy, 2, 7, m);
  rect(x, ex + 3, 6 + fy, 2, 8, m);
  px(x, ex, 8 + fy, l); px(x, ex + 3, 7 + fy, l);
  eyes(x, dir, dir === 1 ? 7 : 11, 15 + fy);
  // feet / tail
  rect(x, 8, 23 + fy, 3, 2, l);
  rect(x, 13, 23 + fy, 3, 2, l);
  px(x, dir === 2 ? 8 : 15, 20 + fy, l);
  return c;
}

function drawSnake(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  shadow(x, 12, 28, 10);
  const s = frame ? 1 : 0;
  // S body
  const pts: [number, number][] = [
    [6, 24], [8, 23], [10, 22], [12, 21], [14, 22], [16, 23], [17, 21], [16, 19], [14, 18], [12, 17],
  ];
  for (const [sx, sy] of pts) {
    px(x, sx, sy, m); px(x, sx + 1, sy, d); px(x, sx, sy + 1, d);
  }
  // raised head
  const hx = dir === 1 ? 7 : 14;
  const hy = 12 + s;
  rect(x, hx, hy, 5, 4, m);
  px(x, dir === 1 ? hx - 1 : hx + 5, hy + 1, l);
  px(x, dir === 1 ? hx + 1 : hx + 3, hy + 1, "#1a1010");
  px(x, dir === 1 ? hx : hx + 4, hy + 3, "#e04040"); // tongue
  // pattern
  px(x, 12, 19, l); px(x, 10, 22, l); px(x, 15, 22, l);
  return c;
}

function drawQuad(pal: string[], dir: number, frame: number, kind: "wolf" | "quad" | "tiger" | "bear"): HTMLCanvasElement {
  const { c, x } = canv(28, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? 1 : 0;
  const bulky = kind === "bear" || kind === "quad";
  shadow(x, 14, 29, bulky ? 14 : 12);
  const bw = bulky ? 12 : 10;
  const bx = 14 - (bw >> 1);
  // body
  rect(x, bx, 16 + fy, bw, 7, m);
  rect(x, bx, 16 + fy, bw, 3, l);
  // legs
  const lift = frame ? 1 : 0;
  rect(x, bx + 1, 22 + fy, 2, 5 + (1 - lift), d);
  rect(x, bx + 3, 22 + fy, 2, 5 + lift, d);
  rect(x, bx + bw - 5, 22 + fy, 2, 5 + lift, d);
  rect(x, bx + bw - 3, 22 + fy, 2, 5 + (1 - lift), d);
  // head
  const hx = dir === 1 ? bx - 4 : dir === 2 ? bx + bw - 2 : bx + 2;
  rect(x, hx, 13 + fy, 6, 5, m);
  if (kind === "wolf" || kind === "tiger") {
    px(x, hx + 1, 12 + fy, d);
    px(x, hx + 4, 12 + fy, d);
  }
  if (kind === "bear") {
    px(x, hx, 13 + fy, d);
    px(x, hx + 5, 13 + fy, d);
  }
  // snout
  if (dir !== 3) {
    const sx = dir === 1 ? hx - 2 : dir === 2 ? hx + 6 : hx + 2;
    rect(x, dir === 0 ? hx + 1 : sx, 15 + fy, dir === 0 ? 4 : 3, 2, l);
    eyes(x, dir, hx + 1, 14 + fy, kind === "tiger" ? "#401000" : "#1a1010");
  }
  if (kind === "tiger") {
    px(x, bx + 2, 18 + fy, d); px(x, bx + 5, 19 + fy, d); px(x, bx + 8, 18 + fy, d);
  }
  // tail
  const tx = dir === 1 ? bx + bw : bx - 2;
  rect(x, tx, 18 + fy, 3, 2, m);
  px(x, tx + (dir === 1 ? 3 : -1), 17 + fy, l);
  return c;
}

function drawLizard(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(28, 28);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? 1 : 0;
  shadow(x, 14, 25, 12);
  rect(x, 8, 14 + fy, 12, 5, m);
  rect(x, 9, 13 + fy, 10, 2, l);
  // legs splayed
  px(x, 8, 19 + fy, d); px(x, 7, 20 + fy, d);
  px(x, 12, 19 + fy, d);
  px(x, 16, 19 + fy, d);
  px(x, 19, 19 + fy, d); px(x, 20, 20 + fy, d);
  // head
  const hx = dir === 1 ? 5 : 17;
  rect(x, hx, 12 + fy, 6, 4, m);
  px(x, dir === 1 ? hx : hx + 5, 13 + fy, "#1a1010");
  // tail
  for (let i = 0; i < 6; i++) px(x, (dir === 1 ? 20 : 6) + (dir === 1 ? i : -i), 16 + fy + (i % 2), m);
  px(x, 12, 15 + fy, l);
  return c;
}

function drawBat(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(28, 28);
  const d = pal[0], m = pal[1], l = pal[2];
  const open = frame;
  shadow(x, 14, 22, 8);
  rect(x, 11, 12, 6, 5, m);
  px(x, 13, 11, d); px(x, 16, 11, d); // ears
  px(x, 12, 13, "#1a1010"); px(x, 16, 13, "#1a1010");
  // wings
  const span = open ? 8 : 4;
  for (let i = 0; i <= span; i++) {
    px(x, 11 - i, 14 + (open ? Math.floor(i / 3) : 1), d);
    px(x, 16 + i, 14 + (open ? Math.floor(i / 3) : 1), d);
    if (open && i < span) {
      px(x, 11 - i, 15 + Math.floor(i / 3), m);
      px(x, 16 + i, 15 + Math.floor(i / 3), m);
    }
  }
  void dir; void l;
  return c;
}

function drawConstruct(pal: string[], dir: number, frame: number, boss = false): HTMLCanvasElement {
  const { c, x } = canv(boss ? 32 : 24, boss ? 40 : 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? 1 : 0;
  const cx = c.width >> 1;
  shadow(x, cx, c.height - 2, boss ? 14 : 10);
  const bw = boss ? 12 : 8, bh = boss ? 12 : 8;
  const bx = cx - (bw >> 1), by = (boss ? 12 : 10) + fy;
  rect(x, bx, by, bw, bh, m);
  rect(x, bx, by, bw, 3, l);
  // core
  rect(x, cx - 1, by + 3, 3, 3, "#80e0d0");
  px(x, cx, by + 4, "#e8fff8");
  // head block
  rect(x, cx - 3, by - 6, 6, 6, m);
  rect(x, cx - 3, by - 6, 6, 2, l);
  if (dir !== 3) {
    px(x, dir === 1 ? cx - 2 : dir === 2 ? cx + 2 : cx - 2, by - 3, "#80e0d0");
    if (dir === 0) px(x, cx + 2, by - 3, "#80e0d0");
  }
  // arms
  rect(x, bx - 3, by + 1, 3, 7, d);
  rect(x, bx + bw, by + 1, 3, 7, d);
  // legs
  rect(x, bx + 1, by + bh, 2, 6, d);
  rect(x, bx + bw - 3, by + bh, 2, 6, d);
  return c;
}

function drawSpirit(pal: string[], dir: number, frame: number, treeish: boolean): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? 1 : 0;
  shadow(x, 12, 30, 8);
  if (treeish) {
    rect(x, 10, 14 + fy, 4, 12, d);
    rect(x, 10, 14 + fy, 2, 12, m);
    // leafy head
    for (let y = 0; y < 10; y++) for (let xx = 0; xx < 12; xx++) {
      if (Math.abs(xx - 6) + Math.abs(y - 5) < 6) px(x, 6 + xx, 4 + y + fy, (xx + y) % 3 ? m : l);
    }
    if (dir !== 3) {
      px(x, 10, 10 + fy, "#1a1010");
      px(x, 14, 10 + fy, "#1a1010");
    }
  } else {
    // wispy figure
    rect(x, 9, 8 + fy, 6, 6, l);
    rect(x, 8, 14 + fy, 8, 10, m);
    for (let i = 0; i < 5; i++) px(x, 8 + i * 2, 24 + fy + ((i + frame) % 2), d);
    eyes(x, dir, 10, 10 + fy, "#e8fff8");
  }
  return c;
}

function drawUndead(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? 1 : 0;
  shadow(x, 12, 30, 8);
  rect(x, 8, 14 + fy, 8, 8, m);
  rect(x, 9, 22 + fy, 2, 6, d);
  rect(x, 13, 22 + fy, 2, 6, d);
  rect(x, 9, 6 + fy, 6, 7, l);
  rect(x, 9, 6 + fy, 6, 2, d);
  if (dir !== 3) {
    px(x, dir === 2 ? 13 : 10, 9 + fy, "#80e0d0");
    if (dir === 0) px(x, 13, 9 + fy, "#80e0d0");
  }
  // tattered cloak
  px(x, 7, 20 + fy, d); px(x, 16, 21 + fy, d);
  sword(x, dir, fy, "#90a0a8", "#4a3030");
  return c;
}

function drawToad(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(24, 24);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? -1 : 0;
  shadow(x, 12, 21, 10);
  rect(x, 6, 12 + fy, 12, 7, m);
  rect(x, 7, 11 + fy, 10, 3, l);
  rect(x, 8, 8 + fy, 8, 5, m);
  px(x, 9, 9 + fy, "#1a1010"); px(x, 14, 9 + fy, "#1a1010");
  px(x, 8, 8 + fy, l); px(x, 15, 8 + fy, l);
  rect(x, 5, 16 + fy, 4, 3, d);
  rect(x, 15, 16 + fy, 4, 3, d);
  void dir;
  return c;
}

function drawDragon(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(32, 36);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame ? 1 : 0;
  shadow(x, 16, 33, 14);
  // serpentine body
  for (let i = 0; i < 10; i++) {
    const sx = 8 + i, sy = 18 + fy + Math.round(Math.sin(i * 0.8 + frame) * 2);
    rect(x, sx, sy, 3, 3, i % 3 ? m : l);
  }
  const hx = dir === 1 ? 6 : 18;
  rect(x, hx, 10 + fy, 8, 6, m);
  px(x, dir === 1 ? hx - 1 : hx + 8, 12 + fy, l);
  px(x, dir === 1 ? hx + 2 : hx + 5, 12 + fy, "#f0e080");
  // horns
  px(x, hx + 1, 8 + fy, l); px(x, hx + 6, 8 + fy, l);
  px(x, hx + 1, 7 + fy, d); px(x, hx + 6, 7 + fy, d);
  // legs
  rect(x, 10, 24 + fy, 2, 5, d);
  rect(x, 18, 24 + fy, 2, 5, d);
  return c;
}

export function drawCharacter(palN: number[], dir: number, frame: number, opts?: CharOpts): HTMLCanvasElement {
  const pal = palN.map(hex);
  while (pal.length < 3) pal.push(pal[pal.length - 1] ?? "#80d0b0");
  const style = opts?.style ?? (opts?.beast ? "quad" : "human");
  switch (style) {
    case "bird": return drawBird(pal, dir, frame);
    case "rabbit": return drawRabbit(pal, dir, frame);
    case "snake": return drawSnake(pal, dir, frame);
    case "wolf": return drawQuad(pal, dir, frame, "wolf");
    case "quad": return drawQuad(pal, dir, frame, "quad");
    case "tiger": return drawQuad(pal, dir, frame, "tiger");
    case "boss":
    case "lizard": return style === "boss" && opts?.horns ? drawConstruct(pal, dir, frame, true) : drawLizard(pal, dir, frame);
    case "bat": return drawBat(pal, dir, frame);
    case "construct": return drawConstruct(pal, dir, frame, false);
    case "spirit": return drawSpirit(pal, dir, frame, true);
    case "undead": return drawUndead(pal, dir, frame);
    case "toad": return drawToad(pal, dir, frame);
    case "dragon": return drawDragon(pal, dir, frame);
    case "stele": return drawSteleChar(pal);
    default: return drawHuman(pal, dir, frame, style, !!opts?.weapon);
  }
}

export function styleForNpc(id: string): CharStyle {
  if (id === "elder_qingsong" || id === "wanderer_lei") return "elder";
  if (id === "alchemist_azhi" || id === "alchemist_hai") return "alchemist";
  if (id === "lu_wanqing" || id === "sect_shuang" || id === "sect_xue") return "maiden";
  if (id === "vendor_he" || id === "vendor_guxing" || id === "auctioneer") return "merchant";
  if (id === "smith_kuang" || id === "smith_hai") return "smith";
  if (id === "situ_yan" || id === "sect_qingming" || id === "sect_lieyan") return "official";
  if (id === "chi_heng") return "blood";
  if (id === "guard_jin") return "stele";
  return "youth";
}

export function styleForEnemy(id: string, kind?: string, motif?: string, boss?: boolean): CharStyle {
  const table: Record<string, CharStyle> = {
    qingyu_que: "bird",
    zaomao_tu: "rabbit",
    chilian_she: "snake",
    bilin_xi: "lizard",
    yinfeng_shu: "bat",
    xuefu_shi: "bat",
    wuyin_lang: "wolf",
    cangyan_niu: "quad",
    yanwen_hu: "tiger",
    kuangdong_yao: "lizard",
    xuanbing_chan: "toad",
    leiwen_jiaoyou: "dragon",
    shihun_chi: "dragon",
    fumu_jing: "spirit",
    luoye_yao: "spirit",
    shanxiao_tong: "spirit",
    xunshan_kuilei: "construct",
    kuangwei_elite: "construct",
    shijia_wei: "construct",
    jieyun_kui: "construct",
    youming_qizu: "undead",
    fenxiang_guixiu: "undead",
    guteng_canbu: "spirit",
    jinwei_yao: "undead",
    jianling_canying: "spirit",
    boss_tiee: "lizard",
    boss_cangran: "quad",
    boss_youheng: "human",
    boss_ao: "quad",
    boss_moyuan: "undead",
    boss_xuepao: "blood",
    boss_lengqing: "official",
    caiyao_sanxiu: "human",
    heifeng_dao: "blood",
    sanxiu_doufa: "human",
    haishi_yao: "spirit",
    tianxing_canying: "official",
    xingyun_mosha: "spirit",
  };
  if (table[id]) return table[id];
  if (boss) return "boss";
  if (kind === "construct") return "construct";
  if (kind === "undead") return "undead";
  if (kind === "spirit") return "spirit";
  if (kind === "human") return "human";
  if (motif?.includes("bird")) return "bird";
  if (motif?.includes("snake")) return "snake";
  if (motif?.includes("wolf")) return "wolf";
  if (motif?.includes("bat")) return "bat";
  if (motif?.includes("frog") || motif?.includes("toad")) return "toad";
  return "quad";
}

const charCache = new Map<string, string>();

export function ensureChar(
  textures: Phaser.Textures.TextureManager,
  key: string,
  pal: number[],
  opts?: CharOpts,
): string {
  if (charCache.has(key) && textures.exists(key + "_0_0")) return key;
  for (let d = 0; d < 4; d++) for (let f = 0; f < 2; f++) {
    const k = `${key}_${d}_${f}`;
    if (textures.exists(k)) textures.remove(k);
    textures.addCanvas(k, drawCharacter(pal, d, f, opts));
  }
  charCache.set(key, key);
  return key;
}
