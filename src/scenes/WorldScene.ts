import Phaser from "phaser";
import { ENEMY_MAP, EVENT_MAP, ITEM_MAP, NPC_MAP, REGION_MAP, SKILL_MAP, beastFromEnemy } from "../data";
import { ensureChar } from "../gen/sprites";
import { Hud } from "../hud/Hud";
import { Rng } from "../rng";
import { GameState } from "../state";
import type { LearnedSkill } from "../types";
import { FxRuntime, actOf } from "../vfx/runtime";
import { depthOf, iso, mapBounds } from "../world/iso";
import { cellAt, generateMap, spawnPoint, type GameMap, type Spawn, walkable } from "../world/mapgen";

type Kind = "player" | "enemy" | "npc" | "pet" | "gather" | "portal" | "chest" | "station" | "stele" | "boss" | "pool" | "chamber";

interface Actor {
  kind: Kind;
  id: string;
  tx: number;
  ty: number;
  sprite: Phaser.GameObjects.Image;
  dir: number;
  frame: number;
  ft: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  dead: boolean;
  flash: number;
  lock: number;
  cd: number;
  aggro: boolean;
  name?: string;
  enemyId?: string;
  bar?: Phaser.GameObjects.Rectangle;
  captured?: boolean;
}

export class WorldScene extends Phaser.Scene {
  state!: GameState;
  map!: GameMap;
  fx!: FxRuntime;
  hud!: Hud;
  player!: Actor;
  actors: Actor[] = [];
  props: Phaser.GameObjects.Image[] = [];
  ground?: Phaser.GameObjects.Image;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  saveAcc = 0;
  night?: Phaser.GameObjects.Rectangle;
  attack?: { skill: ReturnType<GameState["skillView"]>; t: number; hit: boolean; target?: Actor; origin: { x: number; y: number } };
  lastEvent?: string;
  atPool = false;
  meditating = false;
  floaters: { t: Phaser.GameObjects.Text; life: number }[] = [];

  constructor() {
    super({ key: "WorldScene" });
  }

  init(data: { state?: GameState }) {
    this.state = data.state ?? GameState.load() ?? GameState.newGame("青行");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a1210);
    this.fx = new FxRuntime(this);
    this.hud = new Hud(this, this.state);
    this.hud.onCast = (i) => this.castSlot(i);
    this.hud.onInteract = () => this.interact();
    this.hud.onCapture = () => this.captureNear();
    this.hud.onTravel = (id) => this.travel(id);
    this.hud.onMeditate = (on) => { this.meditating = on; };
    this.state.log = (m, k) => this.hud.toast(m);
    this.state.onFx = (id, x, y) => {
      const p = iso(this.player.tx, this.player.ty);
      this.fx.play(id, x ?? p.x, y ?? p.y, {}, depthOf(this.player.tx, this.player.ty));
    };
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,F,SPACE,B,C,K,M,Q,ESC,ONE,TWO,THREE,FOUR,J") as any;
    kb.on("keydown-ONE", () => this.castSlot(0));
    kb.on("keydown-TWO", () => this.castSlot(1));
    kb.on("keydown-THREE", () => this.castSlot(2));
    kb.on("keydown-FOUR", () => this.castSlot(3));
    kb.on("keydown-E", () => this.interact());
    kb.on("keydown-SPACE", () => { if (!this.hud.busy()) { if (this.nearInteract()) this.interact(); else this.castSlot(0); } });
    kb.on("keydown-F", () => this.captureNear());
    kb.on("keydown-B", () => this.hud.toggle("inv"));
    kb.on("keydown-C", () => this.hud.toggle("cult"));
    kb.on("keydown-K", () => this.hud.toggle("skill"));
    kb.on("keydown-M", () => this.hud.toggle("map"));
    kb.on("keydown-Q", () => this.hud.toggle("quest"));
    kb.on("keydown-ESC", () => { if (this.hud.dialogRoot) this.hud.closeDialog(); else if (this.hud.panel) this.hud.closePanel(); else this.hud.toggle("menu"); });

    this.loadRegion(this.state.data.region, false);
    this.night = this.add.rectangle(0, 0, 640, 360, 0x061018, 0).setOrigin(0).setScrollFactor(0).setDepth(9000);

    this.events.on("shutdown", () => this.fx.destroy());

