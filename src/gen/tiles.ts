/** Authored pixel tiles, iso blocks, and world props. */

import { PAL, canv, fillDiamond, hash2, hex, isoBlock, mix, px, rect, shade, type TileKind } from "./pix";

const TILE_W = 32, TILE_H = 16;

function palOf(kind: TileKind): string[] {
  if (kind === "grass" || kind === "grass2" || kind === "flower") return PAL.grass;
  if (kind === "dirt") return PAL.dirt;
  if (kind === "path") return PAL.path;
  if (kind === "stone" || kind === "cliff") return PAL.stone;
  if (kind === "water") return PAL.water;
  if (kind === "shallow") return PAL.shallow;
  if (kind === "sand") return PAL.sand;
  if (kind === "floor" || kind === "wood") return PAL.floor;
  if (kind === "plank") return PAL.plank;
  if (kind === "ash" || kind === "forbidden") return PAL.ash;
  if (kind === "snow") return PAL.snow;
  if (kind === "cobble") return PAL.cobble;
  if (kind === "garden") return PAL.garden;
  if (kind === "rail") return PAL.rail;
  if (kind === "moss") return PAL.moss;
  return PAL.grass;
}

export function paintTile(kind: TileKind, seed = 1): HTMLCanvasElement {
  const { c, x } = canv(TILE_W, TILE_H);
  const pal = palOf(kind);
  fillDiamond(x, 16, 8, 16, 8, (dx, dy, u, v) => {
    const n = hash2(seed, dx, dy);
    const n2 = hash2(seed + 9, dx * 3, dy * 3);
    const rim = Math.abs(u) + Math.abs(v) > 0.86;
    const lit = u < 0 && v < 0;
    const shadeR = u > 0 && v > 0;
    let i = 2 + Math.floor(n * (pal.length - 3));
    if (kind === "grass2") i = Math.max(0, i - 1);
    if (kind === "forbidden") i = Math.min(pal.length - 1, i);
    if (lit) i = Math.min(pal.length - 1, i + 1);
    if (shadeR) i = Math.max(0, i - 1);
    if (rim) i = Math.max(0, i - 1);
    let col = pal[i];
    if (kind === "path") {
      const center = Math.abs(u) + Math.abs(v) < 0.45;
      if (center) col = shade(col, 14);
      if (n2 < 0.07) col = pal[Math.max(0, i - 1)];
    }
    if (kind === "cobble") {
      const cx = Math.floor(dx / 4) * 4, cy = Math.floor(dy / 3) * 3;
      const g = hash2(seed, cx, cy);
      col = pal[1 + Math.floor(g * (pal.length - 2))];
      if ((dx + dy) % 5 === 0) col = shade(col, -18);
      if (rim) col = shade(col, -22);
    }
    if (kind === "plank") {
      const board = Math.floor((dx + dy * 0.3) / 4);
      col = pal[(board + Math.floor(n * 2)) % pal.length];
      if ((dx + Math.floor(dy / 2)) % 4 === 0) col = shade(col, -20);
    }
    if (kind === "rail") {
      col = PAL.dirt[2 + Math.floor(n * 2)];
    }
    if (kind === "water" || kind === "shallow") {
      const wave = Math.sin((dx + seed) * 0.9 + dy * 0.4) * 0.5 + 0.5;
      i = 2 + Math.floor(wave * 3);
      if (n < 0.08) i = Math.min(pal.length - 1, i + 2);
      col = pal[Math.max(0, Math.min(pal.length - 1, i))];
      if (rim) col = shade(col, -10);
    }
    if (kind === "garden") {
      if (n2 < 0.25) col = PAL.garden[3 + Math.floor(n * 2)];
      else col = PAL.dirt[2];
    }
    if (kind === "moss") {
      if (n < 0.4) col = PAL.moss[2 + Math.floor(n2 * 3)];
      else col = PAL.stone[2];
    }
    if (kind === "flower") {
      if (n < 0.35) col = PAL.grassLit[Math.floor(n2 * PAL.grassLit.length)];
    }
    return col;
  });

  // Detail sprinkles kept inside the diamond
  if (kind === "grass" || kind === "grass2" || kind === "flower" || kind === "moss") {
    for (let i = 0; i < 6; i++) {
      const u = hash2(seed, i, 20), v = hash2(seed, i, 40);
      const gx = 6 + Math.floor(u * 20), gy = 3 + Math.floor(v * 10);
      if (Math.abs(gx - 16) / 16 + Math.abs(gy - 8) / 8 > 0.72) continue;
      const blade = kind === "grass2" ? PAL.grass[5] : PAL.grassLit[2 + (i % 3)];
      px(x, gx, gy, blade);
      if (hash2(seed, i, 7) > 0.45) px(x, gx, gy - 1, shade(blade, 20));
    }
  }
  if (kind === "flower") {
    const buds: [number, number, string][] = [[13, 6, "#c07090"], [18, 9, "#d0c060"], [12, 9, "#e8e0c8"], [17, 5, "#d080a0"]];
    for (const [bx, by, col] of buds) {
      if (hash2(seed, bx, by) > 0.3) {
        px(x, bx, by, col);
        px(x, bx, by - 1, "#3a8048");
      }
    }
  }
  if (kind === "garden") {
    // neat herb rows
    for (let row = 0; row < 3; row++) {
      for (let k = 0; k < 4; k++) {
        const gx = 8 + k * 4 + (row & 1), gy = 4 + row * 3;
        if (Math.abs(gx - 16) / 16 + Math.abs(gy - 8) / 8 > 0.75) continue;
        px(x, gx, gy, "#2a6830");
        px(x, gx, gy - 1, ["#50a050", "#80d070", "#c07090"][(k + row + seed) % 3]);
      }
    }
  }
  if (kind === "rail") {
    // two iron rails across the diamond, with ties
    for (let t = 0; t < 14; t++) {
      const x0 = 4 + t, y0 = 8 - Math.floor((t - 7) * 0.3);
      px(x, x0, y0 - 2, "#5a6058");
      px(x, x0, y0 + 2, "#3a4038");
      if (t % 3 === 0) {
        px(x, x0, y0 - 1, "#4a3020");
        px(x, x0, y0, "#4a3020");
        px(x, x0, y0 + 1, "#4a3020");
      }
    }
  }
  if (kind === "water") {
    px(x, 12, 7, "#8ad0d8", 0.55);
    px(x, 20, 9, "#60b0c0", 0.4);
  }
  return c;
}

