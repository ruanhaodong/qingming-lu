/** Authored 16×16 top-down tiles and GBA-like overworld props. Original art only. */

import { PAL, canv, disk, hash2, mix, outline, px, rect, scaleN, shade, type TileKind } from "./pix";

const TS = 16;

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
  const { c, x } = canv(TS, TS);
  const pal = palOf(kind);

  for (let y = 0; y < TS; y++) for (let xx = 0; xx < TS; xx++) {
    const n = hash2(seed, xx, y);
    const n2 = hash2(seed + 9, xx * 3, y * 3);
    let i = 2 + Math.floor(n * (pal.length - 3));
    if (kind === "grass2") i = Math.max(0, i - 1);
    if (kind === "forbidden") i = Math.min(pal.length - 1, i);
    let col = pal[Math.max(0, Math.min(pal.length - 1, i))];

    if (kind === "path") {
      // worn center, slightly darker flecks
      const cx = Math.abs(xx - 7.5) / 8, cy = Math.abs(y - 7.5) / 8;
      if (cx + cy < 0.9) col = shade(col, 10);
      if (n2 < 0.08) col = pal[Math.max(0, i - 1)];
    }
    if (kind === "cobble") {
      const gx = Math.floor((xx + (y & 2)) / 5) * 5;
      const gy = Math.floor((y + (xx & 2)) / 4) * 4;
      const g = hash2(seed, gx, gy);
      col = pal[1 + Math.floor(g * (pal.length - 2))];
      if (xx === gx || y === gy) col = shade(col, -22);
    }
    if (kind === "plank") {
      const board = Math.floor(y / 4);
      col = pal[(board + Math.floor(n * 2)) % pal.length];
      if (y % 4 === 0) col = shade(col, -24);
      if (xx === 0 || xx === 15) col = shade(col, -16);
    }
    if (kind === "rail") {
      col = PAL.dirt[2 + Math.floor(n * 2)];
    }
    if (kind === "water" || kind === "shallow") {
      const wave = Math.sin((xx + seed) * 0.7 + y * 0.45) * 0.5 + 0.5;
      i = 2 + Math.floor(wave * 3);
      if (n < 0.06) i = Math.min(pal.length - 1, i + 2);
      col = pal[Math.max(0, Math.min(pal.length - 1, i))];
    }
    if (kind === "garden") {
      col = (Math.floor(xx / 4) + Math.floor(y / 5)) % 2 ? PAL.dirt[2] : PAL.garden[1];
    }
    if (kind === "moss") {
      col = n < 0.45 ? PAL.moss[2 + Math.floor(n2 * 3)] : PAL.stone[2];
    }
    if (kind === "flower") {
      if (n < 0.3) col = PAL.grassLit[Math.floor(n2 * PAL.grassLit.length)];
    }
    if (kind === "floor") {
      if ((xx + y) % 7 === 0) col = shade(col, -12);
    }
    if (kind === "ash" || kind === "forbidden") {
      if (n2 < 0.05) col = shade(col, 18);
    }
    px(x, xx, y, col);
  }

  // Irregular grass tufts — not a stamped grid.
  if (kind === "grass" || kind === "grass2" || kind === "flower" || kind === "moss") {
    const tufts = 3 + (seed % 3);
    for (let i = 0; i < tufts; i++) {
      const gx = 1 + Math.floor(hash2(seed, i, 20) * 13);
      const gy = 2 + Math.floor(hash2(seed, i, 40) * 12);
      const blade = kind === "grass2" ? PAL.grass[4] : PAL.grassLit[1 + (i % 3)];
      px(x, gx, gy, blade);
      if (hash2(seed, i, 7) > 0.4) px(x, gx, gy - 1, shade(blade, 16));
      if (hash2(seed, i, 11) > 0.7) px(x, gx + 1, gy, shade(blade, -10));
    }
  }
  if (kind === "flower") {
    const buds: [number, number, string][] = [
      [4, 5, "#e07090"], [11, 8, "#e8d060"], [7, 12, "#f0e8e0"], [13, 4, "#d080a0"],
    ];
    for (const [bx, by, col] of buds) {
      if (hash2(seed, bx, by) > 0.28) {
        px(x, bx, by, col);
        px(x, bx, by - 1, "#2a8030");
      }
    }
  }
  if (kind === "garden") {
    for (let row = 0; row < 3; row++) {
      for (let k = 0; k < 3; k++) {
        const gx = 3 + k * 4, gy = 3 + row * 4;
        px(x, gx, gy, "#2a6830");
        px(x, gx, gy - 1, ["#50a050", "#80d070", "#c07090"][(k + row + seed) % 3]);
      }
    }
  }
  if (kind === "rail") {
    // Wooden ties + two iron rails, running north–south.
    for (let y = 0; y < 16; y++) {
      if (y % 4 === 1) {
        for (let xx = 3; xx <= 12; xx++) px(x, xx, y, "#6a4a28");
      }
      px(x, 5, y, "#7a8080");
      px(x, 6, y, "#5a6058");
      px(x, 9, y, "#7a8080");
      px(x, 10, y, "#5a6058");
    }
  }
  if (kind === "water") {
    const hx = 3 + (seed % 8), hy = 4 + ((seed * 3) % 7);
    px(x, hx, hy, "#c0ecf8", 0.7);
    px(x, (hx + 6) % 14 + 1, (hy + 5) % 13 + 1, "#90d4f8", 0.45);
  }
  return c;
}

