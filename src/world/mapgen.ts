import { ENEMY_MAP, NPCS, REGION_MAP } from "../data";
import { Rng } from "../rng";
import type { NpcDef } from "../types";

export type Ground =
  | "grass" | "grass2" | "dirt" | "stone" | "water" | "sand" | "path"
  | "floor" | "wood" | "ash" | "forbidden" | "snow" | "flower" | "cliff";

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

function idx(m: Pick<GameMap, "w">, x: number, y: number) {
  return y * m.w + x;
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
      if (n < 0.08) { g = "water"; block = true; }
      else if (n < 0.14) g = "dirt";
      else if (n < 0.22) g = "flower";
      else if (n2v < 0.08) g = "grass2";
      else g = n < 0.6 ? "grass" : "grass2";
    } else if (def.biome === "coast") {
      const shore = (x / w) * 0.4 + n * 0.3;
      if (y > h * (0.62 + shore * 0.15)) { g = "water"; block = true; }
      else if (y > h * 0.5) g = "sand";
      else g = n < 0.2 ? "path" : "grass";
    } else if (def.biome === "ruins") {
      g = n < 0.15 ? "ash" : n < 0.5 ? "stone" : "dirt";
      if (n < 0.05) { g = "cliff"; block = true; }
    } else if (def.biome === "forbidden") {
      g = n < 0.1 ? "cliff" : n < 0.3 ? "stone" : "ash";
      if (g === "cliff") block = true;
      if (n2v < 0.06) { g = "water"; block = true; }
    }
    // border cliffs
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
      if (def.biome !== "coast" || y !== h - 1) {
        g = "cliff";
        block = true;
      }
    }
    m.cells.push({ g, block });
  }

  const path = (x0: number, y0: number, x1: number, y1: number) => {
    let x = x0, y = y0;
    const steps = Math.abs(x1 - x0) + Math.abs(y1 - y0) + 8;
    for (let i = 0; i < steps; i++) {
      const c = cellAt(m, x, y);
      if (c && c.g !== "water" && c.g !== "cliff") {
        c.g = "path";
        c.block = false;
      }
      if (x === x1 && y === y1) break;
      if (Math.abs(x1 - x) > Math.abs(y1 - y)) x += Math.sign(x1 - x);
      else y += Math.sign(y1 - y);
      if (rng.chance(0.2)) {
        if (rng.chance(0.5)) x += rng.chance(0.5) ? 1 : -1;
        else y += rng.chance(0.5) ? 1 : -1;
        x = Math.max(1, Math.min(w - 2, x));
        y = Math.max(1, Math.min(h - 2, y));
      }
    }
  };

  // landmarks by region
  if (regionId === "qingming_outskirts") {
    paintVillage(m, rng, 10, 14, 10, 10);
    path(14, 18, 28, 16);
    path(14, 18, 16, 8);
    path(14, 18, 32, 30);
    path(28, 16, 38, 10);
    // lingqi pool
    placeClearing(m, 16, 8, 3, "flower");
    m.props.push({ key: "obj_pool", tx: 16, ty: 8, block: true, kind: "pool" });
    m.spawns.push({ kind: "pool", id: "lingchi", tx: 16, ty: 8 });
    // abandoned Qingquan chamber (story: fall, 青泉残韵)
    placeClearing(m, 24, 11, 2, "stone");
    m.props.push({ key: "obj_stele", tx: 24, ty: 11, block: true, kind: "chamber", id: "qingquan_chamber" });
    m.spawns.push({ kind: "chamber", id: "qingquan_chamber", tx: 24, ty: 11, extra: "废弃青泉石室" });
    // dungeon portal
    placeClearing(m, 38, 10, 2, "dirt");
    m.props.push({ key: "obj_portal", tx: 38, ty: 10, block: true, kind: "portal" });
    m.spawns.push({ kind: "portal", id: "dungeon_mine", tx: 38, ty: 10, extra: "青石矿洞" });
    // world map stele
    m.props.push({ key: "obj_stele", tx: 18, ty: 16, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "worldmap", tx: 18, ty: 16 });
    // mountain exit hint (north-east travel marker)
    m.props.push({ key: "obj_stele", tx: 40, ty: 22, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "travel:cangyun_ridge", tx: 40, ty: 22, extra: "苍云岭方向" });
    m.props.push({ key: "obj_stele", tx: 8, ty: 36, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "travel:wanghai_market", tx: 8, ty: 36, extra: "望海坊方向" });
    sprinkle(m, rng, ["obj_tree", "obj_pine", "obj_bush", "obj_rock"], 70, (x, y) => !(x > 8 && x < 22 && y > 12 && y < 24));
  } else if (regionId === "cangyun_ridge") {
    path(4, 26, w - 5, 22);
    path(26, 4, 24, h - 5);
    placeClearing(m, 26, 24, 4, "dirt");
    m.props.push({ key: "obj_stele", tx: 8, ty: 26, block: true });
    m.spawns.push({ kind: "stele", id: "travel:qingming_outskirts", tx: 8, ty: 26, extra: "青冥村方向" });
    m.spawns.push({ kind: "stele", id: "travel:canzhao_realm", tx: w - 6, ty: 22, extra: "残照秘境" });
    m.spawns.push({ kind: "stele", id: "travel:youming_forbidden", tx: 24, ty: 6, extra: "禁地方向" });
    m.props.push({ key: "obj_stele", tx: w - 6, ty: 22, block: true });
    m.props.push({ key: "obj_stele", tx: 24, ty: 6, block: true });
    // bear king arena
    placeClearing(m, 30, 32, 4, "dirt");
    m.spawns.push({ kind: "boss", id: "boss_cangran", tx: 30, ty: 32 });
    sprinkle(m, rng, ["obj_pine", "obj_tree", "obj_rock", "obj_bush"], 110);
  } else if (regionId === "canzhao_realm") {
    path(6, 24, w - 6, 24);
    placeClearing(m, 24, 24, 5, "ash");
    m.props.push({ key: "obj_portal", tx: 24, ty: 18, block: true, kind: "portal" });
    m.spawns.push({ kind: "portal", id: "dungeon_canzhao", tx: 24, ty: 18, extra: "残照地宫" });
    m.spawns.push({ kind: "stele", id: "travel:cangyun_ridge", tx: 6, ty: 24, extra: "苍云岭" });
    m.spawns.push({ kind: "stele", id: "travel:wanghai_market", tx: w - 6, ty: 24, extra: "望海坊" });
    m.props.push({ key: "obj_stele", tx: 6, ty: 24, block: true });
    m.props.push({ key: "obj_stele", tx: w - 6, ty: 24, block: true });
    sprinkle(m, rng, ["obj_rock", "obj_pine", "obj_stele"], 80);
  } else if (regionId === "wanghai_market") {
    paintTown(m, rng, 12, 16, 18, 14);
    path(4, 20, w - 4, 20);
    m.props.push({ key: "obj_auction", tx: 22, ty: 18, block: true, kind: "auction" });
    m.spawns.push({ kind: "station", id: "auction", tx: 22, ty: 18 });
    m.spawns.push({ kind: "stele", id: "travel:qingming_outskirts", tx: 6, ty: 18, extra: "青冥村" });
    m.spawns.push({ kind: "stele", id: "travel:canzhao_realm", tx: w - 7, ty: 16, extra: "残照秘境" });
    m.props.push({ key: "obj_stele", tx: 6, ty: 18, block: true });
    m.props.push({ key: "obj_stele", tx: w - 7, ty: 16, block: true });
    m.props.push({ key: "obj_stele", tx: 16, ty: 14, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "worldmap", tx: 16, ty: 14 });
    sprinkle(m, rng, ["obj_bush", "obj_stall", "obj_tree"], 40, (x, y) => y < h * 0.55 && !(x > 10 && x < 32 && y > 14 && y < 30));
  } else if (regionId === "youming_forbidden") {
    path(26, h - 6, 26, 10);
    placeClearing(m, 26, 16, 5, "stone");
    m.spawns.push({ kind: "boss", id: "boss_moyuan", tx: 26, ty: 14 });
    m.props.push({ key: "obj_stele", tx: 22, ty: 12, block: true, kind: "stele" });
    m.spawns.push({ kind: "stele", id: "trib_altar", tx: 22, ty: 12, extra: "劫云台" });
    m.spawns.push({ kind: "stele", id: "travel:cangyun_ridge", tx: 26, ty: h - 6, extra: "苍云岭" });
    m.props.push({ key: "obj_stele", tx: 26, ty: h - 6, block: true });
    sprinkle(m, rng, ["obj_rock", "obj_pine", "obj_stele"], 90);
  }

  // NPCs for this region
  const npcs = NPCS.filter((n) => n.region === regionId);
  placeNpcs(m, rng, npcs);

  // gather nodes
  const gathers = def.gather;
  for (let i = 0; i < 18; i++) {
    const tx = rng.int(3, w - 4), ty = rng.int(3, h - 4);
    const c = cellAt(m, tx, ty);
    if (!c || c.block || c.g === "path" || c.g === "wood" || c.g === "floor") continue;
    const id = gathers[i % gathers.length];
    const key = id.includes("ore") ? "obj_ore" : id.includes("wood") ? "obj_wood" : "obj_herb";
    m.props.push({ key, tx, ty, block: false, kind: "gather", id });
    m.spawns.push({ kind: "gather", id, tx, ty });
  }

  // enemy spawns
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

