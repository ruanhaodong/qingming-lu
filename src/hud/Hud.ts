import {
  FACTIONS,
  GRADES,
  ITEM_MAP,
  QUESTS,
  RECIPES,
  REGIONS,
  SECT_MAP,
  SECTS,
  SKILL_MAP,
  TREASURES,
  realmName,
  expToBreakthrough,
  itemName,
} from "../data";
import type { GameState } from "../state";
import { HEIGHT, WIDTH, type EquipSlot, type InvItem } from "../types";

export const FONT = '"Noto Sans CJK SC","Noto Sans SC","Source Han Sans SC","Microsoft YaHei",sans-serif';

export type PanelId =
  | "inv" | "cult" | "skill" | "beast" | "quest" | "map"
  | "auction" | "shop" | "craft" | "menu" | "help" | "sect" | null;

export class Hud {
  scene: Phaser.Scene;
  state: GameState;
  root: Phaser.GameObjects.Container;
  joyBase!: Phaser.GameObjects.Image;
  joyKnob!: Phaser.GameObjects.Image;
  joyVec = { x: 0, y: 0 };
  joyId: number | null = null;
  toasts: { t: Phaser.GameObjects.Text; life: number }[] = [];
  banner?: Phaser.GameObjects.Text;
  bannerLife = 0;
  panel: PanelId = null;
  panelRoot?: Phaser.GameObjects.Container;
  dialogRoot?: Phaser.GameObjects.Container;
  hpBar!: Phaser.GameObjects.Rectangle;
  mpBar!: Phaser.GameObjects.Rectangle;
  lqBar!: Phaser.GameObjects.Rectangle;
  expBar!: Phaser.GameObjects.Rectangle;
  hpText!: Phaser.GameObjects.Text;
  realmText!: Phaser.GameObjects.Text;
  goldText!: Phaser.GameObjects.Text;
  evText!: Phaser.GameObjects.Text;
  promptText!: Phaser.GameObjects.Text;
  slotCds: Phaser.GameObjects.Rectangle[] = [];
  slotLabels: Phaser.GameObjects.Text[] = [];
  skillCd: number[] = [0, 0, 0, 0];
  skillCdMax: number[] = [1, 1, 1, 1];
  onCast: (slot: number) => void = () => {};
  onInteract: () => void = () => {};
  onCapture: () => void = () => {};
  onTravel: (id: string) => void = () => {};
  onMeditate: (on: boolean) => void = () => {};
  meditating = false;
  selectedSkill: string[] = [];
  shopIds: string[] = [];
  craftMode: "cauldron" | "furnace" = "cauldron";
  listPage = 0;
  prompt = "";

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    this.root = scene.add.container(0, 0).setDepth(12000).setScrollFactor(0);
    this.buildChrome();
  }

  txt(x: number, y: number, s: string, size = 10, color = "#e8f8f0", opt: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    return this.scene.add.text(x, y, s, {
      fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2, ...opt,
    }).setScrollFactor(0);
  }

  private buildChrome() {
    const s = this.scene, st = this.state;
    // top-left bars
    const bg = s.add.rectangle(4, 4, 210, 52, 0x0a1210, 0.72).setOrigin(0, 0).setScrollFactor(0).setStrokeStyle(1, 0x3a6a50, 0.8);
    this.root.add(bg);
    this.realmText = this.txt(8, 6, "", 10, "#b8e0c8");
    this.hpBar = s.add.rectangle(58, 22, 140, 6, 0xc04040).setOrigin(0, 0.5).setScrollFactor(0);
    this.mpBar = s.add.rectangle(58, 30, 140, 6, 0x4080c0).setOrigin(0, 0.5).setScrollFactor(0);
    this.lqBar = s.add.rectangle(58, 38, 140, 6, 0x40c090).setOrigin(0, 0.5).setScrollFactor(0);
    this.expBar = s.add.rectangle(58, 46, 140, 3, 0xd0c060).setOrigin(0, 0.5).setScrollFactor(0);
    this.root.add(s.add.rectangle(58, 22, 140, 6, 0x201010).setOrigin(0, 0.5).setScrollFactor(0));
    this.root.add(s.add.rectangle(58, 30, 140, 6, 0x101820).setOrigin(0, 0.5).setScrollFactor(0));
    this.root.add(s.add.rectangle(58, 38, 140, 6, 0x102018).setOrigin(0, 0.5).setScrollFactor(0));
    this.root.add(s.add.rectangle(58, 46, 140, 3, 0x201800).setOrigin(0, 0.5).setScrollFactor(0));
    this.root.add([this.hpBar, this.mpBar, this.lqBar, this.expBar]);
    this.root.add(this.txt(8, 18, "气血", 8, "#d08080"));
    this.root.add(this.txt(8, 26, "法力", 8, "#80b0d0"));
    this.root.add(this.txt(8, 34, "灵气", 8, "#80d0b0"));
    this.hpText = this.txt(8, 42, "", 8, "#c8d8c8");
    this.goldText = this.txt(WIDTH - 140, 6, "", 10, "#e8d080");
    this.evText = this.txt(WIDTH / 2, 8, "", 10, "#f0e0a0").setOrigin(0.5, 0);
    this.promptText = this.txt(WIDTH / 2, HEIGHT - 86, "", 10, "#f0ffe8").setOrigin(0.5, 0);
    this.root.add([this.realmText, this.hpText, this.goldText, this.evText, this.promptText]);

    // menu buttons
    const menus: [string, PanelId, number][] = [
      ["背包", "inv", 0], ["修炼", "cult", 1], ["技能", "skill", 2],
      ["灵兽", "beast", 3], ["任务", "quest", 4], ["地图", "map", 5], ["菜单", "menu", 6],
    ];
    menus.forEach(([label, id], i) => {
      const x = WIDTH - 52, y = 22 + i * 18;
      this.btn(this.root, x, y, 48, 16, label, () => this.toggle(id), 9);
    });

    // joystick
    this.joyBase = s.add.image(52, HEIGHT - 52, "ui_joy_base").setScrollFactor(0).setDepth(12001).setAlpha(0.9).setInteractive();
    this.joyKnob = s.add.image(52, HEIGHT - 52, "ui_joy_knob").setScrollFactor(0).setDepth(12002);
    this.root.add([this.joyBase, this.joyKnob]);
    this.joyBase.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.joyId = p.id;
      this.nudgeJoy(p);
    });
    s.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.joyId === p.id) this.nudgeJoy(p);
    });
    s.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (this.joyId === p.id) {
        this.joyId = null;
        this.joyVec.x = 0; this.joyVec.y = 0;
        this.joyKnob.setPosition(52, HEIGHT - 52);
      }
    });

    // skill slots
    for (let i = 0; i < 4; i++) {
      const x = WIDTH - 30 - (3 - i) * 34, y = HEIGHT - 28;
      const slot = s.add.image(x, y, "ui_slot").setScrollFactor(0).setInteractive();
      const lab = this.txt(x, y, String(i + 1), 9, "#e8fff0").setOrigin(0.5);
      const cd = s.add.rectangle(x, y, 26, 26, 0x000000, 0.45).setScrollFactor(0).setVisible(false);
      slot.on("pointerdown", () => this.onCast(i));
      this.slotLabels.push(lab);
      this.slotCds.push(cd);
      this.root.add([slot, cd, lab]);
    }
    this.btn(this.root, WIDTH - 30, HEIGHT - 62, 32, 16, "交互", () => this.onInteract(), 8);
    this.btn(this.root, WIDTH - 66, HEIGHT - 62, 32, 16, "收服", () => this.onCapture(), 8);
  }

  btn(parent: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, label: string, fn: () => void, size = 10, color = 0x1c2c24) {
    const r = this.scene.add.rectangle(x, y, w, h, color, 0.92).setStrokeStyle(1, 0x6ab090).setScrollFactor(0).setInteractive();
    const t = this.txt(x, y, label, size, "#e8f8f0").setOrigin(0.5);
    r.on("pointerdown", (p: Phaser.Input.Pointer, _lx: number, _ly: number, ev?: any) => {
      ev?.stopPropagation?.();
      fn();
    });
    r.on("pointerover", () => r.setFillStyle(0x2a4a38, 0.95));
    r.on("pointerout", () => r.setFillStyle(color, 0.92));
    parent.add([r, t]);
    return r;
  }

  private nudgeJoy(p: Phaser.Input.Pointer) {
    const cx = 52, cy = HEIGHT - 52;
    let dx = p.x - cx, dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const max = 26;
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    this.joyKnob.setPosition(cx + dx, cy + dy);
    this.joyVec.x = dx / max;
    this.joyVec.y = dy / max;
  }

  moveVec(): { x: number; y: number } {
    return this.joyVec;
  }

  toggle(id: PanelId) {
    if (this.panel === id) this.closePanel();
    else this.open(id);
  }

  open(id: PanelId, extra?: any) {
    this.closePanel();
    this.panel = id;
    this.listPage = 0;
    this.selectedSkill = [];
    if (id === "shop" && extra?.shop) this.shopIds = extra.shop;
    if (id === "craft" && extra?.mode) this.craftMode = extra.mode;
    this.drawPanel();
  }

  closePanel() {
    this.panelRoot?.destroy(true);
    this.panelRoot = undefined;
    this.panel = null;
    this.meditating = false;
    this.onMeditate(false);
  }

  closeDialog() {
    this.dialogRoot?.destroy(true);
    this.dialogRoot = undefined;
  }

  busy(): boolean {
    return !!this.panel || !!this.dialogRoot;
  }

  toast(msg: string) {
    const t = this.txt(WIDTH / 2, HEIGHT / 2 - 40 - this.toasts.length * 14, msg, 11, "#fff8d0").setOrigin(0.5).setDepth(13000);
    t.setStroke("#102018", 3);
    this.root.add(t);
    this.toasts.push({ t, life: 2.6 });
  }

  showBanner(msg: string) {
    this.banner?.destroy();
    this.banner = this.txt(WIDTH / 2, 58, msg, 12, "#ffe8a0").setOrigin(0.5, 0);
    this.banner.setStroke("#201808", 4);
    this.root.add(this.banner);
    this.bannerLife = 5;
  }

  setPrompt(s: string) {
    this.prompt = s;
  }

  showDialog(name: string, title: string, lines: string[], options: { label: string; fn: () => void }[]) {
    this.closeDialog();
    const c = this.scene.add.container(0, 0).setDepth(12500).setScrollFactor(0);
    this.dialogRoot = c;
    const box = this.scene.add.rectangle(WIDTH / 2, HEIGHT - 70, 500, 96, 0x0e1612, 0.92).setStrokeStyle(1, 0x80c0a0).setScrollFactor(0);
    c.add(box);
    c.add(this.txt(30, HEIGHT - 114, `${name} · ${title}`, 11, "#c0e8d0"));
    const text = this.txt(30, HEIGHT - 98, lines[0] ?? "", 11, "#e8f8f0", { wordWrap: { width: 480 } });
    c.add(text);
    options.forEach((op, i) => {
      this.btn(c, 80 + i * 110, HEIGHT - 32, 100, 16, op.label, () => {
        this.closeDialog();
        op.fn();
      }, 9);
    });
    this.btn(c, WIDTH - 40, HEIGHT - 114, 40, 14, "关闭", () => this.closeDialog(), 8);
  }

  update(dt: number) {
    const d = this.state.data;
    const need = expToBreakthrough(d.realm, d.stage);
    this.realmText.setText(`${d.name}  ${realmName(d.realm, d.stage)}`);
    this.hpBar.scaleX = Math.max(0, d.hp / Math.max(1, d.maxHp));
    this.mpBar.scaleX = Math.max(0, d.mp / Math.max(1, d.maxMp));
    this.lqBar.scaleX = Math.max(0, d.lingqi / Math.max(1, d.maxLingqi));
    this.expBar.scaleX = Math.max(0, Math.min(1, d.exp / need));
    this.hpText.setText(`${Math.floor(d.hp)}/${d.maxHp}`);
    this.goldText.setText(`钱 ${d.gold}   ${this.state.factionName()}${d.sect ? " · " + SECT_MAP[d.sect].name : ""}`);
    const ev = d.event;
    this.evText.setText(ev ? `异象：${ev.id === "lingqi_leak" ? "灵气潮漏" : ev.id === "secret_open" ? "秘境开启" : ev.id === "beast_tide" ? "魔兽潮" : ev.id === "sanxiu_duel" ? "散修斗法" : ev.id === "auction_rare" ? "拍卖奇珍" : ev.id === "trib_clouds" ? "劫云压顶" : ev.id}  ${Math.ceil(ev.t)}秒` : (this.state.isNight() ? "夜" : "昼"));
    this.promptText.setText(this.prompt);
    for (let i = 0; i < 4; i++) {
      const id = d.skillBar[i];
      const sk = id ? this.state.skillView(this.state.knownSkill(id) ?? { id, source: "学习" }) : null;
      this.slotLabels[i].setText(sk ? sk.name.slice(0, 2) : String(i + 1));
      const cd = this.skillCd[i];
      if (cd > 0) {
        this.skillCd[i] = Math.max(0, cd - dt);
        this.slotCds[i].setVisible(true).setScale(1, this.skillCd[i] / this.skillCdMax[i]);
      } else this.slotCds[i].setVisible(false);
    }
    for (const t of this.toasts) {
      t.life -= dt;
      t.t.y -= 8 * dt;
      t.t.setAlpha(Math.min(1, t.life));
    }
    this.toasts = this.toasts.filter((t) => {
      if (t.life <= 0) { t.t.destroy(); return false; }
      return true;
    });
    if (this.banner) {
      this.bannerLife -= dt;
      if (this.bannerLife <= 0) { this.banner.destroy(); this.banner = undefined; }
    }
    if (this.meditating) this.state.meditate(dt, false);
  }

  private drawPanel() {
    const c = this.scene.add.container(0, 0).setDepth(12200).setScrollFactor(0);
    this.panelRoot = c;
    const w = 420, h = 260, x = (WIDTH - w) / 2, y = (HEIGHT - h) / 2 - 8;
    c.add(this.scene.add.rectangle(WIDTH / 2, HEIGHT / 2, w, h, 0x0e1612, 0.94).setStrokeStyle(1, 0x80c0a0).setScrollFactor(0));
    this.btn(c, x + w - 18, y + 12, 28, 14, "关闭", () => this.closePanel(), 8);
    const title: Record<string, string> = {
      inv: "行囊", cult: "修炼", skill: "功法工坊", beast: "灵兽", quest: "任务",
      map: "大世界", auction: "拍卖行", shop: "交易", craft: this.craftMode === "furnace" ? "炼器" : "炼丹",
      menu: "菜单", help: "帮助", sect: "门派",
    };
    c.add(this.txt(x + 12, y + 8, title[this.panel!] ?? "", 13, "#c8f0d8"));
    const bodyY = y + 28;
    if (this.panel === "inv") this.drawInv(c, x, bodyY, w, h - 36);
    if (this.panel === "cult") this.drawCult(c, x, bodyY);
    if (this.panel === "skill") this.drawSkill(c, x, bodyY);
    if (this.panel === "beast") this.drawBeast(c, x, bodyY);
    if (this.panel === "quest") this.drawQuest(c, x, bodyY);
    if (this.panel === "map") this.drawMap(c, x, bodyY);
    if (this.panel === "auction") this.drawAuction(c, x, bodyY);
    if (this.panel === "shop") this.drawShop(c, x, bodyY);
    if (this.panel === "craft") this.drawCraft(c, x, bodyY);
    if (this.panel === "menu") this.drawMenu(c, x, bodyY);
    if (this.panel === "help") this.drawHelp(c, x, bodyY);
    if (this.panel === "sect") this.drawSect(c, x, bodyY);
  }

  private refresh() {
    const p = this.panel;
    const mode = this.craftMode;
    const shop = this.shopIds;
    this.closePanel();
    this.craftMode = mode;
    this.shopIds = shop;
    this.open(p);
  }

  private drawInv(c: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number) {
    const items = this.state.data.inventory;
    const start = this.listPage * 8;
    items.slice(start, start + 8).forEach((it, i) => {
      const def = ITEM_MAP[it.id];
      const eq = Object.values(this.state.data.equipped).includes(it.uid);
      const yy = y + 6 + i * 22;
      const label = `${eq ? "[装] " : ""}${def?.name ?? it.id}  ×${it.qty}  ${it.treasure ?? def?.treasure ?? ""} ${it.grade ?? def?.grade ?? ""}${it.plus ? " +" + it.plus : ""}`;
      c.add(this.txt(x + 14, yy, label, 10, eq ? "#e8d080" : "#e8f8f0"));
      this.btn(c, x + 300, yy + 6, 36, 14, def?.kind === "equip" ? "装备" : "使用", () => {
        this.toast(this.state.useItem(it.uid));
        this.refresh();
      }, 8);
      this.btn(c, x + 340, yy + 6, 28, 14, "卖", () => {
        this.toast(this.state.sell(it.uid));
        this.refresh();
      }, 8);
    });
    this.btn(c, x + 40, y + h - 18, 40, 14, "上页", () => { this.listPage = Math.max(0, this.listPage - 1); this.refresh(); }, 8);
    this.btn(c, x + 90, y + h - 18, 40, 14, "下页", () => { this.listPage++; this.refresh(); }, 8);
    c.add(this.txt(x + 14, y + h - 32, `共 ${items.length} 件`, 9, "#80a090"));
  }

  private drawCult(c: Phaser.GameObjects.Container, x: number, y: number) {
    const d = this.state.data;
    const need = expToBreakthrough(d.realm, d.stage);
    const can = this.state.canBreakthrough();
    c.add(this.txt(x + 16, y + 8, `境界  ${realmName(d.realm, d.stage)}`, 12));
    c.add(this.txt(x + 16, y + 28, `修为  ${Math.floor(d.exp)} / ${need}`, 11));
    c.add(this.txt(x + 16, y + 46, `灵气  ${Math.floor(d.lingqi)} / ${d.maxLingqi}`, 11));
    c.add(this.txt(x + 16, y + 64, `攻 ${this.state.atk()}  防 ${this.state.def()}  聚气 ×${this.state.lingqiRate().toFixed(2)}`, 11));
    c.add(this.txt(x + 16, y + 86, can.reason, 10, can.ok ? "#b0f0c0" : "#f0c0a0", { wordWrap: { width: 380 } }));
    this.btn(c, x + 80, y + 130, 80, 18, this.meditating ? "停止吐纳" : "盘膝吐纳", () => {
      this.meditating = !this.meditating;
      this.onMeditate(this.meditating);
      this.refresh();
    });
    this.btn(c, x + 180, y + 130, 80, 18, "冲击境界", () => {
      const r = this.state.breakthrough();
      this.toast(r.msg);
      this.refresh();
    }, 10, can.ok ? 0x2a4a20 : 0x2a2018);
  }

  private drawSkill(c: Phaser.GameObjects.Container, x: number, y: number) {
    c.add(this.txt(x + 16, y + 2, "点选两门已学技能可合成/自创。点拆分会把技能炼成材料。", 9, "#a0c0b0"));
    this.state.data.skills.forEach((ls, i) => {
      const sk = this.state.skillView(ls);
      const col = i % 2, row = Math.floor(i / 2);
      const xx = x + 16 + col * 200, yy = y + 20 + row * 28;
      const on = this.selectedSkill.includes(ls.id);
      this.btn(c, xx + 70, yy + 8, 140, 16, `${on ? "● " : ""}${sk.name}（${ls.source}）`, () => {
        if (this.selectedSkill.includes(ls.id)) this.selectedSkill = this.selectedSkill.filter((s) => s !== ls.id);
        else if (this.selectedSkill.length < 2) this.selectedSkill.push(ls.id);
        this.refresh();
      }, 8, on ? 0x3a5a28 : 0x1c2c24);
    });
    const yy = y + 200;
    this.btn(c, x + 50, yy, 60, 16, "拆分", () => {
      if (this.selectedSkill[0]) this.toast(this.state.splitSkill(this.selectedSkill[0]));
      this.selectedSkill = [];
      this.refresh();
    }, 9);
    this.btn(c, x + 120, yy, 80, 16, "合成/自创", () => {
      if (this.selectedSkill.length === 2) this.toast(this.state.mergeOrCreate(this.selectedSkill[0], this.selectedSkill[1]));
      else this.toast("请先点选两门技能。");
      this.selectedSkill = [];
      this.refresh();
    }, 9);
    this.state.data.skillBar.forEach((id, i) => {
      this.btn(c, x + 230 + i * 42, yy, 38, 16, `键${i + 1}`, () => {
        if (this.selectedSkill[0]) {
          this.state.data.skillBar[i] = this.selectedSkill[0];
          this.state.save();
          this.toast(`已将技能放到键${i + 1}`);
          this.refresh();
        }
      }, 8);
    });
  }

  private drawBeast(c: Phaser.GameObjects.Container, x: number, y: number) {
    if (!this.state.data.beasts.length) {
      c.add(this.txt(x + 16, y + 20, "尚未收服灵兽。将敌人削弱到三成以下，再用拘灵符。", 11, "#c0d8c8", { wordWrap: { width: 380 } }));
      return;
    }
    this.state.data.beasts.forEach((b, i) => {
      const yy = y + 8 + i * 24;
      c.add(this.txt(x + 16, yy, `${b.summoned ? "【出战】" : ""}${b.kind} ${b.name}  ${Math.floor(b.hp)}/${b.maxHp}`, 11));
      this.btn(c, x + 320, yy + 8, 48, 14, b.summoned ? "收回" : "召唤", () => {
        this.state.toggleSummon(b.uid);
        this.refresh();
      }, 8);
    });
  }

  private drawQuest(c: Phaser.GameObjects.Container, x: number, y: number) {
    const qs = this.state.activeQuests();
    if (!qs.length) c.add(this.txt(x + 16, y + 16, "暂无进行中的事。", 11));
    qs.forEach((q, i) => {
      const step = q.def.steps[Math.min(q.step, q.def.steps.length - 1)];
      const st = q.status === "done" ? "可复命" : q.status === "offered" ? "可接取" : q.status === "turned" ? "已完" : `${step.text} ${step.count ? q.progress + "/" + step.count : ""}`;
      c.add(this.txt(x + 16, y + 8 + i * 36, `${q.def.kind === "main" ? "主" : "支"} ${q.def.name}`, 11, "#e8d080"));
      c.add(this.txt(x + 16, y + 22 + i * 36, st, 10, "#c8e0d0", { wordWrap: { width: 380 } }));
      if (q.status === "offered") {
        this.btn(c, x + 340, y + 16 + i * 36, 36, 14, "接取", () => {
          this.toast(this.state.acceptQuest(q.id));
          this.refresh();
        }, 8);
      }
    });
  }

  private drawMap(c: Phaser.GameObjects.Container, x: number, y: number) {
    const world = REGIONS.filter((r) => !r.id.startsWith("dungeon_"));
    const pos: Record<string, [number, number]> = {
      qingming_outskirts: [x + 90, y + 70],
      cangyun_ridge: [x + 210, y + 50],
      canzhao_realm: [x + 300, y + 90],
      wanghai_market: [x + 160, y + 150],
      youming_forbidden: [x + 260, y + 20],
    };
    c.add(this.txt(x + 16, y + 4, "已发现的地域可点击前往。副本入口在区域内。", 9, "#a0c0b0"));
    world.forEach((r) => {
      const [px, py] = pos[r.id] ?? [x + 80, y + 80];
      const known = this.state.data.discovered.includes(r.id);
      const here = this.state.data.region === r.id;
      this.btn(c, px, py, 88, 18, here ? `【${r.name}】` : known ? r.name : "？？？", () => {
        if (!known) { this.toast("尚未踏足此地。"); return; }
        this.closePanel();
        this.onTravel(r.id);
      }, 9, here ? 0x3a5a28 : known ? 0x1c2c24 : 0x181818);
    });
  }

  private drawAuction(c: Phaser.GameObjects.Container, x: number, y: number) {
    if (!this.state.data.auction.length) {
      c.add(this.txt(x + 16, y + 16, "今日没有拍品。", 11));
      return;
    }
    this.state.data.auction.slice(0, 8).forEach((a, i) => {
      const def = ITEM_MAP[a.item.id];
      const yy = y + 6 + i * 22;
      c.add(this.txt(x + 12, yy, `${def?.name}  ${a.item.treasure ?? ""} 现价${a.bid} 一口${a.buyout}  ${Math.ceil(a.remain)}秒`, 9));
      this.btn(c, x + 310, yy + 6, 36, 14, "出价", () => { this.toast(this.state.bid(a.uid)); this.refresh(); }, 8);
      this.btn(c, x + 350, yy + 6, 36, 14, "买断", () => { this.toast(this.state.buyout(a.uid)); this.refresh(); }, 8);
    });
  }

  private drawShop(c: Phaser.GameObjects.Container, x: number, y: number) {
    this.shopIds.forEach((id, i) => {
      const def = ITEM_MAP[id];
      if (!def) return;
      const price = Math.max(1, Math.floor(def.value * this.state.priceMul()));
      const yy = y + 6 + i * 20;
      c.add(this.txt(x + 16, yy, `${def.name}  ${price}钱`, 10));
      this.btn(c, x + 320, yy + 6, 36, 14, "买", () => { this.toast(this.state.buy(id)); this.refresh(); }, 8);
    });
  }

  private drawCraft(c: Phaser.GameObjects.Container, x: number, y: number) {
    if (this.craftMode === "cauldron") {
      RECIPES.filter((r) => r.type === "alchemy").forEach((r, i) => {
        const ok = this.state.canCraft(r.id);
        const need = r.inputs.map((inp) => `${itemName(inp.id)}×${inp.qty}(有${this.state.countItem(inp.id)})`).join(" ");
        const yy = y + 4 + i * 24;
        c.add(this.txt(x + 14, yy, `${r.name}  ${need}`, 9, ok ? "#e8f8f0" : "#809080", { wordWrap: { width: 300 } }));
        this.btn(c, x + 340, yy + 8, 36, 14, "炼", () => { this.toast(this.state.brew(r.id)); this.refresh(); }, 8, ok ? 0x2a4a28 : 0x201818);
      });
    } else {
      c.add(this.txt(x + 16, y + 8, "选择一件装备升阶（消耗玄铁矿与丹砂；高级用寒髓石）。", 10, "#c0d8c8", { wordWrap: { width: 380 } }));
      const eqs = this.state.data.inventory.filter((i) => ITEM_MAP[i.id]?.kind === "equip");
      eqs.slice(0, 7).forEach((it, i) => {
        const def = ITEM_MAP[it.id];
        const yy = y + 32 + i * 22;
        c.add(this.txt(x + 14, yy, `${def.name} +${it.plus ?? 0} ${it.treasure}·${it.grade}`, 10));
        this.btn(c, x + 300, yy + 6, 36, 14, "炼", () => { this.toast(this.state.refine(it.uid, false)); this.refresh(); }, 8);
        this.btn(c, x + 344, yy + 6, 36, 14, "淬", () => { this.toast(this.state.refine(it.uid, true)); this.refresh(); }, 8);
      });
    }
  }

  private drawMenu(c: Phaser.GameObjects.Container, x: number, y: number) {
    c.add(this.txt(x + 16, y + 10, "自动存档于本地。刷新页面可继续。", 11));
    this.btn(c, x + 80, y + 50, 90, 18, "立即存档", () => { this.state.save(); this.toast("已记下此间因果。"); });
    this.btn(c, x + 180, y + 50, 90, 18, "操作说明", () => this.open("help"));
    this.btn(c, x + 80, y + 80, 90, 18, "返回标题", () => {
      this.state.save();
      this.scene.scene.start("TitleScene");
    });
  }

  private drawHelp(c: Phaser.GameObjects.Container, x: number, y: number) {
    const lines = [
      "移动：WASD / 方向键，或左下角摇杆（触屏）。",
      "技能：键盘 1-4 或右下角技能格。交互 / 收服在技能上方。",
      "E 或空格：交谈、采集、开门、开箱。F：对残血灵兽用拘灵符。",
      "B 背包  C 修炼  K 技能  M 地图  Q 任务  Esc 关闭。",
      "战斗遵循风压、释放、命中停顿与震屏。灵池附近吐纳更快。",
      "特效库 PixelFX（MIT，Patch / patch-gg/pixelfx）实时合成。",
    ];
    lines.forEach((l, i) => c.add(this.txt(x + 16, y + 8 + i * 22, l, 10, "#d0e8dc", { wordWrap: { width: 390 } })));
  }

  private drawSect(c: Phaser.GameObjects.Container, x: number, y: number) {
    SECTS.forEach((s, i) => {
      const yy = y + 8 + i * 40;
      c.add(this.txt(x + 16, yy, `${s.name}（${FACTIONS.find((f) => f.id === s.faction)?.name}）  ${s.motto}`, 11, "#e8d080"));
      c.add(this.txt(x + 16, yy + 14, s.desc, 9, "#c0d8c8", { wordWrap: { width: 300 } }));
      this.btn(c, x + 340, yy + 16, 40, 14, "拜入", () => { this.toast(this.state.joinSect(s.id)); this.refresh(); }, 8);
    });
  }
}

export function itemLabel(it: InvItem): string {
  const def = ITEM_MAP[it.id];
  return `${def?.name ?? it.id}${it.plus ? " +" + it.plus : ""}`;
}