/** Front-facing cave / cliff wall. 16×32, feet on the tile, face rises north. */
export function paintBlock(kind: "cliff" | "stone" | "ash" | "mine" | "wood" | "ice", seed = 1): HTMLCanvasElement {
  const { c, x } = canv(16, 32);
  const top =
    kind === "ash" ? PAL.ash :
    kind === "mine" ? ["#2a241c", "#3a3428", "#4a4438", "#5a5448", "#6a6458"] :
    kind === "wood" ? PAL.plank :
    kind === "ice" ? ["#1a2830", "#2a4850", "#4a7080", "#80b0c0", "#c0e0e8"] :
    PAL.stone;
  const face =
    kind === "ash" ? ["#16161e", "#22222c", "#30303c", "#40404c"] :
    kind === "mine" ? ["#1c1814", "#2a241c", "#3a3228", "#4a4234"] :
    kind === "wood" ? ["#2a1c12", "#3a2818", "#4a3420"] :
    kind === "ice" ? ["#102028", "#183038", "#284850"] :
    ["#181c20", "#24282c", "#32363a", "#42464a"];

  // Floor lip at the very bottom (walkable side of the wall).
  for (let xx = 0; xx < 16; xx++) {
    px(x, xx, 31, shade(face[0], -10));
    px(x, xx, 30, face[0]);
  }
  // South face
  for (let y = 12; y < 30; y++) for (let xx = 0; xx < 16; xx++) {
    const n = hash2(seed, xx, y);
    let col = face[Math.floor(n * face.length)];
    if (xx === 0 || xx === 15) col = shade(col, -20);
    // layered strata
    if ((y + seed) % 6 === 0) col = shade(col, -16);
    if (n < 0.08) col = shade(col, 14);
    px(x, xx, y, col);
  }
  // Top cap (the surface of the rock, seen in 3/4)
  for (let y = 4; y < 13; y++) for (let xx = 0; xx < 16; xx++) {
    const n = hash2(seed + 2, xx, y);
    let col = top[1 + Math.floor(n * (top.length - 2))];
    if (y === 4 || y === 12) col = shade(col, -22);
    if (xx === 0 || xx === 15) col = shade(col, -16);
    if (n > 0.85) col = shade(col, 12);
    px(x, xx, y, col);
  }
  // Jagged silhouette on the top edge
  for (let xx = 0; xx < 16; xx++) {
    const peak = 3 + Math.floor(hash2(seed, xx, 1) * 3);
    for (let y = peak; y < 5; y++) px(x, xx, y, shade(top[top.length - 2], y === peak ? -20 : 0));
  }
  if (kind === "cliff" || kind === "stone") {
    for (let i = 0; i < 4; i++) {
      const gx = 2 + Math.floor(hash2(seed, i, 1) * 12);
      const gy = 6 + Math.floor(hash2(seed, i, 2) * 5);
      px(x, gx, gy, PAL.moss[3], 0.85);
    }
  }
  if (kind === "mine") {
    px(x, 4, 20, "#80d0e8");
    px(x, 9, 24, "#c0a050");
    px(x, 12, 18, "#80d0e8");
  }
  return outline(c, "#101010");
}

function shadow(x: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, a = 0.28) {
  disk(x, cx, cy, rx, ry, "#000000", a);
}

function canopy(
  x: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
  dark: string, mid: string, lit: string, seed: number,
) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let xx = Math.floor(cx - rx - 1); xx <= Math.ceil(cx + rx + 1); xx++) {
      const u = (xx - cx) / rx, v = (y - cy) / ry;
      const d = u * u + v * v;
      if (d > 1.05) continue;
      const n = hash2(seed, xx, y);
      let col = mid;
      if (u < -0.15 && v < -0.1) col = lit;
      else if (u > 0.2 || v > 0.25) col = dark;
      if (d > 0.82) col = dark;
      if (n < 0.1) col = lit;
      if (n > 0.9) col = dark;
      px(x, xx, y, col);
    }
  }
}

