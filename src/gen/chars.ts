/** Distinct 16×32 (displayed 32×64) top-down characters. Original art; 4 facings × 4 walk frames. */

import { canv, hex, outline, px, rect, scaleN, shade } from "./pix";

export const CHAR_FRAMES = 4;

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

const SKIN = "#e8c8a0";
const SKIN_D = "#c8a078";

function shadow(x: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  rect(x, cx - (w >> 1), cy, w, 2, "rgba(0,0,0,0.32)");
}

/** dir: 0 south, 1 west, 2 east, 3 north. frame: 0..3 */
function stepOf(frame: number): { l: number; r: number; bob: number; arm: number } {
  // 0,2 = plant; 1 = left forward; 3 = right forward
  if (frame === 1) return { l: 1, r: -1, bob: 1, arm: 1 };
  if (frame === 3) return { l: -1, r: 1, bob: 1, arm: -1 };
  if (frame === 2) return { l: 0, r: 0, bob: 0, arm: 0 };
  return { l: 0, r: 0, bob: 0, arm: 0 };
}

function drawHuman(pal: string[], dir: number, frame: number, style: CharStyle, weapon: boolean): HTMLCanvasElement {
  const { c, x } = canv(16, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const st = stepOf(frame);
  const fy = st.bob;
  shadow(x, 8, 30, 8);

  const elder = style === "elder";
  const maiden = style === "maiden" || style === "alchemist";
  const wide = style === "smith" || style === "official";
  const bodyW = wide ? 8 : maiden ? 6 : 7;
  const bx = 8 - (bodyW >> 1);
  const headY = (elder ? 6 : 4) + fy;
  const bodyY = headY + 8;
  const hair =
    style === "elder" ? "#e0e8e0" :
    style === "blood" ? "#1a0808" :
    style === "maiden" ? shade(d, 24) :
    style === "alchemist" ? "#4a3020" :
    style === "hero" ? "#1c1810" :
    style === "official" ? "#1a1818" :
    style === "merchant" ? "#3a2a18" :
    d;

  // legs
  const legY = bodyY + 7;
  const boot = shade(d, -16);
  const lh = 6 + (st.l > 0 ? 1 : 0);
  const rh = 6 + (st.r > 0 ? 1 : 0);
  if (dir === 1) {
    // west: right leg more visible slightly back
    rect(x, 6, legY, 2, rh, boot);
    rect(x, 9, legY, 2, lh, boot);
    if (st.l > 0) px(x, 5, legY + lh - 1, boot);
    if (st.r > 0) px(x, 8, legY + rh - 1, boot);
  } else if (dir === 2) {
    rect(x, 5, legY, 2, lh, boot);
    rect(x, 8, legY, 2, rh, boot);
    if (st.l > 0) px(x, 7, legY + lh - 1, boot);
    if (st.r > 0) px(x, 10, legY + rh - 1, boot);
  } else {
    rect(x, 5, legY, 2, lh, boot);
    rect(x, 9, legY, 2, rh, boot);
    if (dir === 0) {
      if (st.l > 0) px(x, 4, legY + 5, boot);
      if (st.r > 0) px(x, 11, legY + 5, boot);
    }
  }

  // robe / body
  rect(x, bx, bodyY, bodyW, 8, m);
  rect(x, bx, bodyY + 4, bodyW, 2, style === "hero" || style === "official" ? l : shade(m, -24));
  if (dir !== 3) rect(x, bx, bodyY, bodyW, 2, l);
  else rect(x, bx, bodyY, bodyW, 2, shade(m, -16));

  // arms
  const armShift = st.arm;
  if (dir === 2) {
    rect(x, bx + bodyW, bodyY + 1 - armShift, 2, 6, m);
    rect(x, bx - 2, bodyY + 2 + armShift, 2, 5, m);
    rect(x, bx + bodyW, bodyY + 6 - armShift, 2, 1, SKIN);
  } else if (dir === 1) {
    rect(x, bx - 2, bodyY + 1 - armShift, 2, 6, m);
    rect(x, bx + bodyW, bodyY + 2 + armShift, 2, 5, m);
    rect(x, bx - 2, bodyY + 6 - armShift, 2, 1, SKIN);
  } else {
    rect(x, bx - 2, bodyY + 2 + (dir === 0 ? armShift : 0), 2, 5, m);
    rect(x, bx + bodyW, bodyY + 2 - (dir === 0 ? armShift : 0), 2, 5, m);
    if (dir === 0) {
      px(x, bx - 2, bodyY + 6 + armShift, SKIN);
      px(x, bx + bodyW + 1, bodyY + 6 - armShift, SKIN);
    }
  }
  if (maiden || style === "blood" || style === "official" || style === "hero") {
    const hem = shade(m, dir === 3 ? -10 : 0);
    px(x, bx - 1, bodyY + 7, hem);
    px(x, bx + bodyW, bodyY + 7, hem);
  }
  if (style === "alchemist" || style === "smith") {
    rect(x, bx + 1, bodyY + 2, bodyW - 2, 6, style === "smith" ? "#5a4a30" : "#e8e0b8");
  }
  if (style === "merchant") {
    px(x, bx + bodyW, bodyY + 5, "#e0c060");
    px(x, bx + bodyW, bodyY + 6, "#c0a040");
  }

  // head — slightly large
  const hx = 5, hw = 6, hh = 7;
  rect(x, hx, headY, hw, hh, SKIN);
  px(x, hx, headY + hh - 1, SKIN_D);
  // hair
  if (dir === 3) rect(x, hx, headY - 1, hw, 5, hair);
  else rect(x, hx, headY - 1, hw, 3, hair);
  rect(x, hx, headY - 1, hw, 2, hair);

  if (style === "hero") {
    rect(x, 7, headY - 3, 2, 2, hair);
    px(x, 7, headY - 4, "#e0c060");
  }
  if (elder) {
    rect(x, 7, headY - 3, 2, 2, hair);
    if (dir !== 3) {
      rect(x, hx + 1, headY + 5, 4, 3, hair);
      px(x, hx + 2, headY + 8, hair);
    }
  }
  if (maiden) {
    rect(x, hx - 1, headY + 1, 1, 8, hair);
    rect(x, hx + hw, headY + 1, 1, dir === 2 ? 5 : 9, hair);
    if (style === "alchemist") {
      rect(x, 6, headY - 3, 4, 2, hair);
      px(x, 10, headY - 3, "#50c050");
    } else {
      px(x, 6, headY, "#f0e080");
    }
  }
  if (style === "official" || style === "blood") {
    rect(x, 6, headY - 3, 4, 2, hair);
    px(x, 7, headY - 4, style === "blood" ? "#c04040" : "#e0c060");
  }
  if (style === "merchant") {
    rect(x, hx - 1, headY, hw + 2, 2, shade(m, -10));
    rect(x, hx, headY - 2, hw, 2, d);
  }
  if (style === "smith") {
    rect(x, hx - 1, headY, 1, 2, "#5a4a30");
  }

  // eyes
  if (dir !== 3) {
    const eye = style === "blood" ? "#801010" : "#1a1010";
    if (dir === 2) px(x, hx + 4, headY + 3, eye);
    else if (dir === 1) px(x, hx, headY + 3, eye);
    else {
      px(x, hx + 1, headY + 3, eye);
      px(x, hx + 4, headY + 3, eye);
    }
  }
  if (style === "maiden" && dir === 0) px(x, hx + 1, headY + 5, "#e09090");

  // weapons
  if (style === "elder") {
    const sx = dir === 1 ? 2 : 13;
    rect(x, sx, 6 + fy, 1, 20, "#7a5a30");
    px(x, sx, 6 + fy, "#e0c080");
  } else if (weapon || style === "hero" || style === "official" || style === "blood") {
    const blade = style === "blood" ? "#e06070" : style === "hero" ? "#c0e0d8" : "#d0d8d8";
    const hilt = style === "blood" ? "#801018" : "#e0c060";
    if (dir === 1) {
      rect(x, 1, 6 + fy, 1, 12, blade);
      rect(x, 0, 16 + fy, 3, 1, hilt);
    } else if (dir === 3) {
      rect(x, 13, 6 + fy, 1, 10, blade);
      rect(x, 12, 14 + fy, 3, 1, hilt);
    } else {
      rect(x, 13, 5 + fy, 1, 12, blade);
      rect(x, 12, 15 + fy, 3, 1, hilt);
    }
  }
  if (style === "blood") {
    const cloak = d;
    rect(x, bx - 3, bodyY, 2, 9, cloak);
    rect(x, bx + bodyW + 1, bodyY, 2, 9, shade(cloak, -10));
  }
  return scaleN(outline(c), 2);
}

function drawSteleChar(pal: string[]): HTMLCanvasElement {
  const { c, x } = canv(16, 32);
  shadow(x, 8, 30, 8);
  const d = pal[0], m = pal[1], l = pal[2];
  rect(x, 4, 6, 8, 22, m);
  rect(x, 4, 6, 4, 22, l);
  rect(x, 3, 4, 10, 3, shade(m, 20));
  rect(x, 5, 10, 6, 4, d);
  px(x, 7, 12, l); px(x, 8, 14, l); px(x, 7, 16, l);
  return scaleN(outline(c), 2);
}

function drawBird(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(16, 24);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? -2 : 0;
  shadow(x, 8, 21, 6);
  rect(x, 5, 12 + fy, 6, 4, m);
  rect(x, 6, 11 + fy, 4, 2, l);
  const hx = dir === 1 ? 3 : 9;
  rect(x, hx, 9 + fy, 4, 3, m);
  px(x, dir === 1 ? hx - 1 : hx + 4, 10 + fy, "#f0c040");
  px(x, dir === 1 ? hx + 1 : hx + 2, 10 + fy, "#1a1010");
  px(x, hx + 1, 8 + fy, l);
  const tx = dir === 1 ? 11 : 2;
  rect(x, tx, 13 + fy, 3, 2, l);
  const wy = 12 + fy + (frame === 1 || frame === 3 ? -2 : 0);
  rect(x, 4, wy, 8, 2, d);
  px(x, 3, wy + (fy ? 0 : 1), m);
  px(x, 12, wy + (fy ? 0 : 1), m);
  px(x, 6, 16 + fy, "#e0b040");
  px(x, 9, 16 + fy, "#e0b040");
  return scaleN(outline(c), 2);
}

function drawRabbit(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(16, 24);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? 1 : 0;
  shadow(x, 8, 22, 6);
  rect(x, 4, 13 + fy, 8, 5, m);
  rect(x, 5, 12 + fy, 6, 2, l);
  rect(x, dir === 1 ? 2 : dir === 2 ? 6 : 4, 8 + fy, 6, 5, m);
  const ex = dir === 1 ? 3 : 6;
  rect(x, ex, 2 + fy, 2, 7, m);
  rect(x, ex + 3, 1 + fy, 2, 8, m);
  px(x, ex, 3 + fy, l); px(x, ex + 3, 2 + fy, l);
  if (dir !== 3) {
    const eyeX = dir === 1 ? 3 : dir === 2 ? 9 : 6;
    px(x, eyeX, 10 + fy, "#1a1010");
    if (dir === 0) px(x, 9, 10 + fy, "#1a1010");
  }
  rect(x, 4, 18 + fy, 3, 2, l);
  rect(x, 9, 18 + fy, 3, 2, l);
  px(x, dir === 2 ? 4 : 12, 15 + fy, l);
  void d;
  return scaleN(outline(c), 2);
}

function drawSnake(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(16, 24);
  const d = pal[0], m = pal[1], l = pal[2];
  shadow(x, 8, 21, 8);
  const s = frame === 1 || frame === 3 ? 1 : 0;
  const pts: [number, number][] = [
    [2, 18], [4, 17], [6, 16], [8, 15], [10, 16], [12, 17], [13, 15], [12, 13], [10, 12], [8, 11],
  ];
  for (const [sx, sy] of pts) {
    px(x, sx, sy, m); px(x, sx + 1, sy, d); px(x, sx, sy + 1, d);
  }
  const hx = dir === 1 ? 3 : 10;
  const hy = 7 + s;
  rect(x, hx, hy, 5, 4, m);
  px(x, dir === 1 ? hx - 1 : hx + 5, hy + 1, l);
  px(x, dir === 1 ? hx + 1 : hx + 3, hy + 1, "#1a1010");
  px(x, dir === 1 ? hx : hx + 4, hy + 3, "#e04040");
  px(x, 8, 13, l); px(x, 6, 16, l); px(x, 11, 16, l);
  return scaleN(outline(c), 2);
}

function drawQuad(pal: string[], dir: number, frame: number, kind: "wolf" | "quad" | "tiger" | "bear"): HTMLCanvasElement {
  const { c, x } = canv(20, 24);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? 1 : 0;
  const bulky = kind === "bear" || kind === "quad";
  shadow(x, 10, 22, bulky ? 12 : 10);
  const bw = bulky ? 12 : 10;
  const bx = 10 - (bw >> 1);
  rect(x, bx, 11 + fy, bw, 6, m);
  rect(x, bx, 11 + fy, bw, 2, l);
  const lift = frame === 1 || frame === 2 ? 1 : 0;
  rect(x, bx + 1, 16 + fy, 2, 4 + (1 - lift), d);
  rect(x, bx + 3, 16 + fy, 2, 4 + lift, d);
  rect(x, bx + bw - 5, 16 + fy, 2, 4 + lift, d);
  rect(x, bx + bw - 3, 16 + fy, 2, 4 + (1 - lift), d);
  const hx = dir === 1 ? bx - 4 : dir === 2 ? bx + bw - 2 : bx + 2;
  rect(x, hx, 8 + fy, 6, 5, m);
  if (kind === "wolf" || kind === "tiger") {
    px(x, hx + 1, 7 + fy, d);
    px(x, hx + 4, 7 + fy, d);
  }
  if (kind === "bear") {
    px(x, hx, 8 + fy, d);
    px(x, hx + 5, 8 + fy, d);
  }
  if (dir !== 3) {
    const sx = dir === 1 ? hx - 2 : dir === 2 ? hx + 6 : hx + 2;
    rect(x, dir === 0 ? hx + 1 : sx, 10 + fy, dir === 0 ? 4 : 3, 2, l);
    const eye = kind === "tiger" ? "#401000" : "#1a1010";
    if (dir === 2) px(x, hx + 4, 9 + fy, eye);
    else if (dir === 1) px(x, hx, 9 + fy, eye);
    else { px(x, hx + 1, 9 + fy, eye); px(x, hx + 4, 9 + fy, eye); }
  }
  if (kind === "tiger") {
    px(x, bx + 2, 13 + fy, d); px(x, bx + 5, 14 + fy, d); px(x, bx + 8, 13 + fy, d);
  }
  const tx = dir === 1 ? bx + bw : bx - 2;
  rect(x, tx, 13 + fy, 3, 2, m);
  px(x, tx + (dir === 1 ? 3 : -1), 12 + fy, l);
  return scaleN(outline(c), 2);
}

function drawLizard(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(20, 20);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? 1 : 0;
  shadow(x, 10, 18, 9);
  rect(x, 4, 9 + fy, 12, 5, m);
  rect(x, 5, 8 + fy, 10, 2, l);
  px(x, 4, 14 + fy, d); px(x, 3, 15 + fy, d);
  px(x, 8, 14 + fy, d);
  px(x, 12, 14 + fy, d);
  px(x, 15, 14 + fy, d); px(x, 16, 15 + fy, d);
  const hx = dir === 1 ? 1 : 13;
  rect(x, hx, 7 + fy, 6, 4, m);
  px(x, dir === 1 ? hx : hx + 5, 8 + fy, "#1a1010");
  for (let i = 0; i < 6; i++) px(x, (dir === 1 ? 16 : 2) + (dir === 1 ? i : -i), 11 + fy + (i % 2), m);
  px(x, 8, 10 + fy, l);
  return scaleN(outline(c), 2);
}

function drawBat(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(20, 20);
  const d = pal[0], m = pal[1], l = pal[2];
  const open = frame === 1 || frame === 3;
  shadow(x, 10, 16, 6);
  rect(x, 7, 8, 6, 5, m);
  px(x, 8, 7, d); px(x, 11, 7, d);
  px(x, 8, 9, "#1a1010"); px(x, 11, 9, "#1a1010");
  const span = open ? 7 : 3;
  for (let i = 0; i <= span; i++) {
    px(x, 7 - i, 10 + (open ? Math.floor(i / 3) : 1), d);
    px(x, 12 + i, 10 + (open ? Math.floor(i / 3) : 1), d);
    if (open && i < span) {
      px(x, 7 - i, 11 + Math.floor(i / 3), m);
      px(x, 12 + i, 11 + Math.floor(i / 3), m);
    }
  }
  void dir; void l;
  return scaleN(outline(c), 2);
}

function drawConstruct(pal: string[], dir: number, frame: number, boss = false): HTMLCanvasElement {
  const { c, x } = canv(boss ? 24 : 16, boss ? 36 : 28);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? 1 : 0;
  const cx = c.width >> 1;
  shadow(x, cx, c.height - 2, boss ? 12 : 8);
  const bw = boss ? 12 : 8, bh = boss ? 12 : 8;
  const bx = cx - (bw >> 1), by = (boss ? 10 : 8) + fy;
  rect(x, bx, by, bw, bh, m);
  rect(x, bx, by, bw, 3, l);
  rect(x, cx - 1, by + 3, 3, 3, "#80e0d0");
  px(x, cx, by + 4, "#e8fff8");
  rect(x, cx - 3, by - 6, 6, 6, m);
  rect(x, cx - 3, by - 6, 6, 2, l);
  if (dir !== 3) {
    px(x, dir === 1 ? cx - 2 : dir === 2 ? cx + 2 : cx - 2, by - 3, "#80e0d0");
    if (dir === 0) px(x, cx + 2, by - 3, "#80e0d0");
  }
  rect(x, bx - 3, by + 1, 3, 7, d);
  rect(x, bx + bw, by + 1, 3, 7, d);
  rect(x, bx + 1, by + bh, 2, 6, d);
  rect(x, bx + bw - 3, by + bh, 2, 6, d);
  return scaleN(outline(c), 2);
}

function drawSpirit(pal: string[], dir: number, frame: number, treeish: boolean): HTMLCanvasElement {
  const { c, x } = canv(16, 28);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? 1 : 0;
  shadow(x, 8, 26, 6);
  if (treeish) {
    rect(x, 7, 12 + fy, 3, 12, d);
    rect(x, 7, 12 + fy, 2, 12, m);
    for (let y = 0; y < 10; y++) for (let xx = 0; xx < 12; xx++) {
      if (Math.abs(xx - 6) + Math.abs(y - 5) < 6) px(x, 2 + xx, 3 + y + fy, (xx + y) % 3 ? m : l);
    }
    if (dir !== 3) {
      px(x, 6, 8 + fy, "#1a1010");
      px(x, 10, 8 + fy, "#1a1010");
    }
  } else {
    rect(x, 5, 6 + fy, 6, 6, l);
    rect(x, 4, 12 + fy, 8, 10, m);
    for (let i = 0; i < 5; i++) px(x, 4 + i * 2, 22 + fy + ((i + frame) % 2), d);
    if (dir !== 3) {
      px(x, dir === 2 ? 9 : 6, 8 + fy, "#e8fff8");
      if (dir === 0) px(x, 9, 8 + fy, "#e8fff8");
    }
  }
  return scaleN(outline(c), 2);
}

function drawUndead(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(16, 32);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? 1 : 0;
  shadow(x, 8, 30, 6);
  rect(x, 4, 12 + fy, 8, 8, m);
  rect(x, 5, 20 + fy, 2, 6, d);
  rect(x, 9, 20 + fy, 2, 6, d);
  rect(x, 5, 5 + fy, 6, 7, l);
  rect(x, 5, 5 + fy, 6, 2, d);
  if (dir !== 3) {
    px(x, dir === 2 ? 9 : 6, 8 + fy, "#80e0d0");
    if (dir === 0) px(x, 9, 8 + fy, "#80e0d0");
  }
  px(x, 3, 18 + fy, d); px(x, 12, 19 + fy, d);
  const blade = "#90a0a8", hilt = "#4a3030";
  if (dir === 1) { rect(x, 1, 6 + fy, 1, 12, blade); rect(x, 0, 16 + fy, 3, 1, hilt); }
  else { rect(x, 13, 6 + fy, 1, 12, blade); rect(x, 12, 16 + fy, 3, 1, hilt); }
  return scaleN(outline(c), 2);
}

function drawToad(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(16, 18);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? -1 : 0;
  shadow(x, 8, 16, 8);
  rect(x, 2, 8 + fy, 12, 6, m);
  rect(x, 3, 7 + fy, 10, 3, l);
  rect(x, 4, 4 + fy, 8, 5, m);
  px(x, 5, 5 + fy, "#1a1010"); px(x, 10, 5 + fy, "#1a1010");
  px(x, 4, 4 + fy, l); px(x, 11, 4 + fy, l);
  rect(x, 1, 12 + fy, 4, 3, d);
  rect(x, 11, 12 + fy, 4, 3, d);
  void dir;
  return scaleN(outline(c), 2);
}

function drawDragon(pal: string[], dir: number, frame: number): HTMLCanvasElement {
  const { c, x } = canv(24, 28);
  const d = pal[0], m = pal[1], l = pal[2];
  const fy = frame === 1 || frame === 3 ? 1 : 0;
  shadow(x, 12, 26, 11);
  for (let i = 0; i < 12; i++) {
    const sx = 4 + i, sy = 14 + fy + Math.round(Math.sin(i * 0.8 + frame) * 2);
    rect(x, sx, sy, 3, 3, i % 3 ? m : l);
  }
  const hx = dir === 1 ? 2 : 14;
  rect(x, hx, 6 + fy, 8, 6, m);
  px(x, dir === 1 ? hx - 1 : hx + 8, 8 + fy, l);
  px(x, dir === 1 ? hx + 2 : hx + 5, 8 + fy, "#f0e080");
  px(x, hx + 1, 4 + fy, l); px(x, hx + 6, 4 + fy, l);
  px(x, hx + 1, 3 + fy, d); px(x, hx + 6, 3 + fy, d);
  rect(x, 6, 20 + fy, 2, 5, d);
  rect(x, 14, 20 + fy, 2, 5, d);
  return scaleN(outline(c), 2);
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
  for (let d = 0; d < 4; d++) for (let f = 0; f < CHAR_FRAMES; f++) {
    const k = `${key}_${d}_${f}`;
    if (textures.exists(k)) textures.remove(k);
    textures.addCanvas(k, drawCharacter(pal, d, f, opts));
  }
  charCache.set(key, key);
  return key;
}