    (window as any).__QL__ = {
      state: this.state,
      scene: this,
      open: (p: string) => this.hud.open(p as any),
      travel: (id: string) => this.travel(id),
      toast: (m: string) => this.hud.toast(m),
      give: (id: string, n = 1) => this.state.addItem(id, n),
      event: () => this.state.rollEvent(),
      breakthrough: () => this.state.breakthrough(),
    };
  }

  loadRegion(id: string, warp = true) {
    this.fx.destroy();
    this.fx = new FxRuntime(this);
    this.actors.forEach((a) => { a.sprite.destroy(); a.bar?.destroy(); });
    this.actors = [];
    this.props.forEach((p) => p.destroy());
    this.props = [];
    this.ground?.destroy();
    this.attack = undefined;
    this.map = generateMap(id);
    this.state.data.region = id;
    this.state.discover(id);
    this.state.questEnter(id);
    this.bakeGround();
    this.placeProps();
    this.spawnActors();
    const sp = warp ? spawnPoint(this.map, id) : { tx: this.state.data.tileX, ty: this.state.data.tileY };
    if (warp) { this.state.data.tileX = sp.tx; this.state.data.tileY = sp.ty; }
    this.spawnPlayer(this.state.data.tileX, this.state.data.tileY);
    const p = iso(this.player.tx, this.player.ty);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);
    const b = mapBounds(this.map.w, this.map.h);
    this.cameras.main.setBounds(b.x, b.y, b.w, b.h);
    this.pickWeather();
    this.hud.toast(`抵达${REGION_MAP[id]?.name ?? id}`);
    this.state.save();
  }

  bakeGround() {
    const b = mapBounds(this.map.w, this.map.h);
    const c = document.createElement("canvas");
    c.width = Math.ceil(b.w);
    c.height = Math.ceil(b.h);
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++) {
      const cell = cellAt(this.map, x, y)!;
      const tex = this.textures.get("tile_" + cell.g);
      const src = (tex.getSourceImage() as HTMLCanvasElement | HTMLImageElement);
      const p = iso(x, y);
      ctx.drawImage(src, p.x - 16 - b.x, p.y - 8 - b.y);
    }
    if (this.textures.exists("ground_map")) this.textures.remove("ground_map");
    this.textures.addCanvas("ground_map", c);
    this.ground = this.add.image(b.x, b.y, "ground_map").setOrigin(0, 0).setDepth(-2000);
  }

  placeProps() {
    for (const pr of this.map.props) {
      if (!this.textures.exists(pr.key)) continue;
      const p = iso(pr.tx, pr.ty);
      const img = this.add.image(p.x, p.y, pr.key).setOrigin(0.5, 0.9).setDepth(depthOf(pr.tx, pr.ty, 2));
      this.props.push(img);
    }
  }

  spawnPlayer(tx: number, ty: number) {
    const p = iso(tx, ty);
    const sprite = this.add.image(p.x, p.y, "char_player_0_0").setOrigin(0.5, 0.92).setDepth(depthOf(tx, ty, 4));
    this.player = {
      kind: "player", id: "player", tx, ty, sprite, dir: 0, frame: 0, ft: 0,
      hp: this.state.data.hp, maxHp: this.state.data.maxHp, atk: this.state.atk(), def: this.state.def(),
      speed: 2.4, dead: false, flash: 0, lock: 0, cd: 0, aggro: false,
    };
    this.actors.push(this.player);
  }

  spawnActors() {
    const rng = new Rng(this.map.id.length * 17 + this.state.data.seed);
    for (const s of this.map.spawns) this.spawnFrom(s, rng);
    // event extras
    const ev = this.state.data.event;
    if (ev && (ev.region === this.state.data.region || ev.id === "beast_tide" || ev.id === "sanxiu_duel")) {
      if (ev.id === "beast_tide") {
        const table = REGION_MAP[this.state.data.region]?.spawnTable ?? [];
        for (let i = 0; i < 6; i++) {
          const id = table[rng.int(0, Math.max(0, table.length - 1))] ?? "zaomao_tu";
          this.spawnFrom({ kind: "enemy", id, tx: this.state.data.tileX + rng.int(-6, 6), ty: this.state.data.tileY + rng.int(-6, 6) }, rng);
        }
        if (this.state.data.region !== "qingming_outskirts" || this.state.data.realm >= 1) {
          this.spawnFrom({ kind: "boss", id: "boss_xuepao", tx: this.state.data.tileX + 5, ty: this.state.data.tileY + 3 }, rng);
        }
      }
      if (ev.id === "sanxiu_duel") {
        this.spawnFrom({ kind: "enemy", id: "sanxiu_doufa", tx: this.state.data.tileX + 2, ty: this.state.data.tileY + 1 }, rng);
        this.spawnFrom({ kind: "enemy", id: "caiyao_sanxiu", tx: this.state.data.tileX + 3, ty: this.state.data.tileY + 2 }, rng);
      }
    }
  }

  spawnFrom(s: Spawn, rng: Rng) {
    const p = iso(s.tx, s.ty);
    if (s.kind === "npc") {
      const npc = NPC_MAP[s.id];
      const key = ensureChar(this.textures, "npc_" + s.id, npc?.palette ?? [0x203028, 0x4a7060, 0xc8d8c0], { weapon: false });
      const sprite = this.add.image(p.x, p.y, `${key}_0_0`).setOrigin(0.5, 0.92).setDepth(depthOf(s.tx, s.ty, 4));
      this.actors.push({ kind: "npc", id: s.id, tx: s.tx, ty: s.ty, sprite, dir: 0, frame: 0, ft: 0, hp: 1, maxHp: 1, atk: 0, def: 0, speed: 0, dead: false, flash: 0, lock: 0, cd: 0, aggro: false, name: npc?.name });
    } else if (s.kind === "enemy" || s.kind === "boss") {
      const def = ENEMY_MAP[s.id];
      if (!def) return;
      const key = ensureChar(this.textures, "en_" + s.id, def.palette, { weapon: def.kind === "human" || def.kind === "boss", horns: def.kind !== "human", beast: def.kind === "beast" });
      const sprite = this.add.image(p.x, p.y, `${key}_0_0`).setOrigin(0.5, 0.92).setDepth(depthOf(s.tx, s.ty, 4));
      const bar = this.add.rectangle(p.x, p.y - 22, 16, 2, 0xc04040).setOrigin(0.5, 1).setDepth(depthOf(s.tx, s.ty, 6));
      this.actors.push({
        kind: s.kind, id: s.id, enemyId: s.id, tx: s.tx + rng.float(-0.2, 0.2), ty: s.ty + rng.float(-0.2, 0.2),
        sprite, dir: 0, frame: 0, ft: 0, hp: def.hp, maxHp: def.hp, atk: def.atk, def: def.def,
        speed: def.speed, dead: false, flash: 0, lock: 0, cd: rng.float(0, 1), aggro: s.kind === "boss", name: def.name, bar,
      });
    } else {
      // gather/portal etc already have props; keep a ghost actor for interaction
      const sprite = this.add.image(p.x, p.y, "ui_bar").setVisible(false).setDepth(depthOf(s.tx, s.ty));
      this.actors.push({
        kind: s.kind, id: s.id, tx: s.tx, ty: s.ty, sprite, dir: 0, frame: 0, ft: 0,
        hp: 1, maxHp: 1, atk: 0, def: 0, speed: 0, dead: false, flash: 0, lock: 0, cd: 0, aggro: false, name: s.extra,
      });
    }
  }

  pickWeather() {
    const ev = this.state.data.event;
    if (ev?.id === "trib_clouds") { this.fx.playWeather("weather/storm"); return; }
    if (ev?.id === "lingqi_leak") { this.fx.playWeather("weather/god-rays"); return; }
    const list = REGION_MAP[this.state.data.region]?.weather ?? [];
    if (!list.length) { this.fx.playWeather(null); return; }
    const rng = new Rng(this.state.data.seed ^ Math.floor(this.state.data.worldTime / 80));
    const name = rng.pick(list);
    const map: Record<string, string> = {
      fireflies: "weather/fireflies", fog: "weather/fog", rain: "weather/rain", storm: "weather/storm",
      "cherry-blossoms": "weather/cherry-blossoms", "god-rays": "weather/god-rays", clouds: "weather/clouds",
      "falling-leaves": "weather/falling-leaves", aurora: "weather/aurora", "shooting-stars": "weather/shooting-stars",
    };
    this.fx.playWeather(this.state.isNight() && rng.chance(0.4) ? "weather/fireflies" : map[name] ?? null);
  }

  update(_t: number, raw: number) {
    const dt = Math.min(0.05, raw / 1000);
    if (this.state.data.flags.wantEscape) {
      this.state.data.flags.wantEscape = 0;
      const out = REGION_MAP[this.state.data.region]?.connections[0];
      if (out) this.travel(out);
    }
    this.state.tickWorld(dt);
    if (this.state.data.event?.id !== this.lastEvent) {
      this.lastEvent = this.state.data.event?.id;
      if (this.state.data.event) {
        const ev = EVENT_MAP[this.state.data.event.id];
        this.hud.showBanner(`天地异象：${ev?.name}！${ev?.desc ?? ""}`);
        this.fx.play("ui/exclamation", iso(this.player.tx, this.player.ty).x, iso(this.player.tx, this.player.ty).y - 20);
        this.pickWeather();
      }
    }
    this.night?.setAlpha(this.state.dayFactor() * 0.42);
    this.hud.update(dt);
    this.updateInput(dt);
    this.updateAttack(dt);
    this.updateAi(dt);
    this.updatePet(dt);
    this.syncSprites();
    this.updateFloats(dt);
    if (this.atPool || this.meditating) this.state.meditate(dt, this.atPool);
    this.state.data.hp = this.player.hp;
    this.player.maxHp = this.state.data.maxHp;
    this.player.atk = this.state.atk();
    this.player.def = this.state.def();
    if (this.state.data.hp <= 0 && !this.player.dead) this.onPlayerDeath();
    this.regen(dt);
    this.fx.update(dt);
    this.saveAcc += dt;
    if (this.saveAcc > 15) { this.saveAcc = 0; this.state.data.tileX = this.player.tx; this.state.data.tileY = this.player.ty; this.state.save(); }
    this.updatePrompt();
  }

  regen(dt: number) {
    if (this.player.lock > 0 || this.player.dead) return;
    this.state.data.hp = Math.min(this.state.data.maxHp, this.state.data.hp + 1.2 * dt);
    this.state.data.mp = Math.min(this.state.data.maxMp, this.state.data.mp + 2.2 * dt);
    this.player.hp = this.state.data.hp;
  }

  updateInput(dt: number) {
    if (this.player.dead || this.hud.busy() || this.player.lock > 0 || this.meditating) return;
    let sx = 0, sy = 0;
    const k = this.keys;
    if (k.A?.isDown || k.LEFT?.isDown) sx -= 1;
    if (k.D?.isDown || k.RIGHT?.isDown) sx += 1;
    if (k.W?.isDown || k.UP?.isDown) sy -= 1;
    if (k.S?.isDown || k.DOWN?.isDown) sy += 1;
    const j = this.hud.moveVec();
    sx += j.x; sy += j.y;
    const len = Math.hypot(sx, sy);
    if (len < 0.15) return;
    sx /= len; sy /= len;
    // screen-space to tile-space
    const dtx = (sx / 32 + sy / 16) * this.player.speed * dt * 2.2;
    const dty = (sy / 16 - sx / 32) * this.player.speed * dt * 2.2;
    this.tryMove(this.player, dtx, dty);
    if (Math.abs(sx) > Math.abs(sy)) this.player.dir = sx > 0 ? 2 : 1;
    else this.player.dir = sy > 0 ? 0 : 3;
    this.player.ft += dt;
    if (this.player.ft > 0.22) { this.player.ft = 0; this.player.frame ^= 1; }
    this.state.data.facing = this.player.dir;
  }

  tryMove(a: Actor, dtx: number, dty: number) {
    const nx = a.tx + dtx, ny = a.ty + dty;
    if (walkable(this.map, nx, a.ty) && !this.blockedByProp(nx, a.ty, a)) a.tx = nx;
    if (walkable(this.map, a.tx, ny) && !this.blockedByProp(a.tx, ny, a)) a.ty = ny;
  }

  blockedByProp(x: number, y: number, self?: Actor) {
    // already in cell.block
    return false;
  }

  syncSprites() {
    for (const a of this.actors) {
      if (a.dead && a.kind !== "player") continue;
      const p = iso(a.tx, a.ty);
      a.sprite.setPosition(p.x, p.y).setDepth(depthOf(a.tx, a.ty, 4));
      const key = a.kind === "player" ? `char_player_${a.dir}_${a.frame}` :
        a.kind === "npc" ? `npc_${a.id}_${a.dir}_${a.frame}` :
        a.kind === "pet" ? `pet_${a.id}_${a.dir}_${a.frame}` :
        (a.kind === "enemy" || a.kind === "boss") ? `en_${a.enemyId ?? a.id}_${a.dir}_${a.frame}` : "";
      if (key && this.textures.exists(key)) a.sprite.setTexture(key);
      if (a.flash > 0) { a.flash -= 0.05; a.sprite.setTint(0xff8080); } else a.sprite.clearTint();
      if (a.bar) {
        a.bar.setPosition(p.x, p.y - 22).setDepth(depthOf(a.tx, a.ty, 6));
        a.bar.scaleX = Math.max(0, a.hp / a.maxHp);
        a.bar.setVisible(!a.dead && a.hp < a.maxHp);
      }
      if (a.lock > 0) a.lock -= 0.016;
    }
    this.player.sprite.setPosition(iso(this.player.tx, this.player.ty).x, iso(this.player.tx, this.player.ty).y);
  }

  nearInteract(): Actor | undefined {
    const list = [...this.actors.filter((a) => a.kind === "npc" && !a.dead), ...this.actors.filter((a) => ["gather", "portal", "chest", "station", "stele", "chamber"].includes(a.kind) && !a.dead)];
    let best: Actor | undefined, bestD = 1.55;
    for (const a of list) {
      const d = Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty);
      if (d < bestD) { bestD = d; best = a; }
    }
    return best;
  }

  updatePrompt() {
    const n = this.nearInteract();
    this.atPool = this.actors.some((a) => a.kind === "station" && a.id === "lingchi" && Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty) < 1.8)
      || this.map.spawns.some((s) => s.kind === "pool" && Math.hypot(s.tx - this.player.tx, s.ty - this.player.ty) < 1.8);
    if (this.atPool) this.hud.setPrompt("灵池萦绕 · 吐纳加快  （打开「修炼」可盘膝，或原地静立）");
    else if (!n) {
      const w = this.actors.find((a) => (a.kind === "enemy" || a.kind === "boss") && !a.dead && a.hp / a.maxHp <= 0.35 && ENEMY_MAP[a.enemyId ?? a.id]?.capture && Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty) < 2);
      this.hud.setPrompt(w ? `按 F 或点「收服」：拘灵符捕捉${w.name}` : "");
    } else {
      const lab = n.kind === "npc" ? `交谈：${n.name ?? n.id}` :
        n.kind === "gather" ? `采集：${ITEM_MAP[n.id]?.name ?? n.id}` :
        n.kind === "portal" ? `进入：${REGION_MAP[n.id]?.name ?? n.name ?? n.id}` :
        n.kind === "chest" ? "开启宝箱" :
        n.kind === "station" ? (n.id === "auction" ? "拍卖行" : n.id === "furnace" ? "炼器" : n.id === "cauldron" ? "炼丹" : n.id) :
        n.kind === "stele" ? (n.id === "worldmap" ? "观阅大世界" : n.id === "trib_altar" ? "劫云台" : n.name ?? "路碑") :
        n.kind === "chamber" ? "探入：废弃青泉石室" : "";
      this.hud.setPrompt(lab ? `E / 交互  ${lab}` : "");
    }
  }

  interact() {
    if (this.hud.busy() || this.player.dead) return;
    const n = this.nearInteract();
    if (!n) return;
    if (n.kind === "npc") this.talk(n.id);
    else if (n.kind === "gather") {
      this.state.addItem(n.id, 1);
      this.state.questGather(n.id);
      this.fx.play("pickups/xp-orb", iso(n.tx, n.ty).x, iso(n.tx, n.ty).y);
      this.hud.toast(`采得${ITEM_MAP[n.id]?.name}`);
      n.dead = true;
      n.sprite.setVisible(false);
      const prop = this.props.find((p) => Math.abs(p.x - iso(n.tx, n.ty).x) < 2 && Math.abs(p.y - iso(n.tx, n.ty).y) < 2);
      prop?.destroy();
    } else if (n.kind === "portal") this.travel(n.id);
    else if (n.kind === "chest") this.openChest(n);
    else if (n.kind === "station") {
      if (n.id === "auction") this.hud.open("auction");
      else if (n.id === "furnace") this.hud.open("craft", { mode: "furnace" });
      else if (n.id === "cauldron") this.hud.open("craft", { mode: "cauldron" });
    } else if (n.kind === "chamber") {
      this.enterSpringChamber();
    } else if (n.kind === "stele") {
      if (n.id === "worldmap") this.hud.open("map");
      else if (n.id === "trib_altar") {
        this.state.data.flags.trib_seen = 1;
        this.state.questFlag("trib_seen");
        const p = iso(n.tx, n.ty);
        this.fx.play("weather/storm", p.x, p.y, {}, depthOf(n.tx, n.ty));
        this.hud.toast("劫云压在头顶。退路还在，你没有把后路赌死。真仙的门槛，只望见一角。");
      } else if (n.id.startsWith("travel:")) {
        const dest = n.id.slice(7);
        this.state.discover(dest);
        this.travel(dest);
      }
    }
  }

  enterSpringChamber() {
    const p = iso(this.player.tx, this.player.ty);
    this.fx.play("water/ripples", p.x, p.y, {}, depthOf(this.player.tx, this.player.ty));
    this.fx.play("arcane/rune-circle", p.x, p.y, {}, depthOf(this.player.tx, this.player.ty));
    const msg = this.state.awakenSpring();
    this.hud.showDialog("废弃青泉石室", "无言", [msg], [{ label: "爬出去", fn: () => {} }]);
  }

  talk(id: string) {
    const npc = NPC_MAP[id];
    if (!npc) return;
    const story = this.storyLine(id);
    const msgs = this.state.questTalk(id);
    const lines = story ? [story] : (msgs.length ? msgs : [this.pickLine(npc.lines, id)]);
    const opts: { label: string; fn: () => void }[] = [{ label: "告辞", fn: () => {} }];
    if (npc.role === "vendor" || npc.shop) opts.unshift({ label: "买卖", fn: () => this.hud.open("shop", { shop: npc.shop ?? [] }) });
    if (npc.role === "alchemist") opts.unshift({ label: "炼丹", fn: () => this.hud.open("craft", { mode: "cauldron" }) });
    if (npc.role === "smith") opts.unshift({ label: "炼器", fn: () => this.hud.open("craft", { mode: "furnace" }) });
    if (npc.role === "auction") opts.unshift({ label: "拍卖", fn: () => this.hud.open("auction") });
    if (npc.role === "sect" && npc.sect) {
      opts.unshift({ label: `拜入${SECT_NAME(npc.sect)}`, fn: () => this.hud.toast(this.state.joinSect(npc.sect!)) });
      if (npc.id === "sect_qingming") opts.unshift({ label: "讨教试剑", fn: () => this.duelBoss("boss_lengqing") });
    }
    if ((id === "situ_yan" || id === "chi_heng") && this.state.data.quests.some((q) => q.id === "main_07_leave" && (q.status === "active" || q.status === "offered"))) {
      const msg = this.state.markSectTrouble();
      opts.unshift({ label: "记下这桩祸事", fn: () => this.hud.toast(msg) });
    }
    for (const q of this.state.data.quests) {
      if (q.status === "offered") opts.unshift({ label: "听一听事务", fn: () => { this.hud.toast(this.state.acceptQuest(q.id)); } });
    }
    this.hud.showDialog(npc.name, npc.title, lines, opts);
  }

  storyLine(id: string): string | null {
    const name = this.state.data.name;
    const q = this.state.data.quests.find((x) => x.status === "active" || x.status === "offered" || x.status === "done");
    const active = this.state.data.quests.filter((x) => x.status === "active" || x.status === "done");
    const has = (qid: string, step?: number) => {
      const x = this.state.data.quests.find((qq) => qq.id === qid);
      if (!x) return false;
      if (x.status === "turned") return false;
      if (step === undefined) return x.status === "active" || x.status === "done" || x.status === "offered";
      if (x.status === "offered") return step === 0 && x.step === 0;
      return x.status === "active" && x.step === step;
    };
    void q; void active;
    if (id === "elder_qingsong") {
      if (has("main_01_village", 0) || has("main_01_village") && this.state.data.quests.find((x) => x.id === "main_01_village")?.status === "offered")
        return `${name}，你家中还要吃饭。我只教最粗浅的吐纳。先去采三株灵叶草换粮。能活，便是路。`;
      if (has("main_01_village", 2))
        return "药草能换几升粮。别把这点日子过成别人的传奇。山里最近不稳，脚步放轻些。";
      if (has("main_02_spring", 1))
        return "我替你测过了：灵根驳杂，修仙界会判你无缘。识海里那一缕泉音，只能在打坐时多挤出一滴精纯灵气。它改不了资质，也轰不开局面。可活着，仍然是路。";
      if (has("main_03_mine", 0))
        return "村后矿洞不宁。你若只是去送死，便不必去。活着走出来，才有资格去碰外门那道极窄的门槛。";
      if (has("main_03_mine") && this.state.data.quests.find((x) => x.id === "main_03_mine")?.status === "done")
        return "你还站着，这就够了。矿洞里那点灵石收好，外门看的是这条命，不是天赋。";
      if (has("main_06_zhuji", 0))
        return "筑基丹有了，残韵也积了些。闭关时把退路留好。几乎走火的人我见过，活下来的都不是最逞能的那个。";
      if (has("main_06_zhuji", 2))
        return "出关了。你仍是门里不起眼的人物。这就对了。别急着让人记住你的名字。";
      if (has("main_11_yuanying", 2))
        return "虚空尘、残韵、退路，你都没有赌死。元婴也好，未至也罢，路还长。凡人问道，本就该这样走。";
    }
    if (id === "lu_wanqing") {
      if (has("main_04_outer", 0))
        return `${name}，外门考核极严。你那点灵根能卡进线，已经是运气。我可等不及慢慢熬。杂役弟子就杂役，先活过今年。`;
      if (has("main_04_outer", 2))
        return "进了便是进了。别跟他们争第一，争到死局里没人替你收尸。我走前面，你走旁边，倒也省事。";
      if (has("main_05_trial", 3) || has("main_05_trial") && (this.state.data.quests.find((x) => x.id === "main_05_trial")?.step ?? -1) >= 3)
        return "你居然去捡别人放弃的残局……也罢。这块筑基辅药你比我更用得上。活着，比名次贵——这话我只说一次。";
    }
    if (id === "vendor_guxing") {
      if (has("main_08_market", 1))
        return "山门里讲规矩，坊市里讲退路。想在望海坊站稳，先学会用灵石和人情换路，别用性命去换面子。拍卖行你可以去看看行情。";
      if (has("main_08_market", 3))
        return "海外和禁地都有活路，也都有去无回的人。你若要走，把逃符和口粮备足。我只指路，不保你。";
      if (has("main_10_forbidden", 0))
        return "禁地劫云低垂。去之前把退路想好：遁符、丹药、不跟陌生人拼命。我只能把你送到路口。";
    }
    if (id === "wanderer_lei") {
      if (has("main_07_leave", 2))
        return "既已离宗，就别回头辩供状。岭上风大，先找一处能过夜的地方。望海坊的顾行还算讲人情。";
    }
    if (id === "guard_jin") {
      if (has("main_10_forbidden", 2) || has("main_10_forbidden") && this.state.data.quests.find((x) => x.id === "main_10_forbidden")?.status === "done")
        return "非高阶勿入。——天律。你既然已经站在这里，便把自己的退路再数一遍。";
      if (has("main_12_horizon", 1) || has("main_12_horizon") && this.state.data.flags.trib_seen)
        return "石面上还有一行小字：路在，即未完。你望见的只是真仙门槛的一角。凡人也能问道，而路才刚揭开。";
    }
    if (id === "situ_yan") {
      if (has("main_07_leave"))
        return "秘宝失踪，总要有人顶。杂役弟子，最适合写进供状。你不必辩。若还想活命，自己离开门墙。";
    }
    if (id === "chi_heng") {
      if (has("main_07_leave"))
        return "正道门墙容不下你，也别装清高。这桩祸事你逃不干净。滚去当散修吧。岭上的风，比门规实在。";
    }
    if (id === "alchemist_azhi" && has("side_herbs"))
      return "还是村里这点烟火气实在。草药交给我，给你换两枚凡丹。别饿着去爬山。";
    return null;
  }

  pickLine(lines: string[], id: string): string {
    const rng = new Rng(this.state.data.seed ^ id.length ^ Math.floor(this.state.data.playTime));
    return rng.pick(lines);
  }

  duelBoss(id: string) {
    const existing = this.actors.find((a) => a.enemyId === id && !a.dead);
    if (existing) { this.hud.toast("他已在场上。"); return; }
    this.spawnFrom({ kind: "boss", id, tx: this.player.tx + 2, ty: this.player.ty }, new Rng(1));
    this.hud.toast("冷青拔剑，要你拿出真章。");
  }

  travel(id: string) {
    if (!REGION_MAP[id]) { this.hud.toast("没有这条路。"); return; }
    this.state.discover(id);
    this.state.data.tileX = this.player.tx;
    this.state.data.tileY = this.player.ty;
    this.state.travelTo(id);
    if (id === "youming_forbidden") {
      this.state.data.flags.trib_seen = 1;
      this.state.questFlag("trib_seen");
    }
    this.loadRegion(id, true);
  }

  openChest(a: Actor) {
    const flag = "chest_" + a.id;
    if (this.state.data.flags[flag]) { this.hud.toast("箱中已空。"); return; }
    this.state.data.flags[flag] = 1;
    const p = iso(a.tx, a.ty);
    this.fx.play("pickups/chest-open", p.x, p.y, {}, depthOf(a.tx, a.ty));
    this.fx.play("pickups/loot-beam", p.x, p.y, {}, depthOf(a.tx, a.ty));
    const rng = this.state.rng(a.id);
    const loot = a.id.includes("canzhao")
      ? ["spirit_sword", "manual_yujian", "ore_cold", "heal_pill"]
      : ["iron_sword", "ling_ring", "ore_iron", "cinnabar", "heal_pill"];
    for (const id of loot) {
      if (rng.chance(0.7) || id.endsWith("pill") || id.startsWith("ore")) this.state.addItem(id, id.endsWith("pill") || id.startsWith("ore") ? rng.int(1, 3) : 1);
    }
    this.state.data.gold += rng.int(30, 80);
    this.hud.toast("宝箱大开，灵光一闪。");
    this.state.save();
  }

  // ----- combat -----
  castSlot(slot: number) {
    if (this.player.dead || this.hud.busy() || this.player.lock > 0) return;
    const id = this.state.data.skillBar[slot];
    if (!id) return;
    if (this.hud.skillCd[slot] > 0) return;
    const ls = this.state.knownSkill(id);
    if (!ls) return;
    const sk = this.state.skillView(ls);
    if (this.state.data.mp < sk.mp) { this.hud.toast("法力不足。"); return; }
    const target = this.pickTarget(sk.range);
    this.state.data.mp -= sk.mp;
    this.hud.skillCd[slot] = sk.cd;
    this.hud.skillCdMax[slot] = sk.cd;
    const act = actOf(sk.fx);
    const wind = act?.poses?.[0]?.[0] < 0 ? -act.poses[0][0] : 0.2;
    this.player.lock = wind + (act?.poses?.at(-1)?.[0] ?? sk.cd * 0.3) + 0.15;
    this.attack = { skill: sk, t: -wind, hit: false, target, origin: { x: this.player.tx, y: this.player.ty } };
    if (target) this.faceToward(this.player, target);
  }

  pickTarget(range: number): Actor | undefined {
    let best: Actor | undefined, d0 = range + 0.6;
    for (const a of this.actors) {
      if ((a.kind !== "enemy" && a.kind !== "boss") || a.dead) continue;
      const d = Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty);
      if (d < d0) { d0 = d; best = a; }
    }
    return best;
  }

  faceToward(a: Actor, b: Actor) {
    const p1 = iso(a.tx, a.ty), p2 = iso(b.tx, b.ty);
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 2 : 1;
    else a.dir = dy > 0 ? 0 : 3;
  }

  updateAttack(dt: number) {
    const at = this.attack;
    if (!at) return;
    at.t += dt;
    const act = actOf(at.skill.fx);
    const hitT = act?.hits?.[0]?.t ?? 0.08;
    if (at.t >= 0 && at.t - dt < 0) {
      const p = iso(this.player.tx, this.player.ty);
      const flip = this.player.dir === 1;
      this.fx.play(at.skill.fx, p.x, p.y, { flip, palette: at.skill.palette, seed: 1 + (this.state.data.uidCursor % 20) }, depthOf(this.player.tx, this.player.ty));
    }
    if (!at.hit && at.t >= hitT) {
      at.hit = true;
      const h = act?.hits?.[0];
      this.fx.hitStop(h?.stop ?? 0.1, h?.shake ?? 0.14, h?.amp ?? 2);
      if (at.skill.damage < 0) {
        this.state.data.hp = Math.min(this.state.data.maxHp, this.state.data.hp - at.skill.damage);
        this.player.hp = this.state.data.hp;
        this.popup(this.player, `+${-at.skill.damage}`, "#80f0c0");
        const p = iso(this.player.tx, this.player.ty);
        this.fx.play("holy/heal", p.x, p.y, {}, depthOf(this.player.tx, this.player.ty));
      } else {
        const targets = this.actors.filter((a) => (a.kind === "enemy" || a.kind === "boss") && !a.dead && Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty) <= at.skill.range + 0.8 + at.skill.radius);
        const list = at.target && !at.target.dead ? [at.target, ...targets.filter((t) => t !== at.target)] : targets;
        const used = at.skill.radius > 0.2 ? list : list.slice(0, 1);
        for (const t of used) this.hurt(t, at.skill.damage + this.player.atk, this.player, at.skill);
      }
    }
    const end = (act?.poses?.at(-1)?.[0] ?? 0.5) + 0.1;
    if (at.t > end) this.attack = undefined;
  }

  hurt(t: Actor, raw: number, from: Actor, skill?: ReturnType<GameState["skillView"]>) {
    const dmg = Math.max(1, Math.floor(raw - t.def * 0.5 + (this.state.rng("dmg").float(-1, 2))));
    t.hp -= dmg;
    t.flash = 1;
    t.aggro = true;
    this.popup(t, `${dmg}`, skill && (skill.damage ?? 0) > 20 ? "#ffe080" : "#f0e0e0");
    const p = iso(t.tx, t.ty);
    // knock lightly
    const dx = t.tx - from.tx, dy = t.ty - from.ty, L = Math.hypot(dx, dy) || 1;
    t.tx += (dx / L) * 0.25;
    t.ty += (dy / L) * 0.25;
    t.lock = 0.2;
    if (t.hp <= 0) this.kill(t, from);
  }

  kill(t: Actor, from: Actor) {
    t.dead = true;
    t.hp = 0;
    t.sprite.setAlpha(0.0);
    t.bar?.setVisible(false);
    const p = iso(t.tx, t.ty);
    this.fx.play("spawn/soul-rise", p.x, p.y, {}, depthOf(t.tx, t.ty));
    this.fx.play("pickups/loot-beam", p.x, p.y, {}, depthOf(t.tx, t.ty));
    if (t.kind === "enemy" || t.kind === "boss") {
      const def = ENEMY_MAP[t.enemyId ?? t.id];
      if (def) {
        this.state.gainExp(def.exp);
        this.state.gainLingqi(def.lingqi);
        this.state.data.gold += def.gold;
        this.state.questKill(def.id);
        const rng = this.state.rng("loot" + def.id + t.tx);
        for (const l of def.loot) {
          if (rng.chance(l.p)) this.state.addItem(l.id, rng.int(l.min ?? 1, l.max ?? 1));
        }
        this.fx.play("ui/coin-collect", p.x, p.y - 8);
        this.hud.toast(`${def.name}陨落，修为+${def.exp}`);
        if (def.boss) this.fx.play("holy/sunburst", p.x, p.y);
      }
    }
    this.state.save();
  }

  captureNear() {
    const w = this.actors.find((a) => (a.kind === "enemy" || a.kind === "boss") && !a.dead && Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty) < 2.2);
    if (!w) { this.hud.toast("附近没有可收服的目标。"); return; }
    const msg = this.state.tryCapture(w.enemyId ?? w.id, w.hp / w.maxHp);
    this.hud.toast(msg);
    if (msg.includes("收服了")) {
      w.dead = true;
      w.captured = true;
      w.sprite.setVisible(false);
      w.bar?.setVisible(false);
      this.ensurePetSprite();
    }
  }

  ensurePetSprite() {
    const pet = this.state.activePet();
    this.actors.filter((a) => a.kind === "pet").forEach((a) => { a.sprite.destroy(); a.dead = true; });
    this.actors = this.actors.filter((a) => a.kind !== "pet");
    if (!pet) return;
    const def = beastFromEnemy(pet.defId);
    const key = ensureChar(this.textures, "pet_" + pet.defId, def?.palette ?? [0x203020, 0x408060, 0xa0e0b0], { beast: true, horns: true });
    const p = iso(this.player.tx - 0.8, this.player.ty - 0.4);
    const sprite = this.add.image(p.x, p.y, `${key}_0_0`).setOrigin(0.5, 0.92);
    this.actors.push({
      kind: "pet", id: pet.defId, tx: this.player.tx - 0.8, ty: this.player.ty - 0.4, sprite,
      dir: 0, frame: 0, ft: 0, hp: pet.hp, maxHp: pet.maxHp, atk: pet.atk, def: pet.def,
      speed: 2.2, dead: false, flash: 0, lock: 0, cd: 0, aggro: false, name: pet.name,
    });
    const wp = iso(this.player.tx, this.player.ty);
    this.fx.play("spawn/spawn-portal", wp.x, wp.y, {}, depthOf(this.player.tx, this.player.ty));
  }

  updatePet(dt: number) {
    const petA = this.actors.find((a) => a.kind === "pet" && !a.dead);
    const owned = this.state.activePet();
    if (owned && !petA) this.ensurePetSprite();
    if (!owned && petA) { petA.sprite.destroy(); petA.dead = true; return; }
    if (!petA || !owned) return;
    const tx = this.player.tx - 0.7, ty = this.player.ty - 0.5;
    petA.tx += (tx - petA.tx) * Math.min(1, 4 * dt);
    petA.ty += (ty - petA.ty) * Math.min(1, 4 * dt);
    petA.ft += dt;
    if (petA.ft > 0.2) { petA.ft = 0; petA.frame ^= 1; }
    petA.cd -= dt;
    const foe = this.pickTarget(2.8);
    if (foe && petA.cd <= 0) {
      this.hurt(foe, petA.atk, petA);
      const p = iso(petA.tx, petA.ty);
      this.fx.play("melee/thrust", p.x, p.y, { flip: petA.dir === 1 }, depthOf(petA.tx, petA.ty));
      petA.cd = 1.4;
    }
  }

  updateAi(dt: number) {
    for (const a of this.actors) {
      if ((a.kind !== "enemy" && a.kind !== "boss") || a.dead || a.lock > 0) continue;
      const d = Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty);
      const def = ENEMY_MAP[a.enemyId ?? a.id];
      const aggroR = a.kind === "boss" ? 8 : 4.5;
      if (d < aggroR) a.aggro = true;
      a.cd -= dt;
      a.ft += dt;
      if (a.ft > 0.25) { a.ft = 0; a.frame ^= 1; }
      if (a.aggro && !this.player.dead) {
        this.faceToward(a, this.player);
        if (d > 1.2) {
          const vx = (this.player.tx - a.tx) / d, vy = (this.player.ty - a.ty) / d;
          this.tryMove(a, vx * a.speed * dt, vy * a.speed * dt);
        } else if (a.cd <= 0) {
          a.cd = 1.6;
          a.lock = 0.4;
          const p = iso(a.tx, a.ty);
          const sid = def?.skills[0] ?? "basic_slash";
          const sk = SKILL_MAP[sid];
          this.fx.play(sk?.fx ?? "melee/sword-slash", p.x, p.y, { flip: a.dir === 1 }, depthOf(a.tx, a.ty));
          this.time.delayedCall(120, () => {
            if (!a.dead && !this.player.dead && Math.hypot(a.tx - this.player.tx, a.ty - this.player.ty) < 1.8) {
              const dmg = Math.max(1, a.atk - this.player.def * 0.4);
              this.player.hp -= dmg;
              this.state.data.hp = this.player.hp;
              this.player.flash = 1;
              this.popup(this.player, `${Math.floor(dmg)}`, "#f08080");
              this.fx.hitStop(0.06, 0.08, 1);
            }
          });
        }
      } else {
        // wander slightly
        if (a.cd <= 0) {
          a.cd = 1 + (a.tx * 3) % 2;
          const ang = ((a.tx * 13 + a.ty * 7) % 6);
          this.tryMove(a, Math.cos(ang) * a.speed * dt * 8, Math.sin(ang) * a.speed * dt * 8);
        }
      }
    }
  }

  popup(a: Actor, text: string, color: string) {
    const p = iso(a.tx, a.ty);
    const t = this.add.text(p.x, p.y - 26, text, { fontFamily: "monospace", fontSize: "10px", color }).setOrigin(0.5).setDepth(8000);
    this.floaters.push({ t, life: 0.8 });
  }

  updateFloats(dt: number) {
    for (const f of this.floaters) {
      f.life -= dt;
      f.t.y -= 20 * dt;
      f.t.setAlpha(Math.max(0, f.life / 0.8));
    }
    this.floaters = this.floaters.filter((f) => {
      if (f.life <= 0) { f.t.destroy(); return false; }
      return true;
    });
  }

  onPlayerDeath() {
    this.player.dead = true;
    this.hud.toast("你身受重创，灵气护住一缕神魂……");
    this.time.delayedCall(1400, () => {
      this.state.data.hp = Math.floor(this.state.data.maxHp * 0.6);
      this.state.data.region = "qingming_outskirts";
      this.state.data.tileX = 14;
      this.state.data.tileY = 18;
      this.player.dead = false;
      this.player.hp = this.state.data.hp;
      this.loadRegion("qingming_outskirts", true);
      this.hud.toast("醒来时，已在青冥村外。");
    });
  }
}

function SECT_NAME(id: string) {
  return ({ qingming: "青冥宗", lieyan: "烈焰谷", xuanshuang: "玄霜宫", xuejian: "血剑楼" } as any)[id] ?? id;
}
