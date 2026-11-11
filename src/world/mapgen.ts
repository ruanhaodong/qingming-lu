import { ENEMY_MAP, NPCS, REGION_MAP } from "../data";
import { Rng } from "../rng";
import type { NpcDef } from "../types";

export type Ground =
  | "grass" | "grass2" | "dirt" | "stone" | "water" | "sand" | "path"
  | "floor" | "wood" | "ash" | "forbidden" | "snow" | "flower" | "cliff"
  | "cobble" | "garden" | "plank" | "rail" | "moss" | "shallow";

export interface Cell {
  g: Ground;
  block: boolean;
  decal?: string;
}

export interface Prop {
  key: string;
  tx: number;
  ty: number;
  block?: boolean;
  kind?: string;
  id?: string;
  depthBias?: number;
}

export interface Spawn {
  kind: "enemy" | "npc" | "gather" | "portal" | "chest" | "pool" | "station" | "stele" | "boss" | "chamber";
  id: string;
  tx: number;
  ty: number;
  extra?: string;
}

export interface GameMap {
  id: string;
  w: number;
  h: number;
  cells: Cell[];
  props: Prop[];
  spawns: Spawn[];
  rooms?: { x: number; y: number; w: number; h: number; tag?: string }[];
}

export function cellAt(m: GameMap, x: number, y: number): Cell | undefined {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return undefined;
  return m.cells[y * m.w + x];
}

export function walkable(m: GameMap, x: number, y: number): boolean {
  const c = cellAt(m, Math.floor(x), Math.floor(y));
  if (!c || c.block) return false;
  return true;
}

function n2(rngSeed: number, x: number, y: number): number {
  const r = new Rng((rngSeed ^ Math.imul(x + 13, 374761393) ^ Math.imul(y + 7, 668265263)) >>> 0);
  return r.next();
}

export function generateMap(regionId: string): GameMap {
  const def = REGION_MAP[regionId];
  if (!def) throw new Error("no region " + regionId);
  if (def.biome === "dungeon") return generateDungeon(regionId);
  return generateOverworld(regionId);
}

function baseGround(biome: string): Ground {
  if (biome === "coast") return "sand";
  if (biome === "ruins") return "stone";
  if (biome === "forbidden") return "ash";
  if (biome === "mountain") return "grass2";
  return "grass";
}