export function tree(kind: "leaf" | "pine" | "willow" | "cherry" | "dead" | "bamboo" = "leaf"): HTMLCanvasElement {
  const { c, x } = canv(32, 48);
  shadow(x, 16, 45, 8, 3, 0.28);
  if (kind === "bamboo") {
    for (let i = 0; i < 3; i++) {
      const bx = 10 + i * 6, h = 26 + i * 5;
      rect(x, bx, 45 - h, 2, h, i === 1 ? "#3a9040" : "#2a7030");
      for (let k = 0; k < 5; k++) px(x, bx, 45 - 5 - k * 7, "#1a4820");
      px(x, bx - 3, 45 - h + 2, "#50b050");
      px(x, bx + 3, 45 - h + 4, "#68c868");
      px(x, bx + 1, 45 - h, "#80d880");
    }
    return scaleN(outline(c), 2);
  }
  const trunkD = kind === "dead" ? "#3a2a18" : "#4a2e18";
  const trunkL = kind === "dead" ? "#5a3e28" : "#6a4424";
  rect(x, 14, 32, 4, 13, trunkD);
  rect(x, 14, 32, 2, 13, trunkL);
  if (kind === "willow") {
    canopy(x, 16, 20, 13, 10, "#163c20", "#215830", "#3a8850", 11);
    for (let i = 0; i < 9; i++) {
      const fx = 5 + i * 3;
      const len = 12 + (i % 3) * 2;
      for (let k = 0; k < len; k++) px(x, fx + (k % 2), 22 + k, k % 3 ? "#2a7848" : "#1a5830");
    }
    return scaleN(outline(c), 2);
  }
  if (kind === "pine") {
    const greens = ["#0c2818", "#164830", "#1e6440", "#2a8850", "#3ca060"];
    for (let k = 0; k < 5; k++) {
      const y0 = 4 + k * 6;
      const w = 3 + k * 3;
      for (let t = 0; t <= w; t++) {
        const yy = y0 + Math.floor((t * 8) / Math.max(1, w));
        px(x, 16 + t, yy, greens[Math.min(4, k)]);
        px(x, 16 - t, yy, greens[Math.max(0, k - 1)]);
      }
    }
    return scaleN(outline(c), 2);
  }
  if (kind === "cherry") {
    canopy(x, 16, 20, 13, 11, "#6a2840", "#c06080", "#f0b0c0", 21);
    canopy(x, 12, 16, 7, 6, "#803048", "#d07090", "#f8d0d8", 22);
    for (let i = 0; i < 8; i++) {
      const u = hash2(30, i, 1), v = hash2(30, i, 2);
      px(x, 4 + Math.floor(u * 24), 28 + Math.floor(v * 14), "#f8d8e0");
    }
    return scaleN(outline(c), 2);
  }
  if (kind === "dead") {
    canopy(x, 16, 20, 8, 7, "#2a2418", "#3a3428", "#5a4e38", 5);
    for (let i = 0; i < 6; i++) {
      const dx = (i - 3) * 3;
      for (let k = 0; k < 9; k++) px(x, 16 + dx + (dx > 0 ? k : -k), 18 - k, "#4a3420");
    }
    return scaleN(outline(c), 2);
  }
  canopy(x, 16, 20, 13, 11, "#0c3014", "#1a5824", "#2e9040", 7);
  canopy(x, 12, 16, 7, 6, "#164c20", "#247830", "#48b058", 8);
  return scaleN(outline(c), 2);
}

export function rock(variant = 0): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  shadow(x, 8, 14, 6, 2, 0.25);
  const pal = variant === 1 ? ["#1a2830", "#2a4850", "#4a7080", "#80b0c0"] : PAL.stone;
  for (let y = 5; y < 15; y++) for (let xx = 2; xx < 14; xx++) {
    const inR = Math.abs(xx - 8) / 6 + Math.abs(y - 10) / 5 < 1.05;
    if (!inR) continue;
    const lit = xx < 8 && y < 10;
    px(x, xx, y, pal[lit ? pal.length - 1 : (xx > 11 ? 1 : 2)]);
  }
  px(x, 6, 7, shade(pal[pal.length - 1], 20));
  return scaleN(outline(c), 2);
}

export function bush(flower = false): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  shadow(x, 8, 14, 6, 2, 0.22);
  canopy(x, 6, 9, 6, 5, "#184820", "#2a8040", "#48a058", 3);
  canopy(x, 10, 8, 5, 5, "#184820", "#2a8040", "#58b868", 4);
  if (flower) {
    px(x, 5, 7, "#e07090"); px(x, 11, 6, "#e8d060"); px(x, 8, 5, "#f0e8e0");
  }
  return scaleN(outline(c), 2);
}