export function paintBlock(kind: "cliff" | "stone" | "ash" | "mine" | "wood" | "ice", seed = 1): HTMLCanvasElement {
  const rise = kind === "mine" ? 14 : kind === "wood" ? 12 : 16;
  const { c, x } = canv(32, 16 + rise);
  const top =
    kind === "ash" ? PAL.ash :
    kind === "mine" ? ["#1a1814", "#2a2620", "#3a3630", "#4a4640", "#5a5850"] :
    kind === "wood" ? PAL.plank :
    kind === "ice" ? ["#1a2830", "#2a4850", "#4a7080", "#80b0c0", "#c0e0e8"] :
    PAL.stone;
  const left =
    kind === "ash" ? ["#12121a", "#1c1c26", "#2a2a36"] :
    kind === "mine" ? ["#1a1612", "#2a221c", "#3a3228"] :
    kind === "wood" ? ["#2a1c12", "#3a2818", "#4a3420"] :
    kind === "ice" ? ["#102028", "#183038", "#284850"] :
    ["#14181c", "#1c2428", "#2a3438"];
  const right =
    kind === "ash" ? ["#0c0c12", "#16161c", "#202028"] :
    kind === "mine" ? ["#12100c", "#1c1814", "#2a241c"] :
    kind === "wood" ? ["#1a120c", "#2a1c12", "#3a2818"] :
    kind === "ice" ? ["#0c181e", "#142028", "#1c3038"] :
    ["#0e1214", "#161c20", "#22282c"];
  isoBlock(x, 16, 8, 16, 8, rise, top, left, right, seed);
  if (kind === "cliff" || kind === "stone") {
    // moss flecks on top
    for (let i = 0; i < 5; i++) {
      const u = hash2(seed, i, 1), v = hash2(seed, i, 2);
      const gx = 8 + Math.floor(u * 16), gy = 3 + Math.floor(v * 8);
      if (Math.abs(gx - 16) / 16 + Math.abs(gy - 8) / 8 < 0.7) px(x, gx, gy, PAL.moss[3], 0.85);
    }
  }
  if (kind === "mine") {
    // ore sparkle
    for (let i = 0; i < 3; i++) {
      const gx = 10 + i * 5, gy = 18 + (i % 2) * 3;
      px(x, gx, gy, i === 1 ? "#80d0e8" : "#c0a050");
    }
  }
  return c;
}

function shadow(x: CanvasRenderingContext2D, cx: number, cy: number, hw: number, hh: number, a = 0.32) {
  fillDiamond(x, cx, cy, hw, hh, () => `rgba(0,0,0,${a})`);
}

function treeCanopy(
  x: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  dark: string, mid: string, lit: string, seed: number,
) {
  for (let y = -r - 1; y <= r + 2; y++) for (let xx = -r - 2; xx <= r + 2; xx++) {
    const iso = (Math.abs(xx) / (r + 1.2)) + (Math.abs(y) / (r * 0.7));
    if (iso > 1.15) continue;
    const n = hash2(seed, cx + xx, cy + y);
    const edge = iso > 0.88;
    let col = mid;
    if (xx < -1 && y < 0) col = lit;
    else if (xx > 1 || y > 1) col = dark;
    if (edge) col = dark;
    if (n < 0.12) col = lit;
    if (n > 0.88) col = dark;
    px(x, cx + xx, cy + y, col);
  }
}