function generateOverworld(regionId: string): GameMap {
  const def = REGION_MAP[regionId];
  const w = def.size, h = def.size;
  const rng = new Rng(def.mapSeed);
  const m: GameMap = { id: regionId, w, h, cells: [], props: [], spawns: [] };
  const bg = baseGround(def.biome);

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = n2(def.mapSeed, x, y);
    const n2v = n2(def.mapSeed + 99, x * 2, y * 2);
    let g: Ground = bg;
    let block = false;
    if (def.biome === "village" || def.biome === "mountain") {
      if (n < 0.04) g = "flower";
      else if (n < 0.1) g = "dirt";
      else if (n2v < 0.1) g = "grass2";
      else if (n < 0.16 && def.biome === "mountain") g = "moss";
      else g = n < 0.55 ? "grass" : "grass2";
    } else if (def.biome === "coast") {
      const shore = (x / w) * 0.4 + n * 0.3;
      if (y > h * (0.66 + shore * 0.12)) { g = "water"; block = true; }
      else if (y > h * (0.6 + shore * 0.08)) { g = "shallow"; block = true; }
      else if (y > h * 0.5) g = "sand";
      else g = n < 0.18 ? "path" : n < 0.3 ? "dirt" : "grass";
    } else if (def.biome === "ruins") {
      g = n < 0.12 ? "ash" : n < 0.35 ? "cobble" : n < 0.6 ? "stone" : "dirt";
      if (n < 0.04) { g = "cliff"; block = true; }
    } else if (def.biome === "forbidden") {
      g = n < 0.08 ? "cliff" : n < 0.28 ? "stone" : n < 0.4 ? "moss" : "ash";
      if (g === "cliff") block = true;
      if (n2v < 0.05) { g = "shallow"; block = true; }
    }
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
      if (def.biome !== "coast" || y !== h - 1) {
        g = "cliff";
        block = true;
      }
    }
    m.cells.push({ g, block });
  }

  const path = (x0: number, y0: number, x1: number, y1: number, g: Ground = "path", width = 1) => {
    let x = x0, y = y0;
    const steps = Math.abs(x1 - x0) + Math.abs(y1 - y0) + 10;
    for (let i = 0; i < steps; i++) {
      for (let oy = 0; oy < width; oy++) {
        const c = cellAt(m, x, y + oy);
        if (c && c.g !== "water" && c.g !== "cliff" && c.g !== "shallow") {
          c.g = g;
          c.block = false;
        }
      }
      if (x === x1 && y === y1) break;
      if (Math.abs(x1 - x) > Math.abs(y1 - y)) x += Math.sign(x1 - x);
      else y += Math.sign(y1 - y);
      if (rng.chance(0.18)) {
        if (rng.chance(0.5)) x += rng.chance(0.5) ? 1 : -1;
        else y += rng.chance(0.5) ? 1 : -1;
        x = Math.max(1, Math.min(w - 2, x));
        y = Math.max(1, Math.min(h - 2, y));
      }
    }
  };

  if (regionId === "qingming_outskirts") {
    paintStream(m, 6, 4, 7, 40);
    paintVillage(m, rng);
    path(14, 24, 14, 40);
    path(14, 16, 28, 16);
    path(18, 16, 38, 10);
    path(15, 16, 16, 8);
    path(14, 22, 32, 32);
    path(8, 22, 8, 36);
    placeClearing(m, 16, 8, 3, "flower");
    ringStone(m, 16, 8, 3);
    m.props.push({ key: "obj_pool", tx: 16, ty: 8, block: true, kind: "pool" });
    m.spawns.push({ kind: "pool", id: "lingchi", tx: 16, ty: 8 });
    m.props.push({ key: "obj_lantern", tx: 15, ty: 9, block: false, kind: "decor" });
    m.props.push({ key: "obj_lantern", tx: 17, ty: 9, block: false, kind: "decor" });
    placeClearing(m, 24, 11, 2, "stone");
    m.props.push({ key: "obj_stele", tx: 24, ty: 11, block: true, kind: "chamber", id: "qingquan_chamber" });
    m.spawns.push({ kind: "chamber", id: "qingquan_chamber", tx: 24, ty: 11, extra: "废弃青泉石室" });
    m.props.push({ key: "obj_dead", tx: 23, ty: 10, block: true, kind: "decor" });
    m.props.push({ key: "obj_rock", tx: 25, ty: 12, block: true, kind: "decor" });
    placeClearing(m, 38, 10, 2, "dirt");
    m.props.push({ key: "obj_portal", tx: 38, ty: 10, block: true, kind: "portal" });
    m.spawns.push({ kind: "portal", id: "dungeon_mine", tx: 38, ty: 10, extra: "青石矿洞" });
    m.props.push({ key: "obj_sign", tx: 37, ty: 11, block: true, kind: "decor" });
    m.props.push({ key: "obj_lantern", tx: 36, ty: 10, block: false, kind: "decor" });
    m.props.push({ key: "obj_torch", tx: 39, ty: 11, block: false, kind: "decor" });
    m.props.push({ key: "obj_stele", tx: 18, ty: 16, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "worldmap", tx: 18, ty: 16 });
    m.props.push({ key: "obj_stele", tx: 40, ty: 22, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "travel:cangyun_ridge", tx: 40, ty: 22, extra: "苍云岭方向" });
    m.props.push({ key: "obj_stele", tx: 8, ty: 36, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "travel:wanghai_market", tx: 8, ty: 36, extra: "望海坊方向" });
    // layered woods: cherries near stream, willows by water, pines toward the ridge, leaf trees elsewhere
    sprinkle(m, rng, ["obj_willow"], 10, (x, y) => x < 12 && y > 8);
    sprinkle(m, rng, ["obj_cherry"], 12, (x, y) => x > 6 && x < 24 && y > 20 && y < 36);
    sprinkle(m, rng, ["obj_pine"], 18, (x, y) => x > 28 && y < 20);
    sprinkle(m, rng, ["obj_bamboo"], 8, (x, y) => x > 20 && x < 32 && y > 24 && y < 36);
    sprinkle(m, rng, ["obj_tree", "obj_bush", "obj_bush_flower", "obj_rock"], 55, (x, y) => !inVillageCore(x, y));
  } else if (regionId === "cangyun_ridge") {
    path(4, 26, w - 5, 22, "path", 1);
    path(26, 4, 24, h - 5, "dirt", 1);
    placeClearing(m, 26, 24, 4, "moss");
    m.props.push({ key: "obj_stele", tx: 8, ty: 26, block: true });
    m.spawns.push({ kind: "stele", id: "travel:qingming_outskirts", tx: 8, ty: 26, extra: "青冥村方向" });
    m.spawns.push({ kind: "stele", id: "travel:canzhao_realm", tx: w - 6, ty: 22, extra: "残照秘境" });
    m.spawns.push({ kind: "stele", id: "travel:youming_forbidden", tx: 24, ty: 6, extra: "禁地方向" });
    m.props.push({ key: "obj_stele", tx: w - 6, ty: 22, block: true });
    m.props.push({ key: "obj_stele", tx: 24, ty: 6, block: true });
    m.props.push({ key: "obj_lantern", tx: 9, ty: 25, block: false, kind: "decor" });
    m.props.push({ key: "obj_sign", tx: 7, ty: 27, block: true, kind: "decor" });
    placeClearing(m, 30, 32, 4, "dirt");
    ringStone(m, 30, 32, 3);
    m.spawns.push({ kind: "boss", id: "boss_cangran", tx: 30, ty: 32 });
    m.props.push({ key: "obj_rock", tx: 28, ty: 30, block: true, kind: "decor" });
    m.props.push({ key: "obj_rock", tx: 32, ty: 33, block: true, kind: "decor" });
    sprinkle(m, rng, ["obj_pine", "obj_pine", "obj_tree", "obj_rock", "obj_bush"], 120);
  } else if (regionId === "canzhao_realm") {
    path(6, 24, w - 6, 24, "cobble", 1);
    placeClearing(m, 24, 24, 5, "ash");
    m.props.push({ key: "obj_portal", tx: 24, ty: 18, block: true, kind: "portal" });
    m.spawns.push({ kind: "portal", id: "dungeon_canzhao", tx: 24, ty: 18, extra: "残照地宫" });
    m.spawns.push({ kind: "stele", id: "travel:cangyun_ridge", tx: 6, ty: 24, extra: "苍云岭" });
    m.spawns.push({ kind: "stele", id: "travel:wanghai_market", tx: w - 6, ty: 24, extra: "望海坊" });
    m.props.push({ key: "obj_stele", tx: 6, ty: 24, block: true });
    m.props.push({ key: "obj_stele", tx: w - 6, ty: 24, block: true });
    m.props.push({ key: "obj_dead", tx: 22, ty: 22, block: true, kind: "decor" });
    m.props.push({ key: "obj_dead", tx: 27, ty: 26, block: true, kind: "decor" });
    m.props.push({ key: "obj_lantern", tx: 23, ty: 19, block: false, kind: "decor" });
    sprinkle(m, rng, ["obj_rock", "obj_dead", "obj_stele", "obj_pine"], 80);
  } else if (regionId === "wanghai_market") {
    paintTown(m, rng);
    path(4, 20, w - 4, 20, "cobble", 2);
    path(22, 14, 22, 28, "cobble", 1);
    m.props.push({ key: "obj_auction", tx: 22, ty: 18, block: true, kind: "auction" });
    m.spawns.push({ kind: "station", id: "auction", tx: 22, ty: 18 });
    m.spawns.push({ kind: "stele", id: "travel:qingming_outskirts", tx: 6, ty: 18, extra: "青冥村" });
    m.spawns.push({ kind: "stele", id: "travel:canzhao_realm", tx: w - 7, ty: 16, extra: "残照秘境" });
    m.props.push({ key: "obj_stele", tx: 6, ty: 18, block: true });
    m.props.push({ key: "obj_stele", tx: w - 7, ty: 16, block: true });
    m.props.push({ key: "obj_stele", tx: 16, ty: 14, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "worldmap", tx: 16, ty: 14 });
    // docks along the shore
    for (let i = 0; i < 5; i++) {
      const tx = 10 + i * 6, ty = Math.min(h - 4, Math.floor(h * 0.56) + (i % 2));
      const c = cellAt(m, tx, ty);
      if (c && (c.g === "sand" || c.g === "path" || c.g === "cobble")) {
        m.props.push({ key: "obj_dock", tx, ty, block: false, kind: "decor" });
      }
    }
    sprinkle(m, rng, ["obj_bush", "obj_stall", "obj_lantern", "obj_tree"], 36, (x, y) => y < h * 0.52 && !inTownCore(x, y));
  } else if (regionId === "youming_forbidden") {
    path(26, h - 6, 26, 10, "ash", 1);
    placeClearing(m, 26, 16, 5, "stone");
    m.spawns.push({ kind: "boss", id: "boss_moyuan", tx: 26, ty: 14 });
    m.props.push({ key: "obj_stele", tx: 22, ty: 12, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "trib_altar", tx: 22, ty: 12, extra: "劫云台" });
    m.spawns.push({ kind: "stele", id: "travel:cangyun_ridge", tx: 26, ty: h - 6, extra: "苍云岭" });
    m.props.push({ key: "obj_stele", tx: 26, ty: h - 6, block: true });
    m.props.push({ key: "obj_dead", tx: 24, ty: 15, block: true, kind: "decor" });
    m.props.push({ key: "obj_dead", tx: 28, ty: 17, block: true, kind: "decor" });
    m.props.push({ key: "obj_rock", tx: 20, ty: 14, block: true, kind: "decor" });
    sprinkle(m, rng, ["obj_rock", "obj_dead", "obj_pine", "obj_stele"], 90);
  }

  const npcs = NPCS.filter((n) => n.region === regionId);
  placeNpcs(m, rng, npcs);

  const gathers = def.gather;
  for (let i = 0; i < 18; i++) {
    const tx = rng.int(3, w - 4), ty = rng.int(3, h - 4);
    const c = cellAt(m, tx, ty);
    if (!c || c.block || c.g === "path" || c.g === "wood" || c.g === "floor" || c.g === "cobble" || c.g === "plank" || c.g === "rail") continue;
    if (regionId === "qingming_outskirts" && inVillageCore(tx, ty)) continue;
    const id = gathers[i % gathers.length];
    const key = id.includes("ore") ? "obj_ore" : id.includes("wood") ? "obj_wood" : "obj_herb";
    m.props.push({ key, tx, ty, block: false, kind: "gather", id });
    m.spawns.push({ kind: "gather", id, tx, ty });
  }

  const table = def.spawnTable.filter((id) => ENEMY_MAP[id]);
  const packs = 12 + def.danger * 3;
  for (let i = 0; i < packs; i++) {
    const tx = rng.int(4, w - 5), ty = rng.int(4, h - 5);
    const c = cellAt(m, tx, ty);
    if (!c || c.block) continue;
    if (nearVillage(m, tx, ty, regionId)) continue;
    const id = table[rng.int(0, table.length - 1)];
    m.spawns.push({ kind: "enemy", id, tx, ty });
  }

  return m;
}

