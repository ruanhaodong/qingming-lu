/** Procedural 16/32 px art. All textures created at boot and uploaded to Phaser. */

function canv(w: number, h: number): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  return { c, x };
}

function px(x: CanvasRenderingContext2D, X: number, Y: number, c: string, a = 1) {
  x.globalAlpha = a;
  x.fillStyle = c;
  x.fillRect(X | 0, Y | 0, 1, 1);
  x.globalAlpha = 1;
}

function hex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}

function diamond(x: CanvasRenderingContext2D, cx: number, cy: number, hw: number, hh: number, fill: string, edge?: string, top?: string) {
  x.beginPath();
  x.moveTo(cx, cy - hh);
  x.lineTo(cx + hw, cy);
  x.lineTo(cx, cy + hh);
  x.lineTo(cx - hw, cy);
  x.closePath();
  x.fillStyle = fill;
  x.fill();
  if (top) {
    x.beginPath();
    x.moveTo(cx, cy - hh);
    x.lineTo(cx + hw, cy);
    x.lineTo(cx, cy);
    x.lineTo(cx - hw, cy);
    x.closePath();
    x.fillStyle = top;
    x.fill();
  }
  if (edge) {
    x.strokeStyle = edge;
    x.lineWidth = 1;
    x.stroke();
  }
}

const GRASS = ["#0c1a12", "#163022", "#1e4630", "#2a5c3c", "#3d7a4e"];
const DIRT = ["#1a1410", "#2a2218", "#3d3324", "#5a4a32"];
const STONE = ["#16181a", "#2c3034", "#4a5056", "#6a7278"];
const WATER = ["#0a1820", "#102830", "#163848", "#1e5068", "#2a6a88"];
const SAND = ["#2a2418", "#4a3c28", "#6a5840", "#8a7458"];
const PATH = ["#2a2218", "#3d3324", "#5a4a32", "#6e5c40"];
const FLOOR = ["#1a1614", "#2a2420", "#3a322c", "#4a4238"];
const ASH = ["#141416", "#222226", "#323238", "#4a4a52"];
const SNOW = ["#2a3034", "#4a5458", "#7a888c", "#c0d0d4"];

