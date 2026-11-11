import { TILE_H, TILE_W } from "../types";

export const TW = TILE_W;
export const TH = TILE_H;

/** Orthogonal world position of a tile coordinate (tile center). Name kept to limit churn. */
export function iso(tx: number, ty: number): { x: number; y: number } {
  return {
    x: tx * TW + TW / 2,
    y: ty * TH + TH / 2,
  };
}

export const toWorld = iso;

/** Bottom-center of a tile, for tall sprites with origin (0.5, 1). */
export function foot(tx: number, ty: number): { x: number; y: number } {
  const p = iso(tx, ty);
  return { x: p.x, y: p.y + TH / 2 };
}

export function worldToTile(x: number, y: number): { tx: number; ty: number } {
  return {
    tx: x / TW - 0.5,
    ty: y / TH - 0.5,
  };
}

/** Sort by tile row (and optional bias) so southern sprites draw over northern ones. */
export function depthOf(tx: number, ty: number, bias = 0): number {
  return ty * TH + bias;
}

export function mapBounds(w: number, h: number) {
  // Extra slack so tall trees / roofs near the north edge stay on-camera.
  return {
    x: -TW * 2,
    y: -TH * 6,
    w: w * TW + TW * 4,
    h: h * TH + TH * 8,
  };
}