function inVillageCore(x: number, y: number) {
  return x >= 9 && x <= 22 && y >= 12 && y <= 24;
}
function inTownCore(x: number, y: number) {
  return x > 10 && x < 32 && y > 14 && y < 30;
}

function nearVillage(_m: GameMap, x: number, y: number, region: string) {
  if (region === "qingming_outskirts") return inVillageCore(x, y);
  if (region === "wanghai_market") return inTownCore(x, y);
  return false;
}

function placeClearing(m: GameMap, cx: number, cy: number, r: number, g: Ground) {
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const c = cellAt(m, x, y);
    if (!c) continue;
    if (Math.abs(x - cx) + Math.abs(y - cy) <= r + 1 && c.g !== "cliff") {
      c.g = g;
      c.block = false;
    }
  }
}

function ringStone(m: GameMap, cx: number, cy: number, r: number) {
  for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r], [-r + 1, -r + 1], [r - 1, r - 1]]) {
    const c = cellAt(m, cx + dx, cy + dy);
    if (c && c.g !== "water" && c.g !== "cliff") c.g = "stone";
  }
}

function paintStream(m: GameMap, x0: number, y0: number, x1: number, y1: number) {
  let x = x0, y = y0;
  for (let i = 0; i < 80; i++) {
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0]]) {
      const c = cellAt(m, x + dx, y + dy);
      if (!c || c.g === "cliff") continue;
      const edge = Math.abs(dx) + Math.abs(dy) === 1 && (dx + dy + i) % 3 === 0;
      c.g = edge ? "shallow" : "water";
      c.block = true;
    }
    // flower / grass banks
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, 1], [2, -1]]) {
      const c = cellAt(m, x + dx, y + dy);
      if (c && !c.block && c.g !== "cliff" && c.g !== "water") c.g = i % 2 ? "flower" : "grass";
    }
    if (x === x1 && y === y1) break;
    if (Math.abs(x1 - x) > Math.abs(y1 - y)) x += Math.sign(x1 - x);
    else y += Math.sign(y1 - y);
    if (i % 5 === 2) x = Math.max(2, Math.min(m.w - 3, x + (i % 2 ? 1 : -1)));
  }
  // a short bridge where the south road would cross
  const bx = 8, by = 22;
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const c = cellAt(m, bx + dx, by + dy);
    if (c) { c.g = "plank"; c.block = false; }
  }
  // prop placed later in village? add here
}