export function tree(kind: "leaf" | "pine" | "willow" | "cherry" | "dead" | "bamboo" = "leaf"): HTMLCanvasElement {
  const { c, x } = canv(40, 56);
  shadow(x, 20, 50, 9, 4, 0.28);
  if (kind === "bamboo") {
    for (let i = 0; i < 3; i++) {
      const bx = 14 + i * 5, h = 28 + i * 4;
      rect(x, bx, 50 - h, 2, h, i === 1 ? "#3a8040" : "#2a6030");
      for (let k = 0; k < 4; k++) px(x, bx, 50 - 6 - k * 8, "#1a4020");
      px(x, bx - 3, 50 - h + 2, "#50a050");
      px(x, bx + 3, 50 - h + 4, "#68b868");
      px(x, bx + 1, 50 - h, "#80d080");
    }
    return c;
  }
  // trunk
  const trunkD = kind === "dead" ? "#2a2018" : "#2c1c14";
  const trunkL = kind === "dead" ? "#4a3a28" : "#4a2e1c";
  rect(x, 19, 36, 3, 14, trunkD);
  rect(x, 19, 36, 2, 14, trunkL);
  if (kind === "willow") {
    rect(x, 18, 34, 4, 6, trunkL);
    treeCanopy(x, 20, 22, 11, "#163820", "#215030", "#3a7848", 11);
    // hanging fronds
    for (let i = 0; i < 8; i++) {
      const fx = 10 + i * 3;
      for (let k = 0; k < 10 + (i % 3); k++) px(x, fx + (k % 2), 26 + k, k % 3 ? "#2a6840" : "#1a482c");
    }
    return c;
  }
  if (kind === "pine") {
    const greens = ["#0c2418", "#163c28", "#1e5434", "#2a7048", "#3c8a58"];
    for (let k = 0; k < 4; k++) {
      const y = 8 + k * 8;
      const w = 4 + k * 4;
      for (let t = 0; t <= w; t++) {
        const yy = y + Math.floor((12 * t) / w);
        px(x, 20 + t, yy, greens[Math.min(4, k)]);
        px(x, 20 - t, yy, greens[Math.max(0, k - 1)]);
        if (t < w * 0.45) px(x, 20 - 1, y + Math.floor((10 * t) / w), greens[Math.min(4, k + 1)]);
      }
    }
    return c;
  }
  if (kind === "cherry") {
    treeCanopy(x, 20, 22, 12, "#5a2838", "#a05068", "#e0a0b0", 21);
    treeCanopy(x, 16, 20, 7, "#703040", "#c07088", "#f0c0c8", 22);
    // petals
    for (let i = 0; i < 8; i++) {
      const u = hash2(30, i, 1), v = hash2(30, i, 2);
      px(x, 8 + Math.floor(u * 24), 28 + Math.floor(v * 20), "#f0d0d8");
    }
    return c;
  }
  if (kind === "dead") {
    treeCanopy(x, 20, 22, 8, "#2a2418", "#3a3428", "#5a4e38", 5);
    // bare branches
    for (let i = 0; i < 6; i++) {
      const dx = (i - 3) * 3;
      for (let k = 0; k < 8; k++) px(x, 20 + dx + (dx > 0 ? k : -k), 20 - k, "#3a2a1c");
    }
    return c;
  }
  // leafy
  treeCanopy(x, 20, 22, 12, "#0c2814", "#184820", "#2a7840", 7);
  treeCanopy(x, 16, 19, 7, "#163c20", "#246830", "#48a058", 8);
  return c;
}

export function rock(variant = 0): HTMLCanvasElement {
  const { c, x } = canv(24, 20);
  shadow(x, 12, 16, 10, 4, 0.25);
  const pal = variant === 1 ? ["#1a2830", "#2a4850", "#4a7080", "#80b0c0"] : PAL.stone;
  const pts: [number, number][] = variant === 1
    ? [[5, 14], [7, 6], [16, 5], [21, 13], [14, 17]]
    : [[4, 14], [8, 6], [18, 5], [22, 14], [12, 18]];
  // crude fill via bounding diamond-ish
  for (let y = 4; y < 19; y++) for (let xx = 3; xx < 23; xx++) {
    const inRough = xx > 5 && xx < 21 && y > 6 && y < 17 && Math.abs(xx - 12) / 10 + Math.abs(y - 12) / 7 < 1.15;
    if (!inRough) continue;
    const lit = xx < 12 && y < 12;
    const i = lit ? pal.length - 1 : (xx > 16 ? 1 : 2);
    px(x, xx, y, pal[Math.min(pal.length - 1, i)]);
  }
  px(x, 10, 8, shade(pal[pal.length - 1], 20));
  return c;
}

export function bush(flower = false): HTMLCanvasElement {
  const { c, x } = canv(22, 18);
  shadow(x, 11, 15, 8, 3, 0.22);
  treeCanopy(x, 9, 10, 6, "#184820", "#2a7040", "#3d8a50", 3);
  treeCanopy(x, 13, 9, 5, "#184820", "#2a7040", "#50a060", 4);
  if (flower) {
    px(x, 8, 8, "#d07090"); px(x, 14, 7, "#e8d080"); px(x, 11, 6, "#f0e8e0");
  }
  return c;
}