export function house(style: "jade" | "red" | "gold" | "shop" | "elder" | "hut" = "jade"): HTMLCanvasElement {
  const tall = style === "elder" || style === "shop";
  const W = tall ? 48 : 32, H = tall ? 56 : 48;
  const { c, x } = canv(W, H);
  const cx = W >> 1;
  const base = H - 2;
  shadow(x, cx, base, tall ? 22 : 16, 4, 0.3);

  const wallL = style === "hut" ? "#c8a868" : "#f0e0c0";
  const wallM = style === "hut" ? "#b09058" : "#e0d0a8";
  const wallD = style === "hut" ? "#8a6c38" : "#c8b888";
  const timber = "#5a3c20";
  const wallW = tall ? 36 : 24;
  const wallH = tall ? 20 : 16;
  const wallX = cx - (wallW >> 1);
  const wallY = base - wallH;

  // South facade
  rect(x, wallX, wallY, wallW, wallH, wallM);
  rect(x, wallX, wallY, 2, wallH, wallL);
  rect(x, wallX + wallW - 2, wallY, 2, wallH, wallD);
  // timber posts + beam
  rect(x, wallX, wallY, 2, wallH, timber);
  rect(x, wallX + wallW - 2, wallY, 2, wallH, timber);
  rect(x, wallX, wallY + 2, wallW, 2, timber);
  rect(x, wallX, base - 2, wallW, 2, timber);

  // Door (center-bottom)
  const dw = 8, dh = 12;
  const dx0 = cx - (dw >> 1), dy0 = base - dh;
  rect(x, dx0, dy0, dw, dh, "#3a2414");
  rect(x, dx0 + 1, dy0 + 1, 3, dh - 2, "#5a3c24");
  px(x, dx0 + 6, dy0 + 7, "#e0c060");
  // windows
  const win = style === "red" || style === "shop" ? "#e09040" : "#80e0c8";
  const placeWin = (wx: number, wy: number) => {
    rect(x, wx, wy, 6, 6, "#203028");
    rect(x, wx + 1, wy + 1, 4, 4, win);
    px(x, wx + 2, wy + 1, "#f8f0c8");
    px(x, wx + 3, wy + 3, "#203028");
    px(x, wx + 1, wy + 3, "#203028");
  };
  placeWin(wallX + 4, wallY + 6);
  placeWin(wallX + wallW - 10, wallY + 6);
  if (tall) placeWin(cx - 3, wallY + 6);

  const roofL =
    style === "red" || style === "shop" ? "#c83820" :
    style === "gold" || style === "elder" ? "#e0b030" :
    style === "hut" ? "#c89840" :
    "#1c8860";
  const roofR =
    style === "red" || style === "shop" ? "#8a2014" :
    style === "gold" || style === "elder" ? "#a07818" :
    style === "hut" ? "#8a6828" :
    "#0c5a40";
  const ridge =
    style === "gold" || style === "elder" ? "#f8e080" :
    style === "red" || style === "shop" ? "#e0b050" :
    style === "hut" ? "#e0c070" :
    "#80e0c0";

  // Trapezoid roof sitting on the wall, with eaves
  const roofTop = wallY - (tall ? 22 : 18);
  const eave = 4;
  const roofW = wallW + eave * 2;
  const roofX = wallX - eave;
  const roofH = wallY - roofTop + 4;
  for (let y = 0; y < roofH; y++) {
    const t = y / Math.max(1, roofH - 1);
    const inset = Math.floor((1 - t) * (roofW / 2 - 2));
    const y0 = roofTop + y;
    for (let xx = roofX + inset; xx < roofX + roofW - inset; xx++) {
      const onLeft = xx < cx;
      let col = onLeft ? roofL : roofR;
      if (y < 2) col = ridge;
      if (xx === roofX + inset || xx === roofX + roofW - inset - 1) col = shade(col, -24);
      // tile rows
      if (y > 2 && y % 4 === 0) col = shade(col, -16);
      px(x, xx, y0, col);
    }
    // flying eave tips at the bottom corners
    if (y === roofH - 1) {
      px(x, roofX + inset - 1, y0 - 1, roofL);
      px(x, roofX + inset - 2, y0 - 2, shade(roofL, 16));
      px(x, roofX + roofW - inset, y0 - 1, roofR);
      px(x, roofX + roofW - inset + 1, y0 - 2, shade(roofR, 10));
    }
  }
  // ridge ornament
  px(x, cx, roofTop - 1, ridge);
  px(x, cx, roofTop - 2, "#f8f0d0");

  if (style === "elder") {
    rect(x, cx - 8, wallY + 1, 16, 5, "#5a3010");
    rect(x, cx - 7, wallY + 2, 14, 3, "#e0c060");
  }
  if (style === "shop") {
    rect(x, cx - 10, wallY - 1, 20, 5, "#8a2010");
    rect(x, cx - 9, wallY, 18, 3, "#f0d060");
  }
  // chimney
  const chx = wallX + 4;
  rect(x, chx, roofTop + 8, 4, 10, "#c04020");
  px(x, chx + 1, roofTop + 7, "#f0d060");
  return scaleN(outline(c), 2);
}

export function well(): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  shadow(x, 12, 30, 8, 3, 0.28);
  // stone cylinder
  for (let y = 18; y < 28; y++) for (let xx = 4; xx < 20; xx++) {
    if (Math.abs(xx - 12) / 8 + Math.abs(y - 23) / 6 < 1) px(x, xx, y, PAL.stone[(xx + y) % 4 + 1]);
  }
  // opening
  disk(x, 12, 20, 6, 3, "#0a1820");
  disk(x, 12, 20, 6, 3, PAL.stone[3], 0); // no-op, ring already around
  for (let t = 0; t < 16; t++) {
    const a = (t / 16) * Math.PI * 2;
    px(x, 12 + Math.round(Math.cos(a) * 6), 20 + Math.round(Math.sin(a) * 3), PAL.stone[4]);
  }
  // posts + beam + small roof
  rect(x, 5, 8, 2, 12, "#6a4a28");
  rect(x, 17, 8, 2, 12, "#5a3c20");
  rect(x, 5, 8, 14, 2, "#7a5a30");
  for (let y = 0; y < 8; y++) {
    const inset = Math.floor((7 - y) * 0.8);
    for (let xx = 4 + inset; xx < 20 - inset; xx++) px(x, xx, 2 + y, xx < 12 ? "#1c8860" : "#0c5a40");
  }
  px(x, 12, 1, "#80e0c0");
  // bucket
  rect(x, 11, 12, 3, 4, "#5a3c20");
  px(x, 12, 11, "#e0c070");
  return scaleN(outline(c), 2);
}