function blockHouse(m: GameMap, x: number, y: number, big = false) {
  const r = big ? 2 : 1;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const c = cellAt(m, x + dx, y + dy);
    if (c) c.block = true;
  }
  const feet = cellAt(m, x, y + 1);
  if (feet) feet.block = false;
  const feet2 = cellAt(m, x + 1, y + 1);
  if (feet2 && big) feet2.block = false;
}

function paintVillage(m: GameMap, _rng: Rng) {
  // cobble square around the well (keep 15,18 walkable for 青松 / spawn)
  for (let y = 15; y <= 20; y++) for (let x = 13; x <= 19; x++) {
    const c = cellAt(m, x, y);
    if (!c) continue;
    c.g = "cobble";
    c.block = false;
  }
  // dirt yards around houses, not a solid path slab
  const yards: [number, number, number, number][] = [
    [10, 14, 13, 17],
    [15, 13, 18, 15],
    [10, 18, 13, 21],
    [18, 18, 21, 21],
    [18, 14, 21, 17],
  ];
  for (const [x0, y0, x1, y1] of yards) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = cellAt(m, x, y);
      if (c && c.g !== "cobble" && c.g !== "water") { c.g = "dirt"; c.block = false; }
    }
  }
  // herb garden west of the square
  for (let y = 15; y <= 19; y++) for (let x = 9; x <= 11; x++) {
    const c = cellAt(m, x, y);
    if (c) { c.g = "garden"; c.block = false; }
  }
  m.props.push({ key: "obj_plot", tx: 10, ty: 16, block: false, kind: "decor" });
  m.props.push({ key: "obj_plot", tx: 10, ty: 18, block: false, kind: "decor" });
  m.props.push({ key: "obj_fence_v", tx: 9, ty: 15, block: true, kind: "decor" });
  m.props.push({ key: "obj_fence_v", tx: 9, ty: 17, block: true, kind: "decor" });
  m.props.push({ key: "obj_fence_v", tx: 9, ty: 19, block: true, kind: "decor" });
  m.props.push({ key: "obj_fence_h", tx: 10, ty: 15, block: true, kind: "decor" });
  m.props.push({ key: "obj_fence_h", tx: 11, ty: 19, block: true, kind: "decor" });

  const houses: [number, number, string, boolean][] = [
    [11, 15, "obj_house", false],
    [16, 14, "obj_house_elder", true],
    [13, 20, "obj_house", false],
    [19, 19, "obj_house_shop", false],
    [11, 19, "obj_house_red", false],
    [20, 15, "obj_house_gold", false],
  ];
  for (const [x, y, k, big] of houses) {
    m.props.push({ key: k, tx: x, ty: y, block: true, kind: "house" });
    blockHouse(m, x, y, big);
  }

  m.props.push({ key: "obj_well", tx: 15, ty: 17, block: true });
  const well = cellAt(m, 15, 17); if (well) well.block = true;
  m.props.push({ key: "obj_cauldron", tx: 17, ty: 16, block: true, kind: "station", id: "cauldron" });
  m.props.push({ key: "obj_furnace", tx: 12, ty: 17, block: true, kind: "station", id: "furnace" });
  m.props.push({ key: "obj_stall", tx: 18, ty: 18, block: true, kind: "stall" });
  m.spawns.push({ kind: "station", id: "cauldron", tx: 17, ty: 16 });
  m.spawns.push({ kind: "station", id: "furnace", tx: 12, ty: 17 });

  // south gate — keep the center tiles walkable so the road still passes through
  m.props.push({ key: "obj_gate", tx: 14, ty: 23, block: false, kind: "decor" });
  for (const [gx, gy] of [[13, 23], [15, 23]] as const) {
    const c = cellAt(m, gx, gy);
    if (c) c.block = true;
  }
  for (const [gx, gy] of [[14, 22], [14, 23], [14, 24]] as const) {
    const c = cellAt(m, gx, gy);
    if (c) { c.g = "path"; c.block = false; }
  }

  // lanterns along the square and road
  for (const [lx, ly] of [[13, 16], [19, 16], [13, 20], [19, 20], [14, 22], [16, 22], [18, 17]]) {
    m.props.push({ key: "obj_lantern", tx: lx, ty: ly, block: false, kind: "decor" });
  }
  // fences along the south edge of the village
  for (let x = 10; x <= 13; x++) m.props.push({ key: "obj_fence_h", tx: x, ty: 22, block: true, kind: "decor" });
  for (let x = 16; x <= 20; x++) m.props.push({ key: "obj_fence_h", tx: x, ty: 22, block: true, kind: "decor" });
  // yard trees
  m.props.push({ key: "obj_cherry", tx: 12, ty: 13, block: true, kind: "decor" });
  m.props.push({ key: "obj_tree", tx: 21, ty: 20, block: true, kind: "decor" });
  m.props.push({ key: "obj_bush_flower", tx: 16, ty: 19, block: false, kind: "decor" });
  m.props.push({ key: "obj_bush", tx: 14, ty: 15, block: false, kind: "decor" });
  // stream bridge prop
  m.props.push({ key: "obj_bridge", tx: 8, ty: 22, block: false, kind: "decor" });
}