function roofPlanes(
  x: CanvasRenderingContext2D,
  cx: number, peakY: number, hw: number, hh: number,
  left: string, right: string, ridge: string, eave = true,
) {
  // left plane (peak -> left -> bottom)
  fillDiamond(x, cx, peakY + hh, hw, hh, (dx, dy, u, v) => {
    if (u + v > 0.05 && u < 0) return undefined as any;
    // split at vertical through peak: u < 0 is left
    const onLeft = (dx - cx) + (dy - (peakY + hh)) * 0 < 0 ? (dx <= cx) : (dx <= cx);
    // use simple: left of cx
    if (dx <= cx) {
      const t = (cx - dx) / hw;
      return t > 0.85 ? shade(left, -20) : (dy < peakY + hh * 0.4 ? shade(left, 18) : left);
    }
    return dx > cx ? (dy < peakY + hh * 0.4 ? shade(right, 8) : right) : left;
  });
  // ridge
  for (let t = 0; t <= hw; t++) {
    const lx = cx - t, ly = peakY + Math.round((hh / hw) * t);
    const rx = cx + t, ry = peakY + Math.round((hh / hw) * t);
    px(x, cx, peakY, ridge);
    if (t === 0) continue;
    px(x, lx, ly, ridge);
    px(x, rx, ry, shade(ridge, -20));
  }
  if (eave) {
    // upturned flying eaves at left/right corners
    px(x, cx - hw - 1, peakY + hh - 1, left);
    px(x, cx - hw - 2, peakY + hh - 2, shade(left, 20));
    px(x, cx + hw + 1, peakY + hh - 1, right);
    px(x, cx + hw + 2, peakY + hh - 2, shade(right, 10));
  }
}

export function house(style: "jade" | "red" | "gold" | "shop" | "elder" | "hut" = "jade"): HTMLCanvasElement {
  const tall = style === "elder" || style === "shop";
  const { c, x } = canv(tall ? 80 : 72, tall ? 80 : 72);
  const cx = c.width >> 1;
  const baseY = c.height - 6;
  shadow(x, cx, baseY + 1, tall ? 26 : 22, 8, 0.32);
  const wallL = style === "elder" ? "#5a4a38" : "#4a3828";
  const wallR = style === "elder" ? "#3a3024" : "#2e2218";
  const wallH = tall ? 22 : 18;
  const bodyW = tall ? 20 : 16;
  // iso walls — visible front faces
  for (let i = 0; i < wallH; i++) {
    for (let t = 0; t <= bodyW; t++) {
      const ly = baseY - wallH + i + Math.floor(t * 0.5);
      const ry = baseY - wallH + i + Math.floor(t * 0.5);
      const lc = i === wallH - 1 ? shade(wallL, -24) : (t < 2 ? shade(wallL, -16) : wallL);
      const rc = i === wallH - 1 ? shade(wallR, -20) : (t < 2 ? shade(wallR, -12) : wallR);
      px(x, cx - bodyW + t, ly, lc);
      px(x, cx + bodyW - t, ry, rc);
    }
  }
  // timber beams
  for (let t = 0; t <= bodyW; t++) {
    px(x, cx - bodyW + t, baseY - wallH + 3 + Math.floor(t * 0.5), shade(wallL, -30));
    px(x, cx + bodyW - t, baseY - wallH + 3 + Math.floor(t * 0.5), shade(wallR, -24));
  }
  // door on the right-front face
  const doorX = cx + 3, doorY = baseY - 12;
  rect(x, doorX, doorY, 6, 11, "#1a120c");
  rect(x, doorX + 1, doorY + 1, 2, 9, "#2a1c12");
  px(x, doorX + 4, doorY + 6, "#c8a050");
  // windows with warm light
  const win = style === "red" || style === "shop" ? "#c08040" : "#80c0a0";
  rect(x, cx - 12, baseY - wallH + 6, 5, 5, "#102020");
  rect(x, cx - 11, baseY - wallH + 7, 3, 3, win);
  px(x, cx - 10, baseY - wallH + 7, "#f0e8c0");
  if (tall) {
    rect(x, cx + 10, baseY - wallH + 6, 5, 5, "#102020");
    rect(x, cx + 11, baseY - wallH + 7, 3, 3, win);
  }
  const roofL =
    style === "red" || style === "shop" ? "#8a2818" :
    style === "gold" || style === "elder" ? "#8a6a20" :
    "#1c5a42";
  const roofR =
    style === "red" || style === "shop" ? "#5a1810" :
    style === "gold" || style === "elder" ? "#5a4410" :
    "#0a3024";
  const ridge =
    style === "gold" || style === "elder" ? "#e0c060" :
    style === "red" || style === "shop" ? "#d0a050" :
    "#80c0a0";
  // roof sits on the wall-top, only a 2px eave overlap so walls stay readable
  const hw = tall ? 26 : 22, hh = 8;
  const peakY = baseY - wallH - hh;
  fillDiamond(x, cx, peakY + hh, hw, hh, (dx, dy) => {
    const edge = Math.abs(dx - cx) / hw + Math.abs(dy - (peakY + hh)) / hh > 0.9;
    if (dx <= cx) return edge ? shade(roofL, -24) : (dy < peakY + hh * 0.45 ? shade(roofL, 18) : roofL);
    return edge ? shade(roofR, -18) : (dy < peakY + hh * 0.45 ? shade(roofR, 10) : roofR);
  });
  for (let k = 1; k < 4; k++) {
    const yy = peakY + 2 + k * 2;
    for (let t = -hw + k * 2; t <= hw - k * 2; t++) {
      const py = yy + Math.round(Math.abs(t) * 0.08);
      if (Math.abs(t) / hw + Math.abs(py - (peakY + hh)) / hh < 0.95)
        px(x, cx + t, py, t < 0 ? shade(roofL, -12) : shade(roofR, -12), 0.7);
    }
  }
  for (let t = 0; t <= hw - 2; t++) {
    px(x, cx - t, peakY + Math.round((hh / hw) * t), ridge);
    px(x, cx + t, peakY + Math.round((hh / hw) * t), shade(ridge, -20));
  }
  // flying eaves
  px(x, cx - hw - 1, peakY + hh - 1, roofL);
  px(x, cx - hw - 2, peakY + hh - 3, shade(roofL, 20));
  px(x, cx - hw - 3, peakY + hh - 4, ridge);
  px(x, cx + hw + 1, peakY + hh - 1, roofR);
  px(x, cx + hw + 2, peakY + hh - 3, shade(roofR, 10));
  px(x, cx + hw + 3, peakY + hh - 4, shade(ridge, -10));
  px(x, cx, peakY - 1, ridge);
  px(x, cx, peakY - 2, "#f0e8c0");
  if (style === "elder") {
    rect(x, cx - 3, baseY - wallH + 1, 7, 4, "#3a2010");
    px(x, cx, baseY - wallH + 2, "#e0c060");
  }
  rect(x, cx - bodyW + 3, baseY - wallH - 1, 3, 4, "#c04020");
  px(x, cx - bodyW + 4, baseY - wallH, "#f0d060");
  return c;
}

