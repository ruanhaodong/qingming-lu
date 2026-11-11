/** Crisp pixel helpers. No canvas path AA — every texel is plotted. */

export function canv(w: number, h: number): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  return { c, x };
}

export function px(x: CanvasRenderingContext2D, X: number, Y: number, c: string, a = 1) {
  if (X < 0 || Y < 0 || X >= x.canvas.width || Y >= x.canvas.height) return;
  x.globalAlpha = a;
  x.fillStyle = c;
  x.fillRect(X | 0, Y | 0, 1, 1);
  x.globalAlpha = 1;
}

export function rect(x: CanvasRenderingContext2D, X: number, Y: number, w: number, h: number, c: string, a = 1) {
  x.globalAlpha = a;
  x.fillStyle = c;
  x.fillRect(X | 0, Y | 0, w, h);
  x.globalAlpha = 1;
}

export function hex(n: number): string {
  return "#" + (n >>> 0).toString(16).padStart(6, "0");
}

export function shade(col: string, amt: number): string {
  const n = parseInt(col.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

export function mix(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
  const m = (ca: number, cb: number) => Math.round(ca + (cb - ca) * t);
  const r = m((na >> 16) & 255, (nb >> 16) & 255);
  const g = m((na >> 8) & 255, (nb >> 8) & 255);
  const bl = m(na & 255, nb & 255);
  return "#" + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0");
}

export function hash2(seed: number, x: number, y: number): number {
  const t = Math.sin(seed * 12.9898 + x * 78.233 + y * 37.719) * 43758.5453;
  return t - Math.floor(t);
}

/** Nearest-neighbor integer upscale (display tiles are 2× of 16px art). */
export function scaleN(src: HTMLCanvasElement, n = 2): HTMLCanvasElement {
  const { c, x } = canv(src.width * n, src.height * n);
  x.imageSmoothingEnabled = false;
  x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/** 1px dark outline around opaque pixels. Leave a 1px margin in the source. */
export function outline(src: HTMLCanvasElement, col = "#181818"): HTMLCanvasElement {
  const w = src.width, h = src.height;
  const { c, x } = canv(w, h);
  const data = src.getContext("2d")!.getImageData(0, 0, w, h).data;
  const aAt = (X: number, Y: number) => {
    if (X < 0 || Y < 0 || X >= w || Y >= h) return 0;
    return data[(Y * w + X) * 4 + 3];
  };
  x.fillStyle = col;
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
    if (aAt(X, Y) >= 12) continue;
    if (aAt(X - 1, Y) > 12 || aAt(X + 1, Y) > 12 || aAt(X, Y - 1) > 12 || aAt(X, Y + 1) > 12) {
      x.fillRect(X, Y, 1, 1);
    }
  }
  x.drawImage(src, 0, 0);
  return c;
}

export function disk(x: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, col: string, a = 1) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx++) {
      const u = (xx - cx) / rx, v = (y - cy) / ry;
      if (u * u + v * v <= 1.02) px(x, xx, y, col, a);
    }
  }
}

/** Inclusive diamond test in pixel space. Kept for any leftover callers. */
export function inDiamond(pxX: number, py: number, cx: number, cy: number, hw: number, hh: number): boolean {
  return Math.abs(pxX - cx) / hw + Math.abs(py - cy) / hh <= 1.001;
}

export function fillDiamond(
  x: CanvasRenderingContext2D,
  cx: number, cy: number, hw: number, hh: number,
  color: (dx: number, dy: number, u: number, v: number) => string | undefined,
) {
  const x0 = Math.floor(cx - hw), x1 = Math.ceil(cx + hw);
  const y0 = Math.floor(cy - hh), y1 = Math.ceil(cy + hh);
  for (let py = y0; py <= y1; py++) for (let pxX = x0; pxX <= x1; pxX++) {
    const u = (pxX - cx) / hw, v = (py - cy) / hh;
    if (Math.abs(u) + Math.abs(v) > 1.001) continue;
    const c = color(pxX, py, u, v);
    if (c) px(x, pxX, py, c);
  }
}

/** GBA-like overworld palettes: clean, saturated, limited dither. Original, not ripped. */
export const PAL = {
  grass: ["#0c4810", "#186818", "#209020", "#28a828", "#38c038", "#58d050"],
  grassLit: ["#186818", "#28a020", "#40c040", "#70d860", "#a0e880"],
  dirt: ["#5a3818", "#7a5020", "#9a6830", "#b88040", "#d09850", "#e0b068"],
  path: ["#8a6a30", "#a88840", "#c8a050", "#d8b460", "#e8c878", "#f0d890"],
  cobble: ["#6a6860", "#848078", "#9c9890", "#b4b0a8", "#c8c4bc", "#dcd8d0"],
  stone: ["#303438", "#484c50", "#606468", "#787c80", "#94989c", "#b0b4b8"],
  water: ["#104878", "#1868a8", "#2088d0", "#38a0e8", "#58b8f0", "#90d4f8"],
  shallow: ["#186868", "#208888", "#30a8a0", "#48c8b8", "#78e0d0"],
  sand: ["#a88040", "#c09850", "#d8b060", "#e8c878", "#f0d890"],
  floor: ["#3a3028", "#4a4034", "#5a5040", "#6a6050", "#7a7060"],
  plank: ["#4a3018", "#5a3c20", "#6a4828", "#7a5430", "#8a6440"],
  ash: ["#202028", "#303038", "#44444c", "#585860", "#707078"],
  snow: ["#608090", "#88a8b0", "#b0c8d0", "#d0e4e8", "#f0f8f8"],
  garden: ["#184818", "#206020", "#287028", "#389038", "#50b040"],
  rail: ["#3a3428", "#4a4434", "#5a5444"],
  moss: ["#0c3810", "#145018", "#1c6820", "#288828", "#40a838"],
  bank: ["#5a4020", "#7a5830", "#3a8020", "#186018"],
};

export type TileKind =
  | "grass" | "grass2" | "dirt" | "stone" | "water" | "sand" | "path"
  | "floor" | "wood" | "ash" | "forbidden" | "snow" | "flower" | "cliff"
  | "cobble" | "garden" | "plank" | "rail" | "moss" | "shallow";