function paintTown(m: GameMap, _rng: Rng) {
  for (let y = 16; y < 28; y++) for (let x = 12; x < 30; x++) {
    const c = cellAt(m, x, y);
    if (!c) continue;
    const edge = x === 12 || x === 29 || y === 16 || y === 27;
    c.g = edge ? "path" : ((x + y) % 7 === 0 ? "dirt" : "cobble");
    c.block = false;
  }
  const houses: [number, number, string][] = [
    [13, 17, "obj_house"],
    [18, 16, "obj_house_gold"],
    [26, 17, "obj_house_red"],
    [14, 24, "obj_house"],
    [20, 24, "obj_house_shop"],
    [27, 23, "obj_house_gold"],
  ];
  for (const [x, y, k] of houses) {
    m.props.push({ key: k, tx: x, ty: y, block: true, kind: "house" });
    blockHouse(m, x, y, false);
  }
  m.props.push({ key: "obj_cauldron", tx: 16, ty: 20, block: true, kind: "station", id: "cauldron" });
  m.props.push({ key: "obj_furnace", tx: 19, ty: 20, block: true, kind: "station", id: "furnace" });
  m.spawns.push({ kind: "station", id: "cauldron", tx: 16, ty: 20 });
  m.spawns.push({ kind: "station", id: "furnace", tx: 19, ty: 20 });
  m.props.push({ key: "obj_stall", tx: 17, ty: 22, block: true, kind: "decor" });
  m.props.push({ key: "obj_stall", tx: 24, ty: 21, block: true, kind: "decor" });
  for (const [lx, ly] of [[13, 20], [21, 16], [28, 20], [16, 26], [25, 26], [22, 22]]) {
    m.props.push({ key: "obj_lantern", tx: lx, ty: ly, block: false, kind: "decor" });
  }
  m.props.push({ key: "obj_gate", tx: 12, ty: 20, block: true, kind: "decor" });
}