export function well(): HTMLCanvasElement {
  const { c, x } = canv(32, 36);
  shadow(x, 16, 32, 10, 4, 0.28);
  // stone ring
  fillDiamond(x, 16, 26, 10, 5, (dx, dy, u, v) => {
    if (Math.abs(u) + Math.abs(v) < 0.45) return "#0a1820";
    return PAL.stone[2 + ((dx + dy) & 1)];
  });
  for (let i = 0; i < 8; i++) px(x, 16 - 4 + i, 26, "#102028");
  // posts + beam + small roof
  rect(x, 8, 10, 2, 14, "#4a3020");
  rect(x, 22, 10, 2, 14, "#3a2418");
  rect(x, 8, 10, 16, 2, "#5a4030");
  fillDiamond(x, 16, 8, 12, 6, (dx) => dx <= 16 ? "#1c5a42" : "#0a3024");
  px(x, 16, 2, "#80c0a0");
  // bucket
  rect(x, 15, 16, 3, 4, "#3a2a18");
  px(x, 16, 14, "#c0a070");
  return c;
}

export function pool(): HTMLCanvasElement {
  const { c, x } = canv(40, 28);
  shadow(x, 20, 22, 16, 6, 0.2);
  fillDiamond(x, 20, 18, 16, 8, (dx, dy, u, v) => {
    const inner = Math.abs(u) + Math.abs(v) < 0.72;
    if (!inner) return PAL.stone[2 + ((dx + dy) & 1)];
    const wave = 2 + Math.floor((Math.sin(dx * 0.8) * 0.5 + 0.5) * 3);
    return PAL.shallow[Math.min(PAL.shallow.length - 1, wave)];
  });
  px(x, 16, 16, "#d0fff0");
  px(x, 24, 19, "#80e0c0");
  px(x, 20, 15, "#f0fff8");
  // ring stones
  px(x, 8, 18, PAL.stone[4]); px(x, 32, 18, PAL.stone[3]);
  return c;
}

export function portal(): HTMLCanvasElement {
  const { c, x } = canv(32, 48);
  shadow(x, 16, 44, 11, 4, 0.3);
  // stone gate posts
  rect(x, 5, 14, 5, 28, "#2a2c30");
  rect(x, 22, 14, 5, 28, "#1e2024");
  rect(x, 5, 12, 22, 4, "#3a3c40");
  rect(x, 6, 11, 20, 2, "#80e0d0");
  // inner glow
  for (let y = 16; y < 40; y++) for (let xx = 11; xx < 21; xx++) {
    const a = 1 - Math.abs(xx - 16) / 6 - Math.abs(y - 28) / 18;
    if (a > 0) px(x, xx, y, mix("#1a2040", "#80e0d0", Math.max(0, a)), 0.85);
  }
  px(x, 16, 24, "#e8fff8");
  // lintel gems
  px(x, 10, 13, "#40c8a0"); px(x, 16, 12, "#e0f0a0"); px(x, 22, 13, "#40c8a0");
  return c;
}

export function chest(): HTMLCanvasElement {
  const { c, x } = canv(22, 20);
  shadow(x, 11, 17, 8, 3, 0.25);
  rect(x, 3, 7, 16, 10, "#4a3018");
  rect(x, 3, 7, 16, 5, "#6a4820");
  rect(x, 3, 11, 16, 1, "#d0a040");
  rect(x, 10, 10, 2, 3, "#d0a040");
  px(x, 11, 11, "#f0e080");
  // lid highlight
  rect(x, 4, 8, 10, 1, "#8a6430");
  return c;
}

export function node(kind: "herb" | "ore" | "wood"): HTMLCanvasElement {
  const { c, x } = canv(18, 20);
  shadow(x, 9, 17, 6, 2, 0.2);
  if (kind === "herb") {
    rect(x, 8, 10, 2, 7, "#285828");
    px(x, 7, 9, "#50a050"); px(x, 6, 8, "#80e070");
    px(x, 10, 8, "#80e070"); px(x, 11, 7, "#c0f090");
    px(x, 9, 6, "#50a050");
    px(x, 7, 7, "#d07090");
  } else if (kind === "ore") {
    for (let y = 8; y < 16; y++) for (let xx = 4; xx < 14; xx++) {
      if (Math.abs(xx - 9) / 5 + Math.abs(y - 12) / 4 < 1) px(x, xx, y, PAL.stone[1 + ((xx + y) % 3)]);
    }
    px(x, 7, 11, "#80c0e0"); px(x, 10, 12, "#c0f0ff"); px(x, 8, 13, "#c0a050");
  } else {
    rect(x, 8, 8, 3, 9, "#3a2418");
    rect(x, 8, 8, 2, 9, "#4a3020");
    treeCanopy(x, 9, 8, 5, "#184820", "#246830", "#38a048", 2);
  }
  return c;
}