function nearVillage(m: GameMap, x: number, y: number, region: string) {
  if (region === "qingming_outskirts") return x < 22 && y < 24 && x > 8 && y > 12;
  if (region === "wanghai_market") return x > 10 && x < 32 && y > 14 && y < 30;
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

function paintVillage(m: GameMap, rng: Rng, x0: number, y0: number, w: number, h: number) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const c = cellAt(m, x, y);
    if (!c) continue;
    c.g = "path";
    c.block = false;
  }
  const houses: [number, number, string][] = [
    [11, 15, "obj_house"],
    [16, 14, "obj_house_red"],
    [13, 20, "obj_house"],
    [19, 19, "obj_house_gold"],
    [11, 19, "obj_house"],
  ];
  for (const [x, y, k] of houses) {
    m.props.push({ key: k, tx: x, ty: y, block: true, kind: "house" });
    // block around house
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const c = cellAt(m, x + dx, y + dy);
      if (c) c.block = true;
    }
    const feet = cellAt(m, x, y + 1);
    if (feet) feet.block = false;
  }
  m.props.push({ key: "obj_well", tx: 15, ty: 17, block: true });
  m.props.push({ key: "obj_cauldron", tx: 17, ty: 16, block: true, kind: "station", id: "cauldron" });
  m.props.push({ key: "obj_furnace", tx: 12, ty: 17, block: true, kind: "station", id: "furnace" });
  m.props.push({ key: "obj_stall", tx: 18, ty: 18, block: true, kind: "stall" });
  m.spawns.push({ kind: "station", id: "cauldron", tx: 17, ty: 16 });
  m.spawns.push({ kind: "station", id: "furnace", tx: 12, ty: 17 });
}