function placeNpcs(m: GameMap, rng: Rng, npcs: NpcDef[]) {
  const spots: Record<string, [number, number]> = {
    elder_qingsong: [15, 18],
    vendor_he: [18, 19],
    alchemist_azhi: [17, 17],
    smith_kuang: [12, 18],
    sect_qingming: [19, 16],
    sect_lieyan: [20, 17],
    lu_wanqing: [20, 16],
    situ_yan: [22, 15],
    chi_heng: [22, 18],
    auctioneer: [23, 20],
    vendor_guxing: [18, 22],
    alchemist_hai: [16, 21],
    smith_hai: [19, 21],
    sect_shuang: [25, 20],
    sect_xue: [14, 22],
    wanderer_lei: [20, 26],
    guard_jin: [26, 20],
  };
  for (const n of npcs) {
    const [tx, ty] = spots[n.id] ?? [rng.int(8, m.w - 8), rng.int(8, m.h - 8)];
    const c = cellAt(m, tx, ty);
    if (c) c.block = false;
    m.spawns.push({ kind: "npc", id: n.id, tx, ty });
  }
}

function sprinkle(m: GameMap, rng: Rng, keys: string[], n: number, ok?: (x: number, y: number) => boolean) {
  let tries = n * 6, placed = 0;
  while (placed < n && tries-- > 0) {
    const x = rng.int(2, m.w - 3), y = rng.int(2, m.h - 3);
    const c = cellAt(m, x, y);
    if (!c || c.block || c.g === "path" || c.g === "water" || c.g === "shallow" || c.g === "cobble" || c.g === "plank" || c.g === "rail" || c.g === "garden") continue;
    if (ok && !ok(x, y)) continue;
    const key = rng.pick(keys);
    const soft = key === "obj_bush" || key === "obj_bush_flower" || key === "obj_lantern";
    m.props.push({ key, tx: x, ty: y, block: !soft, kind: "decor" });
    if (!soft) c.block = true;
    placed++;
  }
}

