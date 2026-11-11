import { TILE_H, TILE_W } from "../types";

export const TW = TILE_W;
export const TH = TILE_H;

export function iso(tx: number, ty: number): { x: number; y: number } {
  return {
    x: (tx - ty) * (TW / 2),
    y: (tx + ty) * (TH / 2),
  };
}

export function worldToTile(x: number, y: number): { tx: number; ty: number } {
  return {
    tx: x / TW + y / TH,
    ty: y / TH - x / TW,
  };
}

export function depthOf(tx: number, ty: number, bias = 0): number {
  return (tx + ty) * 16 + bias;
}

export function mapBounds(w: number, h: number) {
  const min = iso(0, h - 1);
  const max = iso(w - 1, 0);
  const bottom = iso(w - 1, h - 1);
  return {
    x: min.x - TW,
    y: -TH,
    w: max.x - min.x + TW * 2,
    h: bottom.y + TH * 8,
  };
}