function tileVar(seed: number, i: number) {
  const t = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

function paintTile(kind: string, seed = 1): HTMLCanvasElement {
  const { c, x } = canv(32, 16);
  const pal =
    kind === "grass" || kind === "grass2" ? GRASS :
    kind === "dirt" ? DIRT :
    kind === "stone" || kind === "cliff" ? STONE :
    kind === "water" ? WATER :
    kind === "sand" ? SAND :
    kind === "path" ? PATH :
    kind === "floor" || kind === "wood" ? FLOOR :
    kind === "ash" || kind === "forbidden" ? ASH :
    kind === "snow" ? SNOW :
    kind === "flower" ? GRASS :
    GRASS;
  diamond(x, 16, 8, 16, 8, pal[2], pal[0], pal[3]);
  for (let i = 0; i < 18; i++) {
    const u = tileVar(seed, i);
    const v = tileVar(seed, i + 40);
    const pxX = 6 + Math.floor(u * 20);
    const py = 3 + Math.floor(v * 10);
    // stay inside diamond roughly
    const dx = Math.abs(pxX - 16) / 16 + Math.abs(py - 8) / 8;
    if (dx > 0.85) continue;
    px(x, pxX, py, pal[1 + Math.floor(tileVar(seed, i + 90) * (pal.length - 1))]);
  }
  if (kind === "water") {
    x.globalAlpha = 0.45;
    diamond(x, 16, 8, 14, 6, WATER[4], undefined, WATER[3]);
    x.globalAlpha = 1;
  }
  if (kind === "flower") {
    px(x, 14, 6, "#c07090");
    px(x, 18, 9, "#d0c060");
    px(x, 12, 9, "#80c070");
  }
  if (kind === "cliff") {
    diamond(x, 16, 8, 16, 8, STONE[1], STONE[0], STONE[2]);
  }
  return c;
}

function tree(pine = false): HTMLCanvasElement {
  const { c, x } = canv(32, 48);
  // trunk
  x.fillStyle = "#2c1c14";
  x.fillRect(15, 36, 3, 8);
  x.fillStyle = "#4a2e1c";
  x.fillRect(15, 36, 2, 8);
  // shadow
  diamond(x, 16, 44, 8, 4, "rgba(0,0,0,0.28)");
  const greens = pine ? ["#0c2418", "#163c28", "#1e5434", "#2a7048"] : ["#0c2814", "#184820", "#246830", "#38a048"];
  if (pine) {
    for (let k = 0; k < 3; k++) {
      const y = 10 + k * 9;
      const w = 5 + k * 4;
      x.fillStyle = greens[k];
      x.beginPath();
      x.moveTo(16, y);
      x.lineTo(16 + w, y + 12);
      x.lineTo(16 - w, y + 12);
      x.closePath();
      x.fill();
      x.fillStyle = greens[Math.min(3, k + 1)];
      x.beginPath();
      x.moveTo(16, y);
      x.lineTo(16 + w * 0.45, y + 10);
      x.lineTo(16 - 2, y + 10);
      x.closePath();
      x.fill();
    }
  } else {
    x.fillStyle = greens[1];
    x.beginPath();
    x.arc(16, 22, 12, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = greens[2];
    x.beginPath();
    x.arc(13, 20, 8, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = greens[3];
    x.beginPath();
    x.arc(12, 18, 4, 0, Math.PI * 2);
    x.fill();
  }
  return c;
}

function rock(): HTMLCanvasElement {
  const { c, x } = canv(24, 20);
  diamond(x, 12, 16, 10, 4, "rgba(0,0,0,0.25)");
  x.fillStyle = STONE[1];
  x.beginPath();
  x.moveTo(4, 14); x.lineTo(8, 6); x.lineTo(18, 5); x.lineTo(22, 14); x.lineTo(12, 18);
  x.closePath(); x.fill();
  x.fillStyle = STONE[3];
  x.beginPath();
  x.moveTo(8, 6); x.lineTo(18, 5); x.lineTo(14, 12); x.lineTo(8, 12);
  x.closePath(); x.fill();
  x.fillStyle = STONE[0];
  x.fillRect(6, 14, 12, 2);
  return c;
}

function bush(): HTMLCanvasElement {
  const { c, x } = canv(20, 16);
  diamond(x, 10, 13, 7, 3, "rgba(0,0,0,0.2)");
  x.fillStyle = "#184820";
  x.beginPath(); x.arc(8, 9, 6, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#2a7040";
  x.beginPath(); x.arc(12, 8, 5, 0, Math.PI * 2); x.fill();
  px(x, 7, 7, "#3d8a50");
  px(x, 13, 6, "#50a060");
  return c;
}

function house(roof: string): HTMLCanvasElement {
  const { c, x } = canv(48, 48);
  diamond(x, 24, 40, 18, 8, "rgba(0,0,0,0.3)");
  // walls
  x.fillStyle = "#3a2a1c";
  x.fillRect(10, 22, 28, 16);
  x.fillStyle = "#4a3828";
  x.fillRect(10, 22, 14, 16);
  // door
  x.fillStyle = "#1a120c";
  x.fillRect(20, 28, 8, 10);
  x.fillStyle = "#c8a050";
  x.fillRect(26, 33, 1, 1);
  // window
  x.fillStyle = "#203838";
  x.fillRect(13, 26, 5, 5);
  x.fillRect(30, 26, 5, 5);
  x.fillStyle = "#80c0a0";
  x.fillRect(14, 27, 2, 2);
  // roof
  x.fillStyle = roof;
  x.beginPath();
  x.moveTo(8, 24);
  x.lineTo(24, 8);
  x.lineTo(40, 24);
  x.lineTo(24, 28);
  x.closePath();
  x.fill();
  x.fillStyle = "#0a1810";
  x.beginPath();
  x.moveTo(24, 8);
  x.lineTo(40, 24);
  x.lineTo(24, 22);
  x.closePath();
  x.fill();
  return c;
}

function well(): HTMLCanvasElement {
  const { c, x } = canv(24, 24);
  diamond(x, 12, 20, 9, 4, "rgba(0,0,0,0.25)");
  x.fillStyle = "#3a3a40";
  x.fillRect(5, 12, 14, 8);
  x.fillStyle = "#102028";
  x.fillRect(7, 14, 10, 4);
  x.fillStyle = "#5a4030";
  x.fillRect(11, 6, 2, 8);
  x.fillRect(6, 6, 12, 2);
  return c;
}

function pool(): HTMLCanvasElement {
  const { c, x } = canv(32, 24);
  diamond(x, 16, 16, 14, 7, "#0a2018");
  diamond(x, 16, 16, 11, 5, "#1a6050", undefined, "#40c8a0");
  px(x, 14, 14, "#d0fff0");
  px(x, 18, 17, "#80e0c0");
  return c;
}

function portal(): HTMLCanvasElement {
  const { c, x } = canv(28, 40);
  diamond(x, 14, 36, 10, 4, "rgba(0,0,0,0.3)");
  x.fillStyle = "#1a1420";
  x.fillRect(6, 8, 16, 26);
  x.fillStyle = "#3a2060";
  x.fillRect(8, 10, 12, 22);
  x.fillStyle = "#80e0d0";
  x.fillRect(10, 12, 8, 18);
  x.fillStyle = "#e8fff8";
  x.fillRect(12, 14, 4, 10);
  x.fillStyle = "#2a1a10";
  x.fillRect(5, 6, 18, 3);
  x.fillRect(5, 33, 18, 3);
  return c;
}

function chest(): HTMLCanvasElement {
  const { c, x } = canv(20, 18);
  diamond(x, 10, 15, 8, 3, "rgba(0,0,0,0.25)");
  x.fillStyle = "#4a3018";
  x.fillRect(3, 6, 14, 9);
  x.fillStyle = "#6a4820";
  x.fillRect(3, 6, 14, 4);
  x.fillStyle = "#d0a040";
  x.fillRect(9, 9, 2, 3);
  x.fillRect(3, 10, 14, 1);
  return c;
}

function node(kind: "herb" | "ore" | "wood"): HTMLCanvasElement {
  const { c, x } = canv(16, 16);
  diamond(x, 8, 13, 5, 2, "rgba(0,0,0,0.2)");
  if (kind === "herb") {
    x.fillStyle = "#285828";
    x.fillRect(7, 8, 2, 5);
    x.fillStyle = "#50a050";
    x.fillRect(5, 6, 3, 3);
    x.fillStyle = "#80e070";
    x.fillRect(8, 5, 3, 3);
  } else if (kind === "ore") {
    x.fillStyle = "#3a3a48";
    x.fillRect(4, 8, 8, 5);
    x.fillStyle = "#80c0e0";
    px(x, 6, 9, "#80c0e0");
    px(x, 9, 10, "#c0f0ff");
  } else {
    x.fillStyle = "#3a2418";
    x.fillRect(7, 6, 3, 8);
    x.fillStyle = "#184820";
    x.beginPath(); x.arc(8, 6, 5, 0, Math.PI * 2); x.fill();
  }
  return c;
}

function furnace(): HTMLCanvasElement {
  const { c, x } = canv(24, 28);
  diamond(x, 12, 24, 8, 3, "rgba(0,0,0,0.25)");
  x.fillStyle = "#3a3030";
  x.fillRect(5, 8, 14, 16);
  x.fillStyle = "#201818";
  x.fillRect(8, 14, 8, 8);
  x.fillStyle = "#e06020";
  x.fillRect(9, 16, 6, 5);
  x.fillStyle = "#f0d060";
  x.fillRect(11, 17, 2, 3);
  x.fillStyle = "#4a4040";
  x.fillRect(7, 4, 10, 5);
  return c;
}

function cauldron(): HTMLCanvasElement {
  const { c, x } = canv(24, 24);
  diamond(x, 12, 20, 8, 3, "rgba(0,0,0,0.25)");
  x.fillStyle = "#2a2a30";
  x.beginPath(); x.ellipse(12, 14, 8, 6, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#1a4030";
  x.beginPath(); x.ellipse(12, 13, 6, 3, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#40c080";
  px(x, 11, 12, "#80f0c0");
  x.fillStyle = "#5a4030";
  x.fillRect(5, 10, 2, 8);
  x.fillRect(17, 10, 2, 8);
  return c;
}

function stele(): HTMLCanvasElement {
  const { c, x } = canv(16, 28);
  diamond(x, 8, 24, 6, 3, "rgba(0,0,0,0.25)");
  x.fillStyle = "#3a4048";
  x.fillRect(4, 4, 8, 20);
  x.fillStyle = "#6a8080";
  x.fillRect(5, 6, 6, 3);
  x.fillStyle = "#80e0c0";
  px(x, 7, 12, "#80e0c0");
  px(x, 8, 14, "#80e0c0");
  return c;
}

function stall(): HTMLCanvasElement {
  const { c, x } = canv(32, 28);
  diamond(x, 16, 24, 12, 5, "rgba(0,0,0,0.25)");
  x.fillStyle = "#4a3020";
  x.fillRect(4, 14, 24, 8);
  x.fillStyle = "#8a2020";
  x.beginPath();
  x.moveTo(2, 14); x.lineTo(16, 4); x.lineTo(30, 14);
  x.closePath(); x.fill();
  return c;
}

function auctionHouse(): HTMLCanvasElement {
  const { c, x } = canv(56, 52);
  diamond(x, 28, 46, 22, 8, "rgba(0,0,0,0.3)");
  x.fillStyle = "#2a2830";
  x.fillRect(8, 20, 40, 22);
  x.fillStyle = "#c0a050";
  x.beginPath();
  x.moveTo(6, 22); x.lineTo(28, 4); x.lineTo(50, 22);
  x.closePath(); x.fill();
  x.fillStyle = "#101018";
  x.fillRect(24, 30, 8, 12);
  x.fillStyle = "#80e0d0";
  x.fillRect(12, 26, 6, 5);
  x.fillRect(38, 26, 6, 5);
  return c;
}

/** 16x24 character, 4 dirs (0=S,1=W,2=E,3=N), 2 walk frames. */
export function drawCharacter(pal: number[], dir: number, frame: number, opts?: { weapon?: boolean; horns?: boolean; beast?: boolean }): HTMLCanvasElement {
  const { c, x } = canv(16, 24);
  const p = pal.map(hex);
  const d = p[0] ?? "#102018";
  const m = p[1] ?? "#2a6050";
  const l = p[2] ?? "#80d0b0";
  const skin = "#d0b090";
  const hair = d;
  const bob = frame ? 1 : 0;
  const fy = 2 + bob;
  // shadow
  x.fillStyle = "rgba(0,0,0,0.28)";
  x.fillRect(4, 21, 8, 2);
  // legs
  const step = frame ? 1 : -1;
  x.fillStyle = d;
  if (dir === 2 || dir === 1) {
    x.fillRect(5, 16 + fy, 2, 5 + (step > 0 ? 1 : 0));
    x.fillRect(9, 16 + fy, 2, 5 + (step < 0 ? 1 : 0));
  } else {
    x.fillRect(6, 16 + fy, 2, 5);
    x.fillRect(9, 16 + fy, 2, 5);
    if (frame) x.fillRect(5, 20, 2, 1);
  }
  // body
  x.fillStyle = m;
  x.fillRect(5, 10 + fy, 6, 7);
  x.fillStyle = l;
  if (dir !== 3) x.fillRect(5, 11 + fy, 6, 2);
  else x.fillRect(5, 10 + fy, 6, 2);
  // arms
  x.fillStyle = m;
  if (dir === 2) {
    x.fillRect(11, 11 + fy, 2, 5);
    x.fillRect(3, 12 + fy, 2, 4);
  } else if (dir === 1) {
    x.fillRect(3, 11 + fy, 2, 5);
    x.fillRect(11, 12 + fy, 2, 4);
  } else {
    x.fillRect(3, 12 + fy, 2, 4);
    x.fillRect(11, 12 + fy, 2, 4);
  }
  // head
  x.fillStyle = skin;
  x.fillRect(5, 4 + fy, 6, 6);
  x.fillStyle = hair;
  x.fillRect(5, 3 + fy, 6, 2);
  if (dir !== 3) x.fillRect(5, 3 + fy, 6, 3);
  if (dir === 3) x.fillRect(5, 3 + fy, 6, 4);
  // eyes
  if (dir !== 3) {
    x.fillStyle = "#1a1010";
    if (dir === 2) px(x, 10, 6 + fy, "#1a1010");
    else if (dir === 1) px(x, 5, 6 + fy, "#1a1010");
    else {
      px(x, 6, 6 + fy, "#1a1010");
      px(x, 9, 6 + fy, "#1a1010");
    }
  }
  if (opts?.horns) {
    px(x, 4, 3 + fy, l);
    px(x, 11, 3 + fy, l);
  }
  if (opts?.beast) {
    x.fillStyle = m;
    x.fillRect(4, 14 + fy, 8, 5);
  }
  if (opts?.weapon && dir !== 1) {
    x.fillStyle = "#c0d0d0";
    x.fillRect(12, 6 + fy, 1, 10);
    x.fillStyle = "#d0a040";
    x.fillRect(11, 15 + fy, 3, 1);
  }
  if (opts?.weapon && dir === 1) {
    x.fillStyle = "#c0d0d0";
    x.fillRect(3, 6 + fy, 1, 10);
  }
  return c;
}

function icon(kind: string): HTMLCanvasElement {
  const { c, x } = canv(12, 12);
  const draw = (cols: string[]) => {
    // nothing
  };
  void draw;
  if (kind === "sword" || kind === "blade") {
    x.fillStyle = "#c0d0d8"; x.fillRect(6, 1, 2, 8);
    x.fillStyle = "#d0a040"; x.fillRect(4, 8, 6, 2);
    x.fillStyle = "#6a4a28"; x.fillRect(6, 9, 2, 2);
  } else if (kind === "robe" || kind === "armor" || kind === "cloak") {
    x.fillStyle = "#2a6050"; x.fillRect(3, 3, 6, 8);
    x.fillStyle = "#80d0b0"; x.fillRect(3, 3, 6, 2);
  } else if (kind.startsWith("pill")) {
    const col = kind.includes("green") ? "#50c070" : kind.includes("blue") ? "#50a0d0" : kind.includes("cyan") ? "#40d0c0" : kind.includes("purple") ? "#a060c0" : "#d0b040";
    x.fillStyle = col; x.fillRect(3, 3, 6, 6);
    x.fillStyle = "#fff8d0"; x.fillRect(4, 4, 2, 2);
  } else if (kind === "herb") {
    x.fillStyle = "#308040"; x.fillRect(5, 4, 2, 7); x.fillStyle = "#80e060"; x.fillRect(3, 3, 4, 3);
  } else if (kind === "book") {
    x.fillStyle = "#803020"; x.fillRect(2, 2, 8, 8); x.fillStyle = "#f0e0c0"; x.fillRect(3, 3, 6, 6);
  } else if (kind === "talisman") {
    x.fillStyle = "#e0d0a0"; x.fillRect(3, 1, 6, 10); x.fillStyle = "#a02020"; x.fillRect(5, 3, 2, 5);
  } else if (kind === "core" || kind === "crystal" || kind === "stone") {
    x.fillStyle = "#40c0a0"; x.fillRect(3, 3, 6, 6); x.fillStyle = "#e0fff8"; x.fillRect(4, 4, 2, 2);
  } else {
    x.fillStyle = "#80a090"; x.fillRect(3, 3, 6, 6);
  }
  return c;
}

function uiPanel(): HTMLCanvasElement {
  const { c, x } = canv(32, 32);
  x.fillStyle = "#0e1612";
  x.fillRect(0, 0, 32, 32);
  x.fillStyle = "#1c2c24";
  x.fillRect(1, 1, 30, 30);
  x.strokeStyle = "#3a6a50";
  x.strokeRect(1.5, 1.5, 29, 29);
  x.strokeStyle = "#80c0a0";
  x.strokeRect(0.5, 0.5, 31, 31);
  return c;
}

function uiBtn(w = 48, h = 16, col = "#1c2c24"): HTMLCanvasElement {
  const { c, x } = canv(w, h);
  x.fillStyle = "#0a1210";
  x.fillRect(0, 0, w, h);
  x.fillStyle = col;
  x.fillRect(1, 1, w - 2, h - 2);
  x.strokeStyle = "#6ab090";
  x.strokeRect(0.5, 0.5, w - 1, h - 1);
  return c;
}

export function generateAtlas(textures: Phaser.Textures.TextureManager) {
  const add = (key: string, canvas: HTMLCanvasElement) => {
    if (textures.exists(key)) textures.remove(key);
    textures.addCanvas(key, canvas);
  };

  const tiles = ["grass", "grass2", "dirt", "stone", "water", "sand", "path", "floor", "wood", "ash", "forbidden", "snow", "flower", "cliff"];
  tiles.forEach((t, i) => add("tile_" + t, paintTile(t, 17 + i * 13)));

  add("obj_tree", tree(false));
  add("obj_pine", tree(true));
  add("obj_rock", rock());
  add("obj_bush", bush());
  add("obj_house", house("#1c5a42"));
  add("obj_house_red", house("#6a2018"));
  add("obj_house_gold", house("#8a6a20"));
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

  // player + generic
  const pPal = [0x102018, 0x2a6050, 0x80d0b0];
  for (let d = 0; d < 4; d++) for (let f = 0; f < 2; f++) {
    add(`char_player_${d}_${f}`, drawCharacter(pPal, d, f, { weapon: true }));
  }

  add("ui_panel", uiPanel());
  add("ui_btn", uiBtn(64, 16));
  add("ui_btn_wide", uiBtn(96, 16));
  add("ui_btn_small", uiBtn(32, 14));
  add("ui_btn_gold", uiBtn(64, 16, "#3a2c14"));

  const icons = ["sword", "blade", "robe", "armor", "cloak", "pill_green", "pill_blue", "pill_cyan", "pill_purple", "pill_gold", "herb", "book", "talisman", "core", "crystal", "stone"];
  for (const ic of icons) add("icon_" + ic, icon(ic));

  // joystick base
  const { c: jb, x: jx } = canv(72, 72);
  jx.beginPath(); jx.arc(36, 36, 34, 0, Math.PI * 2);
  jx.fillStyle = "rgba(12,24,18,0.45)"; jx.fill();
  jx.strokeStyle = "rgba(128,208,160,0.7)"; jx.lineWidth = 2; jx.stroke();
  add("ui_joy_base", jb);
  const { c: jk, x: ky } = canv(28, 28);
  ky.beginPath(); ky.arc(14, 14, 12, 0, Math.PI * 2);
  ky.fillStyle = "rgba(160,224,192,0.85)"; ky.fill();
  ky.strokeStyle = "#e8fff8"; ky.stroke();
  add("ui_joy_knob", jk);

  // skill slot
  const { c: sl, x: sx } = canv(28, 28);
  sx.fillStyle = "rgba(10,18,14,0.7)";
  sx.fillRect(0, 0, 28, 28);
  sx.strokeStyle = "#6ab090";
  sx.strokeRect(0.5, 0.5, 27, 27);
  add("ui_slot", sl);

  // bar backing
  const { c: bar, x: bx } = canv(80, 6);
  bx.fillStyle = "#08100c";
  bx.fillRect(0, 0, 80, 6);
  bx.strokeStyle = "#203028";
  bx.strokeRect(0.5, 0.5, 79, 5);
  add("ui_bar", bar);

  return { tiles, icons };
}

const charCache = new Map<string, string>();

export function ensureChar(textures: Phaser.Textures.TextureManager, key: string, pal: number[], opts?: { weapon?: boolean; horns?: boolean; beast?: boolean }): string {
  if (charCache.has(key) && textures.exists(key + "_0_0")) return key;
  for (let d = 0; d < 4; d++) for (let f = 0; f < 2; f++) {
    const k = `${key}_${d}_${f}`;
    if (textures.exists(k)) textures.remove(k);
    textures.addCanvas(k, drawCharacter(pal, d, f, opts));
  }
  charCache.set(key, key);
  return key;
}