export function furnace(): HTMLCanvasElement {
  const { c, x } = canv(28, 34);
  shadow(x, 14, 30, 10, 4, 0.25);
  rect(x, 5, 12, 18, 16, "#3a3030");
  rect(x, 5, 12, 9, 16, "#4a4040");
  rect(x, 9, 18, 10, 8, "#201818");
  rect(x, 10, 20, 8, 5, "#e06020");
  rect(x, 12, 21, 4, 3, "#f0d060");
  px(x, 13, 20, "#fff0c0");
  rect(x, 8, 6, 12, 7, "#4a4040");
  rect(x, 11, 2, 6, 5, "#2a2828");
  // smoke
  px(x, 13, 1, "#6a6a70", 0.6);
  px(x, 15, 0, "#8a8a90", 0.4);
  return c;
}

export function cauldron(): HTMLCanvasElement {
  const { c, x } = canv(28, 28);
  shadow(x, 14, 24, 9, 3, 0.25);
  // pot
  for (let y = 10; y < 22; y++) for (let xx = 5; xx < 23; xx++) {
    if (Math.abs(xx - 14) / 8 + Math.abs(y - 16) / 6 < 1) {
      px(x, xx, y, xx < 14 ? "#3a3a44" : "#2a2a32");
    }
  }
  fillDiamond(x, 14, 13, 7, 3, () => "#1a4030");
  px(x, 13, 12, "#80f0c0"); px(x, 15, 13, "#40c080");
  // legs + handles
  rect(x, 6, 12, 2, 10, "#5a4030");
  rect(x, 20, 12, 2, 10, "#4a3020");
  rect(x, 4, 13, 4, 2, "#5a4030");
  rect(x, 20, 13, 4, 2, "#4a3020");
  return c;
}

export function stele(): HTMLCanvasElement {
  const { c, x } = canv(20, 36);
  shadow(x, 10, 32, 7, 3, 0.25);
  rect(x, 5, 6, 10, 24, "#3a4048");
  rect(x, 5, 6, 5, 24, "#4a5058");
  rect(x, 6, 8, 8, 5, "#6a8080");
  rect(x, 7, 16, 6, 8, "#2a3034");
  px(x, 9, 18, "#80e0c0");
  px(x, 10, 20, "#80e0c0");
  px(x, 9, 22, "#80e0c0");
  // cap
  rect(x, 4, 4, 12, 3, "#5a6058");
  px(x, 10, 3, "#80c0a0");
  return c;
}

export function stall(): HTMLCanvasElement {
  const { c, x } = canv(40, 36);
  shadow(x, 20, 32, 14, 5, 0.25);
  rect(x, 6, 18, 28, 10, "#4a3020");
  rect(x, 6, 18, 28, 3, "#5a4030");
  // goods
  px(x, 10, 20, "#c04040"); px(x, 14, 20, "#e0d080"); px(x, 18, 21, "#50a070");
  px(x, 24, 20, "#8060c0"); px(x, 28, 21, "#d0a040");
  fillDiamond(x, 20, 12, 16, 8, (dx) => dx <= 20 ? "#8a2020" : "#5a1010");
  // posts
  rect(x, 7, 16, 2, 12, "#3a2418");
  rect(x, 31, 16, 2, 12, "#2a1c10");
  return c;
}

export function auctionHouse(): HTMLCanvasElement {
  const { c, x } = canv(80, 72);
  const cx = 40, baseY = 64;
  shadow(x, cx, baseY, 30, 8, 0.32);
  const wallH = 22, bodyW = 26;
  for (let i = 0; i < wallH; i++) {
    for (let t = 0; t <= bodyW; t++) {
      px(x, cx - bodyW + t, baseY - wallH + i + Math.floor(t * 0.5), "#3a3844");
      px(x, cx + bodyW - t, baseY - wallH + i + Math.floor(t * 0.5), "#2a2830");
    }
  }
  // grand door
  rect(x, cx - 4, baseY - 16, 10, 14, "#101018");
  rect(x, cx - 3, baseY - 15, 3, 12, "#1a1a28");
  px(x, cx + 3, baseY - 8, "#c0a050");
  // windows
  for (const wx of [-16, 14]) {
    rect(x, cx + wx, baseY - 16, 6, 6, "#101018");
    rect(x, cx + wx + 1, baseY - 15, 4, 4, "#80e0d0");
  }
  const hw = 34, hh = 16, peakY = baseY - wallH - hh + 4;
  fillDiamond(x, cx, peakY + hh, hw, hh, (dx, dy) => {
    if (dx <= cx) return dy < peakY + 8 ? "#d0b050" : "#c0a050";
    return dy < peakY + 8 ? "#8a7020" : "#6a5818";
  });
  for (let t = 0; t <= hw - 2; t++) {
    px(x, cx - t, peakY + Math.round((hh / hw) * t), "#f0e0a0");
    px(x, cx + t, peakY + Math.round((hh / hw) * t), "#a08a40");
  }
  // flying eaves + crest
  px(x, cx - hw - 2, peakY + hh - 3, "#d0b050");
  px(x, cx - hw - 3, peakY + hh - 5, "#f0e0a0");
  px(x, cx + hw + 2, peakY + hh - 3, "#8a7020");
  px(x, cx, peakY - 2, "#f0e0a0");
  px(x, cx, peakY - 4, "#fff8d0");
  return c;
}