export function pool(): HTMLCanvasElement {
  const { c, x } = canv(32, 24);
  shadow(x, 16, 20, 13, 4, 0.2);
  for (let y = 4; y < 22; y++) for (let xx = 2; xx < 30; xx++) {
    const u = (xx - 16) / 14, v = (y - 13) / 8;
    const d = u * u + v * v;
    if (d > 1) continue;
    if (d > 0.72) px(x, xx, y, PAL.stone[2 + ((xx + y) & 1)]);
    else {
      const wave = 2 + Math.floor((Math.sin(xx * 0.7) * 0.5 + 0.5) * 3);
      px(x, xx, y, PAL.shallow[Math.min(PAL.shallow.length - 1, wave)]);
    }
  }
  px(x, 12, 11, "#d0fff0");
  px(x, 20, 14, "#80e0c0");
  px(x, 16, 10, "#f0fff8");
  return scaleN(outline(c), 2);
}

export function portal(): HTMLCanvasElement {
  const { c, x } = canv(24, 40);
  shadow(x, 12, 38, 9, 3, 0.3);
  rect(x, 3, 12, 4, 24, "#3a3c40");
  rect(x, 17, 12, 4, 24, "#2a2c30");
  rect(x, 3, 10, 18, 4, "#4a4c50");
  rect(x, 4, 9, 16, 2, "#80e0d0");
  for (let y = 14; y < 34; y++) for (let xx = 8; xx < 16; xx++) {
    const a = 1 - Math.abs(xx - 12) / 5 - Math.abs(y - 24) / 14;
    if (a > 0) px(x, xx, y, mix("#1a2040", "#80e0d0", Math.max(0, a)), 0.9);
  }
  px(x, 12, 20, "#e8fff8");
  px(x, 7, 11, "#40c8a0"); px(x, 12, 10, "#e0f0a0"); px(x, 17, 11, "#40c8a0");
  return scaleN(outline(c), 2);
}

export function chest(): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  shadow(x, 8, 14, 6, 2, 0.25);
  rect(x, 2, 6, 12, 8, "#6a4820");
  rect(x, 2, 6, 12, 4, "#8a6430");
  rect(x, 2, 9, 12, 1, "#e0b040");
  rect(x, 7, 8, 2, 3, "#e0b040");
  px(x, 8, 9, "#f8e080");
  return scaleN(outline(c), 2);
}

export function node(kind: "herb" | "ore" | "wood"): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  shadow(x, 8, 14, 5, 2, 0.2);
  if (kind === "herb") {
    rect(x, 7, 8, 2, 6, "#285828");
    px(x, 6, 7, "#50a050"); px(x, 5, 6, "#80e070");
    px(x, 9, 6, "#80e070"); px(x, 10, 5, "#c0f090");
    px(x, 8, 4, "#50a050");
    px(x, 6, 5, "#e07090");
  } else if (kind === "ore") {
    for (let y = 6; y < 14; y++) for (let xx = 3; xx < 13; xx++) {
      if (Math.abs(xx - 8) / 5 + Math.abs(y - 10) / 4 < 1) px(x, xx, y, PAL.stone[1 + ((xx + y) % 3)]);
    }
    px(x, 6, 9, "#80c0e0"); px(x, 9, 10, "#c0f0ff"); px(x, 7, 11, "#c0a050");
  } else {
    rect(x, 7, 6, 3, 8, "#4a3020");
    rect(x, 7, 6, 2, 8, "#5a4030");
    canopy(x, 8, 6, 5, 4, "#184820", "#247830", "#38b048", 2);
  }
  return scaleN(outline(c), 2);
}

export function furnace(): HTMLCanvasElement {
  const { c, x } = canv(20, 28);
  shadow(x, 10, 26, 8, 3, 0.25);
  rect(x, 3, 10, 14, 14, "#4a4040");
  rect(x, 3, 10, 7, 14, "#5a5050");
  rect(x, 6, 16, 8, 6, "#201818");
  rect(x, 7, 17, 6, 4, "#e06020");
  rect(x, 9, 18, 3, 2, "#f0d060");
  px(x, 10, 17, "#fff0c0");
  rect(x, 5, 5, 10, 6, "#5a5050");
  rect(x, 8, 1, 4, 5, "#2a2828");
  px(x, 9, 0, "#6a6a70", 0.6);
  px(x, 11, 0, "#8a8a90", 0.4);
  return scaleN(outline(c), 2);
}

export function cauldron(): HTMLCanvasElement {
  const { c, x } = canv(20, 20);
  shadow(x, 10, 18, 7, 2, 0.25);
  disk(x, 10, 12, 7, 6, "#2a2a32");
  disk(x, 9, 11, 6, 5, "#3a3a44");
  disk(x, 10, 9, 5, 2, "#1a5040");
  px(x, 9, 8, "#80f0c0"); px(x, 11, 9, "#40c080");
  rect(x, 3, 10, 2, 8, "#6a4a28");
  rect(x, 15, 10, 2, 8, "#5a3c20");
  return scaleN(outline(c), 2);
}

export function stele(): HTMLCanvasElement {
  const { c, x } = canv(16, 32);
  shadow(x, 8, 30, 6, 2, 0.25);
  rect(x, 3, 6, 10, 22, "#4a5058");
  rect(x, 3, 6, 4, 22, "#5a6068");
  rect(x, 4, 8, 8, 5, "#7a9090");
  rect(x, 5, 15, 6, 8, "#2a3034");
  px(x, 7, 17, "#80e0c0");
  px(x, 8, 19, "#80e0c0");
  px(x, 7, 21, "#80e0c0");
  rect(x, 2, 4, 12, 3, "#6a7068");
  px(x, 8, 3, "#80c0a0");
  return scaleN(outline(c), 2);
}