function generateDungeon(regionId: string): GameMap {
  const def = REGION_MAP[regionId];
  const early = regionId === "dungeon_mine";
  const roomsN = early ? 6 : 7;
  const w = 40, h = 36;
  const rng = new Rng(def.mapSeed);
  const m: GameMap = { id: regionId, w, h, cells: [], props: [], spawns: [], rooms: [] };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    m.cells.push({ g: "cliff", block: true });
  }
  const rooms: { x: number; y: number; w: number; h: number; tag?: string }[] = [];
  let cx = 4, cy = 16;
  for (let i = 0; i < roomsN; i++) {
    const rw = rng.int(7, 10), rh = rng.int(6, 9);
    const x = Math.max(2, Math.min(w - rw - 2, cx));
    const y = Math.max(2, Math.min(h - rh - 2, cy));
    const tag = i === 0 ? "start" : i === roomsN - 1 ? "boss" : i === roomsN - 2 ? "elite" : "pack";
    rooms.push({ x, y, w: rw, h: rh, tag });
    carveRoom(m, x, y, rw, rh, tag, early);
    if (i > 0) {
      const prev = rooms[i - 1];
      carveCorridor(m, prev.x + (prev.w >> 1), prev.y + (prev.h >> 1), x + (rw >> 1), y + (rh >> 1), early);
    }
    cx += rng.int(6, 10);
    cy += rng.int(-4, 4);
  }
  m.rooms = rooms;
  const start = rooms[0];
  const boss = rooms[rooms.length - 1];

  m.spawns.push({ kind: "portal", id: def.connections[0] ?? "qingming_outskirts", tx: start.x + 1, ty: start.y + 2, extra: "离开副本" });
  m.props.push({ key: "obj_portal", tx: start.x + 1, ty: start.y + 2, block: true, kind: "portal" });
  // start room dressing
  m.props.push({ key: "obj_crate", tx: start.x + 2, ty: start.y + 1, block: true, kind: "decor" });
  m.props.push({ key: "obj_crate", tx: start.x + 3, ty: start.y + 1, block: true, kind: "decor" });
  m.props.push({ key: "obj_lantern", tx: start.x + 1, ty: start.y + 3, block: false, kind: "decor" });
  m.props.push({ key: "obj_support", tx: start.x + start.w - 2, ty: start.y + 1, block: true, kind: "decor" });
  m.props.push({ key: "obj_sign", tx: start.x + 3, ty: start.y + 3, block: true, kind: "decor" });

  const bossId = early ? "boss_tiee" : "boss_youheng";
  m.spawns.push({ kind: "boss", id: bossId, tx: boss.x + (boss.w >> 1), ty: boss.y + (boss.h >> 1) });
  m.props.push({ key: "obj_chest", tx: boss.x + (boss.w >> 1) + 2, ty: boss.y + (boss.h >> 1), block: false, kind: "chest" });
  m.spawns.push({ kind: "chest", id: early ? "chest_mine" : "chest_canzhao", tx: boss.x + (boss.w >> 1) + 2, ty: boss.y + (boss.h >> 1) });
  // boss chamber props
  m.props.push({ key: "obj_support", tx: boss.x + 1, ty: boss.y + 1, block: true, kind: "decor" });
  m.props.push({ key: "obj_support", tx: boss.x + boss.w - 2, ty: boss.y + 1, block: true, kind: "decor" });
  m.props.push({ key: "obj_support", tx: boss.x + 1, ty: boss.y + boss.h - 2, block: true, kind: "decor" });
  m.props.push({ key: "obj_vein", tx: boss.x + 2, ty: boss.y + (boss.h >> 1), block: true, kind: "decor" });
  m.props.push({ key: "obj_vein", tx: boss.x + boss.w - 3, ty: boss.y + (boss.h >> 1), block: true, kind: "decor" });
  m.props.push({ key: "obj_torch", tx: boss.x + 2, ty: boss.y + 2, block: false, kind: "decor" });
  m.props.push({ key: "obj_torch", tx: boss.x + boss.w - 3, ty: boss.y + 2, block: false, kind: "decor" });
  m.props.push({ key: "obj_lantern", tx: boss.x + (boss.w >> 1), ty: boss.y + 1, block: false, kind: "decor" });

  const table = def.spawnTable;
  for (const r of rooms) {
    if (r.tag === "start" || r.tag === "boss") continue;
    // dress mid rooms
    m.props.push({ key: "obj_support", tx: r.x + 1, ty: r.y + 1, block: true, kind: "decor" });
    m.props.push({ key: "obj_torch", tx: r.x + r.w - 2, ty: r.y + 1, block: false, kind: "decor" });
    if (rng.chance(0.6)) m.props.push({ key: "obj_cart", tx: r.x + (r.w >> 1), ty: r.y + r.h - 2, block: true, kind: "decor" });
    if (rng.chance(0.5)) m.props.push({ key: "obj_crate", tx: r.x + 2, ty: r.y + r.h - 2, block: true, kind: "decor" });
    const n = r.tag === "elite" ? 3 : 2;
    const elite = r.tag === "elite";
    for (let i = 0; i < n; i++) {
      const id = elite && early ? "kuangwei_elite" : table[rng.int(0, table.length - 1)];
      m.spawns.push({ kind: "enemy", id, tx: r.x + 2 + i, ty: r.y + 2 + (i % 2) });
    }
    if (rng.chance(0.5)) {
      const gid = def.gather[rng.int(0, def.gather.length - 1)];
      m.spawns.push({ kind: "gather", id: gid, tx: r.x + r.w - 2, ty: r.y + 2 });
      m.props.push({ key: gid.includes("ore") ? "obj_ore" : "obj_herb", tx: r.x + r.w - 2, ty: r.y + 2, kind: "gather", id: gid });
    }
  }
  sprinkle(m, rng, ["obj_rock", "obj_vein"], 16, (x, y) => !!cellAt(m, x, y) && !cellAt(m, x, y)!.block && (cellAt(m, x, y)!.g === "floor" || cellAt(m, x, y)!.g === "plank"));
  return m;
}