export function lantern(): HTMLCanvasElement {
  const { c, x } = canv(14, 24);
  shadow(x, 7, 22, 4, 2, 0.2);
  rect(x, 6, 4, 2, 5, "#3a2a18");
  rect(x, 3, 8, 8, 9, "#c04020");
  rect(x, 4, 9, 6, 7, "#e06030");
  rect(x, 5, 10, 4, 4, "#f0d060");
  px(x, 6, 11, "#fff0c0");
  rect(x, 3, 8, 8, 1, "#d0a040");
  rect(x, 3, 16, 8, 1, "#d0a040");
  rect(x, 5, 17, 4, 3, "#3a2a18");
  return c;
}

export function fence(dir: "ne" | "nw"): HTMLCanvasElement {
  const { c, x } = canv(24, 20);
  shadow(x, 12, 16, 8, 3, 0.15);
  const step = dir === "ne" ? 1 : -1;
  for (let i = 0; i < 5; i++) {
    const fx = dir === "ne" ? 3 + i * 4 : 18 - i * 4;
    const fy = 8 + i * 2;
    rect(x, fx, fy, 2, 7, i % 2 ? "#4a3020" : "#3a2418");
    px(x, fx, fy + 2, "#5a4030");
  }
  // rail
  for (let i = 0; i < 16; i++) {
    const fx = dir === "ne" ? 3 + i : 20 - i;
    const fy = 10 + Math.floor(i * 0.5);
    px(x, fx, fy, "#5a4030");
    px(x, fx, fy + 3, "#4a3020");
  }
  void step;
  return c;
}

export function signpost(): HTMLCanvasElement {
  const { c, x } = canv(18, 28);
  shadow(x, 8, 25, 5, 2, 0.2);
  rect(x, 8, 8, 2, 16, "#4a3020");
  rect(x, 3, 8, 13, 7, "#5a4030");
  rect(x, 4, 9, 11, 5, "#d0c8a0");
  px(x, 7, 11, "#2a2010"); px(x, 9, 11, "#2a2010"); px(x, 11, 11, "#2a2010");
  return c;
}

export function herbPlot(): HTMLCanvasElement {
  const { c, x } = canv(28, 20);
  shadow(x, 14, 16, 11, 4, 0.18);
  fillDiamond(x, 14, 12, 12, 6, (dx, dy) => ((dx + dy) & 1) ? "#3a2a18" : "#2a2014");
  const cols = ["#50a050", "#80d070", "#c07090", "#80e0c0"];
  for (let i = 0; i < 6; i++) {
    const gx = 8 + (i % 3) * 5, gy = 9 + Math.floor(i / 3) * 4;
    px(x, gx, gy, "#2a6030");
    px(x, gx, gy - 1, cols[i % 4]);
    px(x, gx + 1, gy - 2, cols[(i + 1) % 4]);
  }
  return c;
}

export function gate(): HTMLCanvasElement {
  const { c, x } = canv(48, 48);
  shadow(x, 24, 44, 18, 5, 0.28);
  rect(x, 6, 16, 6, 26, "#3a2a18");
  rect(x, 36, 16, 6, 26, "#2a1c10");
  rect(x, 6, 14, 36, 5, "#4a3420");
  // small roof
  fillDiamond(x, 24, 12, 22, 10, (dx) => dx <= 24 ? "#1c5a42" : "#0a3024");
  px(x, 24, 3, "#80c0a0");
  // plaque
  rect(x, 16, 16, 16, 6, "#3a2010");
  rect(x, 17, 17, 14, 4, "#e0c060");
  // lanterns
  rect(x, 8, 22, 3, 4, "#c04020"); px(x, 9, 23, "#f0d060");
  rect(x, 37, 22, 3, 4, "#c04020"); px(x, 38, 23, "#f0d060");
  return c;
}

export function crate(): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  shadow(x, 8, 13, 6, 2, 0.2);
  rect(x, 3, 4, 10, 9, "#4a3020");
  rect(x, 3, 4, 10, 3, "#5a4030");
  rect(x, 3, 8, 10, 1, "#2a1c10");
  return c;
}

export function cart(): HTMLCanvasElement {
  const { c, x } = canv(28, 22);
  shadow(x, 14, 18, 10, 3, 0.22);
  rect(x, 4, 6, 18, 8, "#4a3020");
  rect(x, 4, 6, 18, 2, "#5a4030");
  // wheels
  rect(x, 5, 13, 4, 4, "#2a2a28");
  rect(x, 17, 13, 4, 4, "#2a2a28");
  px(x, 7, 15, "#6a6a60"); px(x, 19, 15, "#6a6a60");
  // ore pile
  px(x, 10, 5, "#80c0e0"); px(x, 13, 4, "#5a5850"); px(x, 16, 5, "#c0a050");
  return c;
}