export function stall(): HTMLCanvasElement {
  const { c, x } = canv(32, 28);
  shadow(x, 16, 26, 12, 3, 0.25);
  rect(x, 4, 14, 24, 10, "#6a4828");
  rect(x, 4, 14, 24, 3, "#7a5830");
  px(x, 8, 16, "#c04040"); px(x, 12, 16, "#e0d080"); px(x, 16, 17, "#50a070");
  px(x, 20, 16, "#8060c0"); px(x, 24, 17, "#d0a040");
  for (let y = 0; y < 10; y++) {
    const inset = Math.floor((9 - y) * 0.6);
    for (let xx = 2 + inset; xx < 30 - inset; xx++) px(x, xx, 2 + y, xx < 16 ? "#c03020" : "#8a1810");
  }
  rect(x, 5, 12, 2, 10, "#4a3018");
  rect(x, 25, 12, 2, 10, "#3a2410");
  return scaleN(outline(c), 2);
}

export function auctionHouse(): HTMLCanvasElement {
  const { c, x } = canv(80, 80);
  const cx = 40, base = 76;
  shadow(x, cx, base, 28, 5, 0.32);
  const wallW = 56, wallH = 30;
  const wallX = cx - (wallW >> 1), wallY = base - wallH;
  rect(x, wallX, wallY, wallW, wallH, "#4a4858");
  rect(x, wallX, wallY, 3, wallH, "#5a5868");
  rect(x, wallX + wallW - 3, wallY, 3, wallH, "#3a3848");
  rect(x, wallX, wallY + 2, wallW, 2, "#2a2838");
  // grand door
  rect(x, cx - 8, base - 20, 16, 20, "#101018");
  rect(x, cx - 7, base - 19, 6, 18, "#1a1a28");
  px(x, cx + 5, base - 10, "#e0c060");
  for (const wx of [-22, 16]) {
    rect(x, cx + wx, wallY + 8, 8, 8, "#101018");
    rect(x, cx + wx + 1, wallY + 9, 6, 6, "#80e0d0");
  }
  const roofTop = wallY - 24;
  const roofW = wallW + 10, roofX = wallX - 5, roofH = 28;
  for (let y = 0; y < roofH; y++) {
    const t = y / Math.max(1, roofH - 1);
    const inset = Math.floor((1 - t) * (roofW / 2 - 3));
    for (let xx = roofX + inset; xx < roofX + roofW - inset; xx++) {
      let col = xx < cx ? "#e0c060" : "#a08828";
      if (y < 2) col = "#f8e8a0";
      if (y > 2 && y % 4 === 0) col = shade(col, -16);
      px(x, xx, roofTop + y, col);
    }
  }
  px(x, cx, roofTop - 1, "#f8e8a0");
  px(x, cx, roofTop - 3, "#fff8d0");
  return scaleN(outline(c), 2);
}

export function lantern(): HTMLCanvasElement {
  const { c, x } = canv(12, 20);
  shadow(x, 6, 18, 3, 1, 0.2);
  rect(x, 5, 2, 2, 4, "#5a3c20");
  rect(x, 2, 6, 8, 8, "#e04820");
  rect(x, 3, 7, 6, 6, "#f07030");
  rect(x, 4, 8, 4, 4, "#f8d060");
  px(x, 5, 9, "#fff0c0");
  rect(x, 2, 6, 8, 1, "#e0b040");
  rect(x, 2, 13, 8, 1, "#e0b040");
  rect(x, 4, 14, 4, 3, "#5a3c20");
  return scaleN(outline(c), 2);
}

export function fence(dir: "h" | "v"): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  if (dir === "h") {
    shadow(x, 8, 14, 7, 2, 0.15);
    for (let i = 0; i < 3; i++) {
      const fx = 2 + i * 5;
      rect(x, fx, 6, 2, 8, i % 2 ? "#6a4a28" : "#5a3c20");
    }
    for (let xx = 1; xx < 15; xx++) {
      px(x, xx, 8, "#7a5a30");
      px(x, xx, 11, "#6a4a28");
    }
  } else {
    shadow(x, 8, 14, 3, 2, 0.15);
    rect(x, 7, 2, 2, 12, "#5a3c20");
    px(x, 6, 6, "#7a5a30"); px(x, 9, 6, "#7a5a30");
    px(x, 6, 10, "#6a4a28"); px(x, 9, 10, "#6a4a28");
  }
  return scaleN(outline(c), 2);
}

export function signpost(): HTMLCanvasElement {
  const { c, x } = canv(16, 24);
  shadow(x, 8, 22, 4, 2, 0.2);
  rect(x, 7, 8, 2, 14, "#6a4a28");
  rect(x, 2, 6, 12, 7, "#7a5a30");
  rect(x, 3, 7, 10, 5, "#e8dcb0");
  px(x, 5, 9, "#2a2010"); px(x, 7, 9, "#2a2010"); px(x, 9, 9, "#2a2010");
  return scaleN(outline(c), 2);
}

