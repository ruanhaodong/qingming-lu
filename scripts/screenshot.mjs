import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
mkdirSync(out, { recursive: true });
const url = process.env.QL_URL ?? "http://127.0.0.1:4173/";

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => console.warn("pageerror", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.warn("console", m.text());
});

async function clickGame(gx, gy) {
  const canvas = page.locator("canvas").first();
  await canvas.waitFor({ timeout: 20000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error("no canvas");
  await page.mouse.click(box.x + (gx / 640) * box.width, box.y + (gy / 360) * box.height);
}

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("canvas", { timeout: 20000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: join(out, "01-title.png") });
console.log("wrote 01-title.png");

await clickGame(320, 204); // 新的旅程
await page.waitForFunction(() => !!window.__QL__, null, { timeout: 15000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: join(out, "02-overworld.png") });
console.log("wrote 02-overworld.png");

// Walk-speed check: hold D+S for 1s on a clear stretch, expect ~7 tiles/sec.
const walk = await page.evaluate(async () => {
  const s = window.__QL__.scene;
  // Clear a short diagonal south-east of the spawn yard if needed, then measure.
  const start = { tx: s.player.tx, ty: s.player.ty };
  // South road out of the village is a long clear path at x=14, y=26..40.
  if (s.map.id === "qingming_outskirts") {
    s.player.tx = 14;
    s.player.ty = 26;
  }
  const t0 = { tx: s.player.tx, ty: s.player.ty };
  const keys = s.keys;
  keys.S.isDown = true;
  await new Promise((r) => setTimeout(r, 1000));
  keys.S.isDown = false;
  const dist = Math.hypot(s.player.tx - t0.tx, s.player.ty - t0.ty);
  return { start, t0, end: { tx: s.player.tx, ty: s.player.ty }, tilesPerSec: dist, region: s.map.id };
});
console.log("walk-speed", JSON.stringify(walk));
if (!(walk.tilesPerSec > 5.5 && walk.tilesPerSec < 8.5)) {
  console.warn("WALK SPEED OUT OF RANGE (want ~7 tiles/sec)", walk.tilesPerSec);
}

// Close-up of 青行 / 青松 and a house/tree overlap, then talk to 青松.
const talk = await page.evaluate(() => {
  const s = window.__QL__.scene;
  const song = s.actors.find((a) => a.id === "elder_qingsong");
  if (!song) return { ok: false, reason: "no 青松" };
  s.player.tx = song.tx + 0.9;
  s.player.ty = song.ty;
  s.player.dir = 1;
  return { ok: true, song: { tx: song.tx, ty: song.ty }, player: { tx: s.player.tx, ty: s.player.ty } };
});
console.log("qing song setup", talk);
await page.waitForTimeout(400);
await page.screenshot({ path: join(out, "14-chars-closeup.png") });
console.log("wrote 14-chars-closeup.png");

// Tree / house overlap: stand just south of the elder house at (16, 14)
const overlap = await page.evaluate(() => {
  const s = window.__QL__.scene;
  s.player.tx = 16;
  s.player.ty = 15.2;
  s.player.dir = 3;
  const house = s.map.props.find((p) => p.key === "obj_house_elder");
  const tree = s.map.props.find((p) => p.key === "obj_cherry" && Math.abs(p.tx - 12) < 1);
  return { house, tree, at: { tx: s.player.tx, ty: s.player.ty } };
});
console.log("overlap setup", overlap);
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, "15-house-tree-overlap.png") });
console.log("wrote 15-house-tree-overlap.png");

await page.evaluate(() => {
  const s = window.__QL__.scene;
  const song = s.actors.find((a) => a.id === "elder_qingsong");
  if (song) {
    s.player.tx = song.tx + 0.9;
    s.player.ty = song.ty;
  }
});
await page.waitForTimeout(200);
await page.keyboard.press("E");
await page.waitForTimeout(500);
await page.screenshot({ path: join(out, "16-talk-qingsong.png") });
console.log("wrote 16-talk-qingsong.png");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

const combat = await page.evaluate(() => {
  const s = window.__QL__.scene;
  if (s.hud.dialogRoot) s.hud.closeDialog();
  const e = s.actors.find((a) => (a.kind === "enemy" || a.kind === "boss") && !a.dead);
  if (!e) return { ok: false, reason: "no enemy", counts: s.actors.reduce((m, a) => (m[a.kind] = (m[a.kind] || 0) + 1, m), {}) };
  s.player.tx = e.tx + 1.15;
  s.player.ty = e.ty;
  s.player.dir = 1;
  s.castSlot(0);
  return { ok: true, enemy: e.id, tx: e.tx, ty: e.ty };
});
console.log("combat setup", combat);
await page.waitForTimeout(700);
await page.screenshot({ path: join(out, "03-combat-fx.png") });
console.log("wrote 03-combat-fx.png");

const open = async (panel, file) => {
  const info = await page.evaluate((p) => {
    try {
      window.__QL__.open(p);
      return { ok: true, panel: window.__QL__.scene.hud.panel };
    } catch (e) {
      return { ok: false, err: String(e) };
    }
  }, panel);
  await page.waitForTimeout(450);
  await page.screenshot({ path: join(out, file) });
  console.log("wrote", file, info);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
};

await open("inv", "04-inventory.png");
await open("cult", "05-cultivate.png");
await open("skill", "06-skills.png");
await open("quest", "07-quests.png");
await open("map", "08-worldmap.png");
await open("auction", "09-auction.png");
await open("craft", "10-craft.png");
await open("beast", "11-beasts.png");

await page.evaluate(() => {
  if (window.__QL__.scene.hud.panel) window.__QL__.scene.hud.closePanel();
  if (window.__QL__.scene.hud.dialogRoot) window.__QL__.scene.hud.closeDialog();
});
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, "12-hud.png") });
console.log("wrote 12-hud.png");

const dung = await page.evaluate(() => {
  try {
    window.__QL__.travel("dungeon_mine");
    return { ok: true, region: window.__QL__.state.data.region };
  } catch (e) {
    return { ok: false, err: String(e) };
  }
});
console.log("dungeon", dung);
await page.waitForTimeout(1200);
await page.screenshot({ path: join(out, "13-dungeon.png") });
console.log("wrote 13-dungeon.png");

await browser.close();