export function support(): HTMLCanvasElement {
  const { c, x } = canv(28, 36);
  shadow(x, 14, 33, 10, 3, 0.18);
  rect(x, 5, 6, 3, 26, "#3a2a18");
  rect(x, 20, 6, 3, 26, "#2a1c10");
  rect(x, 5, 6, 18, 3, "#4a3420");
  rect(x, 5, 18, 18, 2, "#3a2a18");
  return c;
}

export function oreVein(): HTMLCanvasElement {
  const { c, x } = canv(20, 22);
  shadow(x, 10, 18, 7, 3, 0.2);
  for (let y = 4; y < 18; y++) for (let xx = 3; xx < 17; xx++) {
    if (Math.abs(xx - 10) / 7 + Math.abs(y - 11) / 7 < 1) px(x, xx, y, PAL.stone[(xx + y) % 4]);
  }
  px(x, 8, 9, "#80c0e0"); px(x, 11, 11, "#c0f0ff"); px(x, 9, 13, "#80c0e0");
  px(x, 12, 8, "#c0a050");
  return c;
}

export function torch(): HTMLCanvasElement {
  const { c, x } = canv(12, 22);
  shadow(x, 6, 20, 3, 1, 0.15);
  rect(x, 5, 8, 2, 11, "#4a3020");
  rect(x, 4, 5, 4, 5, "#e06020");
  rect(x, 5, 4, 2, 3, "#f0d060");
  px(x, 6, 3, "#fff0c0");
  return c;
}

export function dock(): HTMLCanvasElement {
  const { c, x } = canv(40, 24);
  shadow(x, 20, 20, 14, 4, 0.2);
  for (let i = 0; i < 8; i++) {
    rect(x, 4 + i * 4, 8 + (i % 2), 4, 10, i % 2 ? "#4a3020" : "#3a2418");
  }
  rect(x, 4, 8, 32, 2, "#5a4030");
  return c;
}

export function bridge(): HTMLCanvasElement {
  const { c, x } = canv(40, 20);
  fillDiamond(x, 20, 12, 18, 6, (dx, dy) => ((dx + dy) % 3 === 0) ? "#3a2418" : "#4a3420");
  rect(x, 4, 6, 2, 8, "#3a2418");
  rect(x, 34, 6, 2, 8, "#2a1c10");
  return c;
}

export function addWorldArt(add: (key: string, canvas: HTMLCanvasElement) => void) {
  const tiles: TileKind[] = [
    "grass", "grass2", "dirt", "stone", "water", "sand", "path",
    "floor", "wood", "ash", "forbidden", "snow", "flower", "cliff",
    "cobble", "garden", "plank", "rail", "moss", "shallow",
  ];
  tiles.forEach((t, i) => {
    add("tile_" + t, paintTile(t, 17 + i * 13));
    add("tile_" + t + "_b", paintTile(t, 91 + i * 17));
  });
  add("block_cliff", paintBlock("cliff", 3));
  add("block_stone", paintBlock("stone", 5));
  add("block_ash", paintBlock("ash", 7));
  add("block_mine", paintBlock("mine", 9));
  add("block_wood", paintBlock("wood", 11));
  add("block_ice", paintBlock("ice", 13));

  add("obj_tree", tree("leaf"));
  add("obj_pine", tree("pine"));
  add("obj_willow", tree("willow"));
  add("obj_cherry", tree("cherry"));
  add("obj_dead", tree("dead"));
  add("obj_bamboo", tree("bamboo"));
  add("obj_rock", rock(0));
  add("obj_rock_ice", rock(1));
  add("obj_bush", bush(false));
  add("obj_bush_flower", bush(true));
  add("obj_house", house("jade"));
  add("obj_house_red", house("red"));
  add("obj_house_gold", house("gold"));
  add("obj_house_shop", house("shop"));
  add("obj_house_elder", house("elder"));
  add("obj_house_hut", house("hut"));
  add("obj_well", well());
  add("obj_pool", pool());
  add("obj_portal", portal());
  add("obj_chest", chest());
  add("obj_herb", node("herb"));
  add("obj_ore", node("ore"));
  add("obj_wood", node("wood"));
  add("obj_furnace", furnace());
  add("obj_cauldron", cauldron());
  add("obj_stele", stele());
  add("obj_stall", stall());
  add("obj_auction", auctionHouse());
  add("obj_lantern", lantern());
  add("obj_fence_ne", fence("ne"));
  add("obj_fence_nw", fence("nw"));
  add("obj_sign", signpost());
  add("obj_plot", herbPlot());
  add("obj_gate", gate());
  add("obj_crate", crate());
  add("obj_cart", cart());
  add("obj_support", support());
  add("obj_vein", oreVein());
  add("obj_torch", torch());
  add("obj_dock", dock());
  add("obj_bridge", bridge());
}

export const TILE_KINDS = [
  "grass", "grass2", "dirt", "stone", "water", "sand", "path",
  "floor", "wood", "ash", "forbidden", "snow", "flower", "cliff",
  "cobble", "garden", "plank", "rail", "moss", "shallow",
] as const;