export function herbPlot(): HTMLCanvasElement {
  const { c, x } = canv(20, 16);
  shadow(x, 10, 14, 8, 2, 0.18);
  rect(x, 1, 6, 18, 8, "#5a3c20");
  rect(x, 2, 7, 16, 6, "#3a2a14");
  const cols = ["#50a050", "#80d070", "#c07090", "#80e0c0"];
  for (let i = 0; i < 6; i++) {
    const gx = 4 + (i % 3) * 5, gy = 9 + Math.floor(i / 3) * 3;
    px(x, gx, gy, "#2a6030");
    px(x, gx, gy - 1, cols[i % 4]);
    px(x, gx + 1, gy - 2, cols[(i + 1) % 4]);
  }
  return scaleN(outline(c), 2);
}

export function gate(): HTMLCanvasElement {
  const { c, x } = canv(48, 48);
  shadow(x, 24, 46, 16, 3, 0.28);
  rect(x, 4, 16, 6, 28, "#5a3c20");
  rect(x, 38, 16, 6, 28, "#4a3018");
  rect(x, 4, 14, 40, 5, "#6a4a28");
  // roof
  for (let y = 0; y < 14; y++) {
    const inset = Math.floor((13 - y) * 0.9);
    for (let xx = 2 + inset; xx < 46 - inset; xx++) px(x, xx, 2 + y, xx < 24 ? "#1c8860" : "#0c5a40");
  }
  px(x, 24, 1, "#80e0c0");
  rect(x, 16, 16, 16, 6, "#5a3010");
  rect(x, 17, 17, 14, 4, "#e0c060");
  rect(x, 6, 22, 3, 4, "#e04820"); px(x, 7, 23, "#f8d060");
  rect(x, 39, 22, 3, 4, "#e04820"); px(x, 40, 23, "#f8d060");
  return scaleN(outline(c), 2);
}

export function crate(): HTMLCanvasElement {
  const { c, x } = canv(14, 14);
  shadow(x, 7, 12, 5, 2, 0.2);
  rect(x, 2, 3, 10, 9, "#6a4a28");
  rect(x, 2, 3, 10, 3, "#7a5a30");
  rect(x, 2, 7, 10, 1, "#3a2410");
  return scaleN(outline(c), 2);
}

export function cart(): HTMLCanvasElement {
  const { c, x } = canv(24, 20);
  shadow(x, 12, 18, 8, 2, 0.22);
  rect(x, 3, 6, 16, 7, "#6a4a28");
  rect(x, 3, 6, 16, 2, "#7a5a30");
  disk(x, 6, 15, 3, 3, "#2a2a28");
  disk(x, 16, 15, 3, 3, "#2a2a28");
  px(x, 6, 15, "#7a7a70"); px(x, 16, 15, "#7a7a70");
  px(x, 8, 5, "#80c0e0"); px(x, 11, 4, "#6a6860"); px(x, 14, 5, "#c0a050");
  return scaleN(outline(c), 2);
}

export function support(): HTMLCanvasElement {
  const { c, x } = canv(24, 32);
  shadow(x, 12, 30, 8, 2, 0.18);
  rect(x, 3, 4, 3, 24, "#5a3c20");
  rect(x, 18, 4, 3, 24, "#4a3018");
  rect(x, 3, 4, 18, 3, "#6a4a28");
  rect(x, 3, 16, 18, 2, "#5a3c20");
  return scaleN(outline(c), 2);
}

export function oreVein(): HTMLCanvasElement {
  const { c, x } = canv(16, 18);
  shadow(x, 8, 16, 6, 2, 0.2);
  for (let y = 4; y < 16; y++) for (let xx = 2; xx < 14; xx++) {
    if (Math.abs(xx - 8) / 6 + Math.abs(y - 10) / 6 < 1) px(x, xx, y, PAL.stone[(xx + y) % 4]);
  }
  px(x, 6, 8, "#80c0e0"); px(x, 9, 10, "#c0f0ff"); px(x, 7, 12, "#80c0e0");
  px(x, 10, 7, "#c0a050");
  return scaleN(outline(c), 2);
}

export function torch(): HTMLCanvasElement {
  const { c, x } = canv(10, 18);
  shadow(x, 5, 16, 2, 1, 0.15);
  rect(x, 4, 7, 2, 9, "#6a4a28");
  rect(x, 3, 4, 4, 4, "#e06020");
  rect(x, 4, 3, 2, 3, "#f8d060");
  px(x, 5, 2, "#fff0c0");
  return scaleN(outline(c), 2);
}

export function dock(): HTMLCanvasElement {
  const { c, x } = canv(32, 20);
  shadow(x, 16, 18, 12, 2, 0.2);
  for (let i = 0; i < 8; i++) {
    rect(x, 2 + i * 4, 6 + (i % 2), 4, 10, i % 2 ? "#6a4a28" : "#5a3c20");
  }
  rect(x, 2, 6, 28, 2, "#7a5a30");
  return scaleN(outline(c), 2);
}

export function bridge(): HTMLCanvasElement {
  const { c, x } = canv(32, 16);
  for (let y = 4; y < 12; y++) for (let xx = 2; xx < 30; xx++) {
    px(x, xx, y, (xx + y) % 3 === 0 ? "#5a3c20" : "#6a4a28");
  }
  rect(x, 2, 3, 2, 10, "#5a3c20");
  rect(x, 28, 3, 2, 10, "#4a3018");
  // rails
  for (let xx = 2; xx < 30; xx++) {
    px(x, xx, 3, "#7a5a30");
    px(x, xx, 12, "#6a4a28");
  }
  return scaleN(outline(c), 2);
}