function carveRoom(m: GameMap, x: number, y: number, w: number, h: number, tag?: string, mine = true) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const c = cellAt(m, xx, yy);
    if (!c) continue;
    const edge = xx === x || yy === y || xx === x + w - 1 || yy === y + h - 1;
    if (tag === "start") c.g = edge ? "plank" : (mine ? "floor" : "plank");
    else if (tag === "boss") c.g = edge ? "stone" : (mine ? "cobble" : "ash");
    else c.g = (xx + yy) % 5 === 0 ? "stone" : (mine ? "floor" : "ash");
    c.block = false;
  }
}

function carveCorridor(m: GameMap, x0: number, y0: number, x1: number, y1: number, mine = true) {
  let x = x0, y = y0;
  const lay = (xx: number, yy: number) => {
    const c = cellAt(m, xx, yy);
    if (!c) return;
    c.g = mine ? "rail" : "floor";
    c.block = false;
  };
  while (x !== x1) {
    x += Math.sign(x1 - x);
    for (const [dx, dy] of [[0, 0], [0, 1], [1, 0]]) lay(x + dx, y + dy);
  }
  while (y !== y1) {
    y += Math.sign(y1 - y);
    for (const [dx, dy] of [[0, 0], [0, 1], [1, 0]]) lay(x + dx, y + dy);
  }
}

export function spawnPoint(m: GameMap, regionId: string, fromDungeon = false): { tx: number; ty: number } {
  if (m.id.startsWith("dungeon_")) {
    const s = m.rooms?.find((r) => r.tag === "start");
    if (s) return { tx: s.x + 2, ty: s.y + 3 };
  }
  if (regionId === "qingming_outskirts") return { tx: 14, ty: 18 };
  if (fromDungeon) {
    const p = m.spawns.find((s) => s.kind === "portal");
    if (p) return { tx: p.tx, ty: p.ty + 1.5 };
  }
  const path = m.cells.findIndex((c) => (c.g === "path" || c.g === "cobble") && !c.block);
  if (path >= 0) return { tx: path % m.w, ty: Math.floor(path / m.w) };
  return { tx: (m.w >> 1), ty: (m.h >> 1) };
}
