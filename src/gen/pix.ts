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

/** Inclusive diamond test in pixel space. */
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

/** 2:1 iso block: top diamond plus left/right faces of `rise` pixels. */
export function isoBlock(
  x: CanvasRenderingContext2D,
  cx: number, topY: number, hw: number, hh: number, rise: number,
  top: string[], left: string[], right: string[],
  seed = 1,
) {
  // faces first (behind), then top
  for (let i = 0; i < rise; i++) {
    // left face: from left-point to bottom-point, dropped i
    for (let t = 0; t <= hw; t++) {
      const u = t / hw;
      const fx = cx - hw + t;
      const fy = topY + hh * (t / hw) + i;
      const col = left[Math.min(left.length - 1, Math.floor(hash2(seed, fx, fy) * left.length))];
      const lit = i === 0 ? shade(col, 16) : i === rise - 1 ? shade(col, -20) : col;
      px(x, fx, fy, lit);
      if (t < hw && i < rise - 1) px(x, fx, fy + 1, lit);
    }
    for (let t = 0; t <= hw; t++) {
      const fx = cx + t;
      const fy = topY + hh * (1 - t / hw) + i; // wait, right face from top? 
      // right face: from right-point (cx+hw, topY) to bottom (cx, topY+hh)
      const rx = cx + hw - t;
      const ry = topY + hh * (t / hw) + i;
      const col = right[Math.min(right.length - 1, Math.floor(hash2(seed + 3, rx, ry) * right.length))];
      const lit = i === 0 ? shade(col, 8) : i === rise - 1 ? shade(col, -24) : col;
      px(x, rx, ry, lit);
    }
  }
  fillDiamond(x, cx, topY, hw, hh, (dx, dy, u, v) => {
    const edge = Math.abs(u) + Math.abs(v) > 0.88;
    const n = hash2(seed, dx, dy);
    const hi = v < 0 && u < 0;
    const pal = top;
    let idx = Math.floor(n * pal.length);
    if (hi) idx = Math.min(pal.length - 1, idx + 1);
    if (edge) idx = Math.max(0, idx - 1);
    return pal[idx];
  });
  // ridge highlight on top-left edge
  for (let t = 0; t <= hw; t++) {
    const fx = cx - hw + t;
    const fy = topY - hh + Math.round((hh / hw) * t);
    px(x, fx, fy, shade(top[top.length - 1], 10), 0.7);
  }
}

export const PAL = {
  grass: ["#0a1610", "#102018", "#163024", "#1c3c2a", "#245436", "#2e6a42", "#3c8050"],
  grassLit: ["#143022", "#1c4030", "#285838", "#347848", "#4a985c"],
  dirt: ["#1a1410", "#241c14", "#322418", "#403020", "#52402c", "#6a5440"],
  path: ["#2a2018", "#3a2c1e", "#4a3a28", "#5a4a34", "#6c5a40", "#7a6a4c"],
  cobble: ["#1c1c18", "#2a2a26", "#3a3a34", "#4c4c44", "#5e5e54", "#6a6a60"],
  stone: ["#141618", "#1e2226", "#2c3236", "#3c4448", "#50585c", "#646c70"],
  water: ["#061018", "#0a1a24", "#0e2834", "#143848", "#1a4c60", "#246880", "#3a88a0"],
  shallow: ["#0a2428", "#12383c", "#1a5050", "#247068", "#38a090"],
  sand: ["#2a2418", "#3c3420", "#524830", "#6a5c40", "#847456", "#9a8868"],
  floor: ["#161210", "#221c18", "#2e2620", "#3a3228", "#4a4236"],
  plank: ["#1a120c", "#261a12", "#342418", "#443022", "#543c28", "#644830"],
  ash: ["#101014", "#1a1a20", "#282830", "#383840", "#4a4a54"],
  snow: ["#243038", "#3a4a50", "#5a6c70", "#8aa0a4", "#c8d8dc"],
  garden: ["#142418", "#1c3020", "#284020", "#1a3828", "#3a5828"],
  rail: ["#1a1612", "#2a241c", "#3a3428"],
  moss: ["#0c1c14", "#14281c", "#1c3828", "#284c34", "#186030"],
};

export type TileKind =
  | "grass" | "grass2" | "dirt" | "stone" | "water" | "sand" | "path"
  | "floor" | "wood" | "ash" | "forbidden" | "snow" | "flower" | "cliff"
  | "cobble" | "garden" | "plank" | "rail" | "moss" | "shallow";