/** Title-screen village / route backdrop at 640×360, painted from the same tiles & props. */
export function paintTitleBackdrop(): HTMLCanvasElement {
  const W = 640, H = 360;
  const { c, x } = canv(W, H);
  // Sky
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const col = t < 0.45
      ? mix("#68b8e8", "#a8d8f0", t / 0.45)
      : mix("#a8d8f0", "#58c060", (t - 0.45) / 0.55);
    x.fillStyle = col;
    x.fillRect(0, y, W, 1);
  }
  // Distant tree line
  const pine = tree("pine");
  const leaf = tree("leaf");
  const cherry = tree("cherry");
  for (let i = 0; i < 18; i++) {
    const tx = -20 + i * 42 + ((i * 13) % 17);
    const ty = 70 + (i % 3) * 8;
    x.drawImage(i % 3 === 0 ? pine : leaf, tx, ty);
  }
  // Ground band
  const grassA = scaleN(paintTile("grass", 3), 2);
  const grassB = scaleN(paintTile("grass2", 11), 2);
  const pathT = scaleN(paintTile("path", 5), 2);
  const flower = scaleN(paintTile("flower", 7), 2);
  const cobble = scaleN(paintTile("cobble", 9), 2);
  for (let y = 140; y < H; y += 32) for (let xx = 0; xx < W; xx += 32) {
    const onPath = xx > 240 && xx < 400 && y > 180;
    const onYard = xx > 200 && xx < 460 && y > 200 && y < 320;
    const src = onPath ? pathT : onYard && ((xx + y) % 96 < 32) ? cobble : ((xx * 3 + y * 7) & 1) ? grassB : grassA;
    x.drawImage(src, xx, y);
    if (!onPath && !onYard && hash2(2, xx, y) > 0.82) x.drawImage(flower, xx, y);
  }
  // Path going south through the yard
  for (let y = 180; y < H; y += 32) {
    x.drawImage(pathT, 304, y);
    x.drawImage(pathT, 336, y);
  }
  // Props
  const hJade = house("jade");
  const hRed = house("red");
  const hGold = house("gold");
  const hElder = house("elder");
  const wellC = well();
  const gateC = gate();
  const fenceH = fence("h");
  const lanternC = lantern();
  // houses (origin visual at bottom of sprite)
  const stamp = (img: HTMLCanvasElement, wx: number, footY: number) => {
    x.drawImage(img, wx - img.width / 2, footY - img.height);
  };
  stamp(hElder, 200, 250);
  stamp(hJade, 440, 248);
  stamp(hRed, 140, 300);
  stamp(hGold, 500, 292);
  stamp(wellC, 320, 236);
  stamp(gateC, 336, 348);
  stamp(cherry, 250, 220);
  stamp(leaf, 400, 226);
  stamp(tree("willow"), 80, 310);
  stamp(pine, 580, 270);
  for (let i = 0; i < 6; i++) stamp(fenceH, 220 + i * 32, 318);
  stamp(lanternC, 250, 270);
  stamp(lanternC, 410, 270);
  stamp(bush(true), 280, 260);
  stamp(bush(false), 370, 258);
  // soft vignette so the title plaque stays readable
  x.fillStyle = "rgba(8,16,12,0.28)";
  x.fillRect(0, 0, W, 130);
  x.fillStyle = "rgba(8,16,12,0.18)";
  x.fillRect(0, 130, W, 40);
  return c;
}

export function addWorldArt(add: (key: string, canvas: HTMLCanvasElement) => void) {
  const tiles: TileKind[] = [
    "grass", "grass2", "dirt", "stone", "water", "sand", "path",
    "floor", "wood", "ash", "forbidden", "snow", "flower", "cliff",
    "cobble", "garden", "plank", "rail", "moss", "shallow",
  ];
  tiles.forEach((t, i) => {
    add("tile_" + t, scaleN(paintTile(t, 17 + i * 13), 2));
    add("tile_" + t + "_b", scaleN(paintTile(t, 91 + i * 17), 2));
    add("tile_" + t + "_c", scaleN(paintTile(t, 53 + i * 19), 2));
  });
  add("block_cliff", scaleN(paintBlock("cliff", 3), 2));
  add("block_stone", scaleN(paintBlock("stone", 5), 2));
  add("block_ash", scaleN(paintBlock("ash", 7), 2));
  add("block_mine", scaleN(paintBlock("mine", 9), 2));
  add("block_wood", scaleN(paintBlock("wood", 11), 2));
  add("block_ice", scaleN(paintBlock("ice", 13), 2));

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
  add("obj_fence_h", fence("h"));
  add("obj_fence_v", fence("v"));
  add("obj_fence_ne", fence("h"));
  add("obj_fence_nw", fence("v"));
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
  add("title_bg", paintTitleBackdrop());
}

export const TILE_KINDS = [
  "grass", "grass2", "dirt", "stone", "water", "sand", "path",
  "floor", "wood", "ash", "forbidden", "snow", "flower", "cliff",
  "cobble", "garden", "plank", "rail", "moss", "shallow",
] as const;
