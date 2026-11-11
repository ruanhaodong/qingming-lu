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

const combat = await page.evaluate(() => {
  const s = window.__QL__.scene;
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