function paintTown(m: GameMap, rng: Rng, x0: number, y0: number, w: number, h: number) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const c = cellAt(m, x, y);
    if (!c) continue;
    c.g = "path";
    c.block = false;
  }
  const houses: [number, number, string][] = [
    [13, 17, "obj_house"],
    [18, 16, "obj_house_gold"],
    [26, 17, "obj_house_red"],
    [14, 24, "obj_house"],
    [20, 24, "obj_house"],
    [27, 23, "obj_house_gold"],
  ];
  for (const [x, y, k] of houses) {
    m.props.push({ key: k, tx: x, ty: y, block: true, kind: "house" });
    const c = cellAt(m, x, y);
    if (c) c.block = true;
  }
  m.props.push({ key: "obj_cauldron", tx: 16, ty: 20, block: true, kind: "station", id: "cauldron" });
  m.props.push({ key: "obj_furnace", tx: 19, ty: 20, block: true, kind: "station", id: "furnace" });
  m.spawns.push({ kind: "station", id: "cauldron", tx: 16, ty: 20 });
  m.spawns.push({ kind: "station", id: "furnace", tx: 19, ty: 20 });
}

function placeNpcs(m: GameMap, rng: Rng, npcs: NpcDef[]) {
  // hand spots first for starting village
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
    let [tx, ty] = spots[n.id] ?? [rng.int(8, m.w - 8), rng.int(8, m.h - 8)];
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
    if (!c || c.block || c.g === "path" || c.g === "water") continue;
    if (ok && !ok(x, y)) continue;
    const key = rng.pick(keys);
    m.props.push({ key, tx: x, ty: y, block: key !== "obj_bush", kind: "decor" });
    if (key !== "obj_bush") c.block = true;
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
  // place rooms in a chain
  let cx = 4, cy = 16;
  for (let i = 0; i < roomsN; i++) {
    const rw = rng.int(6, 9), rh = rng.int(5, 8);
    const x = Math.max(2, Math.min(w - rw - 2, cx));
    const y = Math.max(2, Math.min(h - rh - 2, cy));
    const tag = i === 0 ? "start" : i === roomsN - 1 ? "boss" : i === roomsN - 2 ? "elite" : "pack";
    rooms.push({ x, y, w: rw, h: rh, tag });
    carveRoom(m, x, y, rw, rh);
    if (i > 0) {
      const prev = rooms[i - 1];
      carveCorridor(m, prev.x + (prev.w >> 1), prev.y + (prev.h >> 1), x + (rw >> 1), y + (rh >> 1));
    }
    cx += rng.int(6, 10);
    cy += rng.int(-4, 4);
  }
  m.rooms = rooms;
  const start = rooms[0];
  const boss = rooms[rooms.length - 1];
  const mid = rooms[Math.floor(rooms.length / 2)];

  m.spawns.push({ kind: "portal", id: def.connections[0] ?? "qingming_outskirts", tx: start.x + 1, ty: start.y + 2, extra: "离开副本" });
  m.props.push({ key: "obj_portal", tx: start.x + 1, ty: start.y + 2, block: true, kind: "portal" });

  const bossId = early ? "boss_tiee" : "boss_youheng";
  m.spawns.push({ kind: "boss", id: bossId, tx: boss.x + (boss.w >> 1), ty: boss.y + (boss.h >> 1) });
  m.props.push({ key: "obj_chest", tx: boss.x + (boss.w >> 1) + 2, ty: boss.y + (boss.h >> 1), block: false, kind: "chest" });
  m.spawns.push({ kind: "chest", id: early ? "chest_mine" : "chest_canzhao", tx: boss.x + (boss.w >> 1) + 2, ty: boss.y + (boss.h >> 1) });

  const table = def.spawnTable;
  for (const r of rooms) {
    if (r.tag === "start" || r.tag === "boss") continue;
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
  // a few rocks
  sprinkle(m, rng, ["obj_rock"], 18, (x, y) => !!cellAt(m, x, y) && !cellAt(m, x, y)!.block && cellAt(m, x, y)!.g === "floor");
  return m;
}

function carveRoom(m: GameMap, x: number, y: number, w: number, h: number) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const c = cellAt(m, xx, yy);
    if (!c) continue;
    c.g = "floor";
    c.block = false;
  }
}

function carveCorridor(m: GameMap, x0: number, y0: number, x1: number, y1: number) {
  let x = x0, y = y0;
  while (x !== x1) {
    x += Math.sign(x1 - x);
    for (const [dx, dy] of [[0, 0], [0, 1], [1, 0]]) {
      const c = cellAt(m, x + dx, y + dy);
      if (c) { c.g = "floor"; c.block = false; }
    }
  }
  while (y !== y1) {
    y += Math.sign(y1 - y);
    for (const [dx, dy] of [[0, 0], [0, 1], [1, 0]]) {
      const c = cellAt(m, x + dx, y + dy);
      if (c) { c.g = "floor"; c.block = false; }
    }
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
  const path = m.cells.findIndex((c) => c.g === "path" && !c.block);
  if (path >= 0) return { tx: path % m.w, ty: Math.floor(path / m.w) };
  return { tx: (m.w >> 1), ty: (m.h >> 1) };
}
