import {
  FACTIONS,
  GRADES,
  GRADE_COLOR,
  ITEM_MAP,
  QUESTS,
  REALMS,
  RECIPES,
  REGIONS,
  SECT_MAP,
  SECTS,
  SKILL_MAP,
  TREASURE_COLOR,
  realmName,
  expToBreakthrough,
  itemName,
} from "../data";
import type { GameState } from "../state";
import { HEIGHT, WIDTH, type EquipSlot, type GradeId, type InvItem, type TreasureKind } from "../types";

export const FONT = '"Fusion Pixel 12", "Fusion Pixel 10", monospace';
export const FONT_SM = '"Fusion Pixel 10", "Fusion Pixel 12", monospace';

export type PanelId =
  | "inv" | "cult" | "skill" | "beast" | "quest" | "map"
  | "auction" | "shop" | "craft" | "menu" | "help" | "sect" | null;

const GRADE_HEX: Record<string, number> = { ...GRADE_COLOR, 凡品: 0xb0b8b0 };
const ELEM_COL: Record<string, string> = {
  melee: "#d0d0b0", sword: "#8cf0c8", fire: "#f08040", ice: "#80d8f0",
  lightning: "#f0e080", wood: "#80d070", shadow: "#c080e0", holy: "#f0e8c0",
  water: "#70c0e0", earth: "#c0a070",
};
const ELEM_NAME: Record<string, string> = {
  melee: "近战", sword: "剑", fire: "火", ice: "冰", lightning: "雷",
  wood: "木", shadow: "影", holy: "雷罚", water: "水", earth: "土",
};
function elemName(e: string) { return ELEM_NAME[e] ?? e; }

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
  selInv = "";
  selQuest = "";
  selAuction = "";
  selRecipe = "";
  selBeast = "";
  selShop = "";
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

  txt(x: number, y: number, s: string, size = 12, color = "#e8f8f0", opt: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    const family = size <= 10 ? FONT_SM : FONT;
    const snapped = size <= 10 ? 10 : size <= 14 ? 12 : size <= 20 ? 12 : size <= 28 ? 24 : 36;
    return this.scene.add.text(x, y, s, {
      fontFamily: family, fontSize: `${size <= 14 ? (size <= 10 ? 10 : 12) : snapped}px`, color,
      resolution: 1, ...opt,
    }).setScrollFactor(0);
  }

  private buildChrome() {
    const s = this.scene;
    const bg = s.add.rectangle(4, 4, 216, 56, 0x0a1210, 0.82).setOrigin(0, 0).setScrollFactor(0).setStrokeStyle(1, 0x6ab090, 0.9);
    this.root.add(bg);
    // inner tick corners
    this.root.add(s.add.rectangle(6, 6, 3, 1, 0x80c0a0).setOrigin(0, 0).setScrollFactor(0));
    this.root.add(s.add.rectangle(6, 6, 1, 3, 0x80c0a0).setOrigin(0, 0).setScrollFactor(0));
    this.realmText = this.txt(10, 6, "", 12, "#b8e0c8");
    this.root.add(s.add.rectangle(62, 24, 144, 6, 0x201010).setOrigin(0, 0.5).setScrollFactor(0));
    this.root.add(s.add.rectangle(62, 32, 144, 6, 0x101820).setOrigin(0, 0.5).setScrollFactor(0));
    this.root.add(s.add.rectangle(62, 40, 144, 6, 0x102018).setOrigin(0, 0.5).setScrollFactor(0));
    this.root.add(s.add.rectangle(62, 48, 144, 3, 0x201800).setOrigin(0, 0.5).setScrollFactor(0));
    this.hpBar = s.add.rectangle(62, 24, 144, 6, 0xc04040).setOrigin(0, 0.5).setScrollFactor(0);
    this.mpBar = s.add.rectangle(62, 32, 144, 6, 0x4080c0).setOrigin(0, 0.5).setScrollFactor(0);
    this.lqBar = s.add.rectangle(62, 40, 144, 6, 0x40c090).setOrigin(0, 0.5).setScrollFactor(0);
    this.expBar = s.add.rectangle(62, 48, 144, 3, 0xd0c060).setOrigin(0, 0.5).setScrollFactor(0);
    this.root.add([this.hpBar, this.mpBar, this.lqBar, this.expBar]);
    this.root.add(this.txt(10, 20, "气血", 10, "#d08080"));
    this.root.add(this.txt(10, 28, "法力", 10, "#80b0d0"));
    this.root.add(this.txt(10, 36, "灵气", 10, "#80d0b0"));
    this.hpText = this.txt(10, 44, "", 10, "#c8d8c8");
    this.goldText = this.txt(WIDTH - 150, 6, "", 10, "#e8d080");
    this.evText = this.txt(WIDTH / 2, 8, "", 10, "#f0e0a0").setOrigin(0.5, 0);
    this.promptText = this.txt(WIDTH / 2, HEIGHT - 90, "", 10, "#f0ffe8").setOrigin(0.5, 0);
    this.root.add([this.realmText, this.hpText, this.goldText, this.evText, this.promptText]);

    const menus: [string, PanelId][] = [
      ["背包", "inv"], ["修炼", "cult"], ["技能", "skill"],
      ["灵兽", "beast"], ["任务", "quest"], ["地图", "map"], ["菜单", "menu"],
    ];
    menus.forEach(([label, id], i) => {
      const x = WIDTH - 54, y = 24 + i * 20;
      this.btn(this.root, x, y, 50, 18, label, () => this.toggle(id), 10);
    });

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

    for (let i = 0; i < 4; i++) {
      const x = WIDTH - 30 - (3 - i) * 34, y = HEIGHT - 28;
      const slot = s.add.image(x, y, "ui_slot").setScrollFactor(0).setInteractive();
      const lab = this.txt(x, y, String(i + 1), 10, "#e8fff0").setOrigin(0.5);
      const cd = s.add.rectangle(x, y, 26, 26, 0x000000, 0.45).setScrollFactor(0).setVisible(false);
      slot.on("pointerdown", () => this.onCast(i));
      this.slotLabels.push(lab);
      this.slotCds.push(cd);
      this.root.add([slot, cd, lab]);
    }
    this.btn(this.root, WIDTH - 30, HEIGHT - 64, 36, 16, "交互", () => this.onInteract(), 10);
    this.btn(this.root, WIDTH - 70, HEIGHT - 64, 36, 16, "收服", () => this.onCapture(), 10);
  }

  btn(parent: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, label: string, fn: () => void, size = 10, color = 0x1c2c24) {
    const r = this.scene.add.rectangle(x, y, w, h, color, 0.94).setStrokeStyle(1, 0x6ab090).setScrollFactor(0).setInteractive();
    const t = this.txt(x, y, label, size, "#e8f8f0").setOrigin(0.5);
    r.on("pointerdown", (p: Phaser.Input.Pointer, _lx: number, _ly: number, ev?: any) => {
      ev?.stopPropagation?.();
      fn();
    });
    r.on("pointerover", () => r.setFillStyle(0x2a4a38, 0.96));
    r.on("pointerout", () => r.setFillStyle(color, 0.94));
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

  open(id: PanelId, extra?: any, keep = false) {
    this.closePanel(keep);
    this.panel = id;
    if (!keep) {
      this.listPage = 0;
      this.selectedSkill = [];
    }
    if (id === "shop" && extra?.shop) this.shopIds = extra.shop;
    if (id === "craft" && extra?.mode) this.craftMode = extra.mode;
    this.drawPanel();
  }

  closePanel(keep = false) {
    this.panelRoot?.destroy(true);
    this.panelRoot = undefined;
    this.panel = null;
    if (!keep) {
      this.meditating = false;
      this.onMeditate(false);
    }
  }

  closeDialog() {
    this.dialogRoot?.destroy(true);
    this.dialogRoot = undefined;
  }

  busy(): boolean {
    return !!this.panel || !!this.dialogRoot;
  }

  toast(msg: string) {
    const t = this.txt(WIDTH / 2, HEIGHT / 2 - 40 - this.toasts.length * 14, msg, 12, "#fff8d0").setOrigin(0.5).setDepth(13000);
    t.setStroke("#102018", 2);
    this.root.add(t);
    this.toasts.push({ t, life: 2.6 });
  }

  showBanner(msg: string) {
    this.banner?.destroy();
    this.banner = this.txt(WIDTH / 2, 62, msg, 12, "#ffe8a0").setOrigin(0.5, 0);
    this.banner.setStroke("#201808", 2);
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
    const box = this.scene.add.rectangle(WIDTH / 2, HEIGHT - 72, 520, 104, 0x0e1612, 0.94).setStrokeStyle(1, 0x80c0a0).setScrollFactor(0);
    c.add(box);
    c.add(this.scene.add.rectangle(WIDTH / 2, HEIGHT - 114, 516, 18, 0x1a2a22, 0.95).setScrollFactor(0));
    c.add(this.txt(24, HEIGHT - 122, `${name} · ${title}`, 12, "#c0e8d0"));
    const text = this.txt(24, HEIGHT - 100, lines[0] ?? "", 12, "#e8f8f0", { wordWrap: { width: 500 } });
    c.add(text);
    options.forEach((op, i) => {
      this.btn(c, 70 + i * 120, HEIGHT - 32, 108, 18, op.label, () => {
        this.closeDialog();
        op.fn();
      }, 10);
    });
    this.btn(c, WIDTH - 36, HEIGHT - 114, 44, 16, "关闭", () => this.closeDialog(), 10);
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

  private frame(c: Phaser.GameObjects.Container, w: number, h: number, title: string) {
    const s = this.scene;
    const cx = WIDTH / 2, cy = HEIGHT / 2;
    c.add(s.add.rectangle(cx + 2, cy + 2, w, h, 0x050807, 0.5).setScrollFactor(0));
    c.add(s.add.rectangle(cx, cy, w, h, 0x0e1612, 0.96).setStrokeStyle(1, 0x80c0a0).setScrollFactor(0));
    c.add(s.add.rectangle(cx, cy, w - 8, h - 8, 0x121c16, 0.15).setStrokeStyle(1, 0x3a6a50, 0.7).setScrollFactor(0));
    const x = (WIDTH - w) / 2, y = (HEIGHT - h) / 2 - 4;
    // corner brackets
    const tick = (tx: number, ty: number, sx: number, sy: number) => {
      c.add(s.add.rectangle(tx, ty, 8, 1, 0xc0e8d0).setOrigin(sx < 0 ? 1 : 0, 0.5).setScrollFactor(0));
      c.add(s.add.rectangle(tx, ty, 1, 8, 0xc0e8d0).setOrigin(0.5, sy < 0 ? 1 : 0).setScrollFactor(0));
    };
    tick(x + 4, y + 4, 1, 1);
    tick(x + w - 4, y + 4, -1, 1);
    tick(x + 4, y + h - 4, 1, -1);
    tick(x + w - 4, y + h - 4, -1, -1);
    c.add(s.add.rectangle(cx, y + 16, w - 16, 18, 0x1a2a22, 0.9).setScrollFactor(0));
    c.add(this.txt(x + 16, y + 8, title, 12, "#c8f0d8"));
    this.btn(c, x + w - 24, y + 16, 36, 16, "关闭", () => this.closePanel(), 10);
    return { x, y, w, h, bodyY: y + 30 };
  }

  private rarityColor(it?: InvItem, fallback?: GradeId, treasure?: TreasureKind): number {
    if (it?.treasure || treasure) return TREASURE_COLOR[(it?.treasure ?? treasure)!] ?? 0x6ab090;
    const g = it?.grade ?? fallback;
    return (g && GRADE_HEX[g]) || 0x6ab090;
  }

  private iconOf(id: string, x: number, y: number, c: Phaser.GameObjects.Container) {
    const def = ITEM_MAP[id];
    const key = def?.icon ? "icon_" + def.icon : "icon_stone";
    const img = this.scene.add.image(x, y, this.scene.textures.exists(key) ? key : "icon_stone").setScrollFactor(0);
    c.add(img);
    return img;
  }

  private slot(c: Phaser.GameObjects.Container, x: number, y: number, size: number, border: number, selected: boolean, onClick: () => void) {
    const r = this.scene.add.rectangle(x, y, size, size, selected ? 0x2a4a28 : 0x121810, 0.95)
      .setStrokeStyle(1, selected ? 0xe8f8d0 : border).setScrollFactor(0).setInteractive();
    r.on("pointerdown", onClick);
    r.on("pointerover", () => r.setFillStyle(0x2a4a38, 0.96));
    r.on("pointerout", () => r.setFillStyle(selected ? 0x2a4a28 : 0x121810, 0.95));
    c.add(r);
    return r;
  }

  private drawPanel() {
    const c = this.scene.add.container(0, 0).setDepth(12200).setScrollFactor(0);
    this.panelRoot = c;
    const title: Record<string, string> = {
      inv: "行囊", cult: "修炼", skill: "功法工坊", beast: "灵兽", quest: "任务",
      map: "大世界", auction: "拍卖行", shop: "交易", craft: this.craftMode === "furnace" ? "炼器" : "炼丹",
      menu: "菜单", help: "帮助", sect: "门派",
    };
    const { x, y, w, h, bodyY } = this.frame(c, 520, 292, title[this.panel!] ?? "");
    if (this.panel === "inv") this.drawInv(c, x, bodyY, w, h - 36);
    if (this.panel === "cult") this.drawCult(c, x, bodyY, w);
    if (this.panel === "skill") this.drawSkill(c, x, bodyY, w);
    if (this.panel === "beast") this.drawBeast(c, x, bodyY, w);
    if (this.panel === "quest") this.drawQuest(c, x, bodyY, w);
    if (this.panel === "map") this.drawMap(c, x, bodyY, w);
    if (this.panel === "auction") this.drawAuction(c, x, bodyY, w);
    if (this.panel === "shop") this.drawShop(c, x, bodyY, w);
    if (this.panel === "craft") this.drawCraft(c, x, bodyY, w);
    if (this.panel === "menu") this.drawMenu(c, x, bodyY);
    if (this.panel === "help") this.drawHelp(c, x, bodyY);
    if (this.panel === "sect") this.drawSect(c, x, bodyY, w);
  }

  private refresh() {
    const p = this.panel;
    const mode = this.craftMode;
    const shop = this.shopIds;
    const keep = true;
    const med = this.meditating;
    this.closePanel(keep);
    this.craftMode = mode;
    this.shopIds = shop;
    this.meditating = med;
    this.open(p, undefined, true);
  }

  private detailPane(c: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number) {
    c.add(this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x0a1410, 0.9).setStrokeStyle(1, 0x3a6a50).setScrollFactor(0));
  }

  private itemStats(it: InvItem): string[] {
    const def = ITEM_MAP[it.id];
    const lines: string[] = [];
    const atk = (it.atk ?? def?.atk ?? 0); if (atk) lines.push(`攻 ${atk > 0 ? "+" : ""}${atk}`);
    const defn = (it.def ?? def?.def ?? 0); if (defn) lines.push(`防 ${defn > 0 ? "+" : ""}${defn}`);
    const hp = (it.hp ?? def?.hp ?? 0); if (hp) lines.push(`气血 ${hp > 0 ? "+" : ""}${hp}`);
    const mp = (it.mp ?? def?.mp ?? 0); if (mp) lines.push(`法力 ${mp > 0 ? "+" : ""}${mp}`);
    if (def?.lingqiRate) lines.push(`聚气 +${Math.round(def.lingqiRate * 100)}%`);
    if (def?.healHp) lines.push(`回复气血 ${def.healHp}`);
    if (def?.healMp) lines.push(`回复法力 ${def.healMp}`);
    if (def?.lingqi) lines.push(`灵气 +${def.lingqi}`);
    if (def?.cultivate) lines.push(`修为 +${def.cultivate}`);
    if (it.innateSkill || def?.innateSkill) {
      const sid = it.innateSkill ?? def?.innateSkill;
      lines.push(`携带：${SKILL_MAP[sid!]?.name ?? sid}`);
    }
    return lines;
  }

  private drawInv(c: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number) {
    const items = this.state.data.inventory;
    const slots: EquipSlot[] = ["weapon", "armor", "accessory", "artifact"];
    const slotName: Record<EquipSlot, string> = { weapon: "兵刃", armor: "衣甲", accessory: "配饰", artifact: "法器" };
    c.add(this.txt(x + 16, y + 2, "已装备", 10, "#80a090"));
    slots.forEach((sl, i) => {
      const uid = this.state.data.equipped[sl];
      const it = items.find((v) => v.uid === uid);
      const sx = x + 24 + i * 46, sy = y + 28;
      const col = it ? this.rarityColor(it) : 0x3a6a50;
      this.slot(c, sx, sy, 36, col, this.selInv === uid, () => {
        if (it) { this.selInv = it.uid; this.refresh(); }
      });
      c.add(this.txt(sx, sy - 20, slotName[sl], 10, "#80a090").setOrigin(0.5, 0));
      if (it) this.iconOf(it.id, sx, sy, c);
    });

    const gridY = y + 52;
    const per = 18;
    const start = this.listPage * per;
    const page = items.slice(start, start + per);
    if (!this.selInv && page[0]) this.selInv = page[0].uid;
    c.add(this.txt(x + 16, gridY - 2, "行囊格", 10, "#80a090"));
    page.forEach((it, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      const sx = x + 24 + col * 36, sy = gridY + 22 + row * 36;
      const eq = Object.values(this.state.data.equipped).includes(it.uid);
      this.slot(c, sx, sy, 32, this.rarityColor(it), this.selInv === it.uid, () => {
        this.selInv = it.uid; this.refresh();
      });
      this.iconOf(it.id, sx, sy, c);
      if (it.qty > 1) c.add(this.txt(sx + 10, sy + 6, String(it.qty), 10, "#f0f0d0").setOrigin(0.5, 0));
      if (eq) c.add(this.txt(sx - 12, sy - 14, "装", 10, "#e8d080"));
    });
    this.btn(c, x + 40, y + h - 16, 44, 16, "上页", () => { this.listPage = Math.max(0, this.listPage - 1); this.refresh(); }, 10);
    this.btn(c, x + 90, y + h - 16, 44, 16, "下页", () => { this.listPage++; this.refresh(); }, 10);
    c.add(this.txt(x + 120, y + h - 24, `${items.length} 件`, 10, "#80a090"));

    const dx = x + 250, dy = y + 8, dw = 250, dh = h - 28;
    this.detailPane(c, dx, dy, dw, dh);
    const it = items.find((v) => v.uid === this.selInv);
    if (!it) {
      c.add(this.txt(dx + 12, dy + 16, "点选一件物品查看详情。", 12, "#80a090"));
      return;
    }
    const def = ITEM_MAP[it.id];
    const grade = it.grade ?? def?.grade ?? "";
    const tre = it.treasure ?? def?.treasure ?? "";
    this.iconOf(it.id, dx + 24, dy + 24, c);
    c.add(this.txt(dx + 40, dy + 10, `${def?.name ?? it.id}${it.plus ? " +" + it.plus : ""}`, 12, "#e8f8f0"));
    c.add(this.txt(dx + 40, dy + 26, `${tre} · ${grade}    ×${it.qty}`, 10, "#" + this.rarityColor(it).toString(16).padStart(6, "0")));
    const stats = this.itemStats(it);
    c.add(this.txt(dx + 12, dy + 48, stats.join("　") || "无额外属性", 10, "#c8e0d0", { wordWrap: { width: dw - 24 } }));
    c.add(this.txt(dx + 12, dy + 80, def?.desc ?? "", 10, "#a0c0b0", { wordWrap: { width: dw - 24 } }));
    this.btn(c, dx + 50, dy + dh - 22, 64, 18, def?.kind === "equip" ? "装备" : "使用", () => {
      this.toast(this.state.useItem(it.uid));
      this.refresh();
    }, 10);
    this.btn(c, dx + 120, dy + dh - 22, 48, 18, "卖出", () => {
      this.toast(this.state.sell(it.uid));
      this.selInv = "";
      this.refresh();
    }, 10, 0x2a2018);
  }

  private drawCult(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    const d = this.state.data;
    const need = expToBreakthrough(d.realm, d.stage);
    const can = this.state.canBreakthrough();
    // realm path
    c.add(this.txt(x + 16, y + 4, "境界之路", 10, "#80a090"));
    REALMS.forEach((r, i) => {
      const rx = x + 32 + i * 48, ry = y + 36;
      const done = i < d.realm;
      const here = i === d.realm;
      const col = here ? 0x3a5a28 : done ? 0x1c2c24 : 0x141816;
      const stroke = here ? r.color : done ? 0x6ab090 : 0x2a3a32;
      c.add(this.scene.add.rectangle(rx, ry, 42, 22, col, 0.95).setStrokeStyle(1, stroke).setScrollFactor(0));
      c.add(this.txt(rx, ry, r.name, 10, here ? "#f0ffe8" : done ? "#c0e0d0" : "#607068").setOrigin(0.5));
      if (i < REALMS.length - 1) {
        c.add(this.scene.add.rectangle(rx + 24, ry, 8, 1, done || here ? 0x80c0a0 : 0x2a3a32).setScrollFactor(0));
      }
    });
    // stage pips
    const stages = ["前期", "中期", "后期", "圆满"];
    stages.forEach((name, i) => {
      const sx = x + 80 + i * 70, sy = y + 68;
      const on = i === d.stage;
      const passed = i < d.stage;
      c.add(this.scene.add.circle(sx - 22, sy + 6, 4, on ? 0xe8d080 : passed ? 0x6ab090 : 0x2a3a32).setScrollFactor(0));
      c.add(this.txt(sx - 14, sy, name, 10, on ? "#e8d080" : "#80a090"));
    });

    // bars + stats
    const bar = (lx: number, ly: number, label: string, v: number, max: number, col: number) => {
      c.add(this.txt(lx, ly - 2, label, 10, "#80a090"));
      c.add(this.scene.add.rectangle(lx + 50, ly + 6, 160, 8, 0x101410).setOrigin(0, 0.5).setStrokeStyle(1, 0x3a6a50).setScrollFactor(0));
      c.add(this.scene.add.rectangle(lx + 50, ly + 6, 160 * Math.max(0, Math.min(1, v / Math.max(1, max))), 8, col).setOrigin(0, 0.5).setScrollFactor(0));
      c.add(this.txt(lx + 216, ly - 2, `${Math.floor(v)} / ${Math.floor(max)}`, 10, "#c8e0d0"));
    };
    bar(x + 24, y + 100, "修为", d.exp, need, 0xd0c060);
    bar(x + 24, y + 124, "灵气", d.lingqi, d.maxLingqi, 0x40c090);

    c.add(this.txt(x + 24, y + 148, `攻 ${this.state.atk()}    防 ${this.state.def()}    聚气 ×${this.state.lingqiRate().toFixed(2)}`, 12, "#e8f8f0"));
    c.add(this.txt(x + 24, y + 172, can.reason, 10, can.ok ? "#b0f0c0" : "#f0c0a0", { wordWrap: { width: 470 } }));

    this.btn(c, x + 120, y + 220, 100, 22, this.meditating ? "停止吐纳" : "盘膝吐纳", () => {
      this.meditating = !this.meditating;
      this.onMeditate(this.meditating);
      this.refresh();
    }, 12);
    this.btn(c, x + 240, y + 220, 100, 22, "冲击境界", () => {
      const r = this.state.breakthrough();
      this.toast(r.msg);
      this.refresh();
    }, 12, can.ok ? 0x2a4a20 : 0x2a2018);
  }

  private drawSkill(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    c.add(this.txt(x + 16, y + 2, "点选功法查看。点两门可合成或自创；拆分炼为材料。", 10, "#80a090"));
    const list = this.state.data.skills;
    if (!this.selectedSkill.length && list[0]) this.selectedSkill = [list[0].id];
    const per = 6;
    const start = this.listPage * per;
    list.slice(start, start + per).forEach((ls, i) => {
      const sk = this.state.skillView(ls);
      const col = i % 2, row = Math.floor(i / 2);
      const cx = x + 16 + col * 150, cy = y + 28 + row * 50;
      const on = this.selectedSkill.includes(ls.id);
      const el = ELEM_COL[sk.element] ?? "#80c0a0";
      const card = this.scene.add.rectangle(cx + 70, cy + 18, 140, 44, on ? 0x2a4a28 : 0x141c18, 0.95)
        .setStrokeStyle(1, on ? 0xe8f8d0 : 0x3a6a50).setScrollFactor(0).setInteractive();
      card.on("pointerdown", () => {
        if (this.selectedSkill.includes(ls.id)) this.selectedSkill = this.selectedSkill.filter((s) => s !== ls.id);
        else if (this.selectedSkill.length < 2) this.selectedSkill.push(ls.id);
        else this.selectedSkill = [this.selectedSkill[1], ls.id];
        this.refresh();
      });
      c.add(card);
      c.add(this.txt(cx + 8, cy + 2, sk.name, 12, "#e8f8f0"));
      c.add(this.txt(cx + 8, cy + 18, `${elemName(sk.element)} · ${ls.source}   法力${sk.mp}  冷却${sk.cd}`, 10, el));
    });
    this.btn(c, x + 40, y + 186, 44, 16, "上页", () => { this.listPage = Math.max(0, this.listPage - 1); this.refresh(); }, 10);
    this.btn(c, x + 90, y + 186, 44, 16, "下页", () => { this.listPage++; this.refresh(); }, 10);

    const dx = x + 316, dy = y + 20, dw = 188, dh = 200;
    this.detailPane(c, dx, dy, dw, dh);
    const focus = this.selectedSkill[0] ? this.state.data.skills.find((s) => s.id === this.selectedSkill[0]) : undefined;
    if (focus) {
      const sk = this.state.skillView(focus);
      c.add(this.txt(dx + 10, dy + 8, sk.name, 12, "#e8f8f0"));
      c.add(this.txt(dx + 10, dy + 26, `${elemName(sk.element)} · ${focus.source}`, 10, ELEM_COL[sk.element] ?? "#80c0a0"));
      c.add(this.txt(dx + 10, dy + 44, `伤害 ${sk.damage}   法力 ${sk.mp}   冷却 ${sk.cd}`, 10, "#c8e0d0"));
      c.add(this.txt(dx + 10, dy + 64, sk.desc ?? "", 10, "#a0c0b0", { wordWrap: { width: dw - 20 } }));
      if (this.selectedSkill.length === 2) {
        const b = this.state.data.skills.find((s) => s.id === this.selectedSkill[1]);
        if (b) c.add(this.txt(dx + 10, dy + 110, `将与「${this.state.skillView(b).name}」合成`, 10, "#e8d080", { wordWrap: { width: dw - 20 } }));
      }
    } else {
      c.add(this.txt(dx + 10, dy + 16, "点选功法卡片。", 12, "#80a090"));
    }

    this.btn(c, x + 50, y + 220, 64, 18, "拆分", () => {
      if (this.selectedSkill[0]) this.toast(this.state.splitSkill(this.selectedSkill[0]));
      this.selectedSkill = [];
      this.refresh();
    }, 10);
    this.btn(c, x + 130, y + 220, 88, 18, "合成/自创", () => {
      if (this.selectedSkill.length === 2) this.toast(this.state.mergeOrCreate(this.selectedSkill[0], this.selectedSkill[1]));
      else this.toast("请先点选两门技能。");
      this.selectedSkill = [];
      this.refresh();
    }, 10);
    this.state.data.skillBar.forEach((id, i) => {
      this.btn(c, x + 260 + i * 50, y + 220, 44, 18, `键${i + 1}`, () => {
        if (this.selectedSkill[0]) {
          this.state.data.skillBar[i] = this.selectedSkill[0];
          this.state.save();
          this.toast(`已将技能放到键${i + 1}`);
          this.refresh();
        }
      }, 10);
    });
  }

  private drawBeast(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    if (!this.state.data.beasts.length) {
      c.add(this.txt(x + 24, y + 24, "尚未收服灵兽。", 12, "#c0d8c8"));
      c.add(this.txt(x + 24, y + 48, "将敌人削弱到三成以下，再用拘灵符。收服之后可在此召唤随行。", 12, "#80a090", { wordWrap: { width: 460 } }));
      return;
    }
    if (!this.selBeast) this.selBeast = this.state.data.beasts[0].uid;
    this.state.data.beasts.forEach((b, i) => {
      const yy = y + 12 + i * 44;
      const on = this.selBeast === b.uid;
      const card = this.scene.add.rectangle(x + 130, yy + 16, 240, 40, on ? 0x2a4a28 : 0x141c18, 0.95)
        .setStrokeStyle(1, on ? 0xe8f8d0 : 0x3a6a50).setScrollFactor(0).setInteractive();
      card.on("pointerdown", () => { this.selBeast = b.uid; this.refresh(); });
      c.add(card);
      c.add(this.txt(x + 20, yy + 2, `${b.summoned ? "【出战】" : ""}${b.name}`, 12, b.summoned ? "#e8d080" : "#e8f8f0"));
      c.add(this.txt(x + 20, yy + 18, `${b.kind}  气血 ${Math.floor(b.hp)}/${b.maxHp}  攻${b.atk} 防${b.def}`, 10, "#80a090"));
    });
    const b = this.state.data.beasts.find((v) => v.uid === this.selBeast);
    const dx = x + 300, dy = y + 12, dw = 200, dh = 200;
    this.detailPane(c, dx, dy, dw, dh);
    if (b) {
      c.add(this.txt(dx + 12, dy + 12, b.name, 12, "#e8f8f0"));
      c.add(this.txt(dx + 12, dy + 32, b.kind, 10, "#e8d080"));
      c.add(this.txt(dx + 12, dy + 52, `气血  ${Math.floor(b.hp)} / ${b.maxHp}`, 10, "#c8e0d0"));
      c.add(this.txt(dx + 12, dy + 70, `攻 ${b.atk}    防 ${b.def}`, 10, "#c8e0d0"));
      this.btn(c, dx + 70, dy + dh - 24, 80, 18, b.summoned ? "收回" : "召唤", () => {
        this.state.toggleSummon(b.uid);
        this.refresh();
      }, 10);
    }
  }

  private drawQuest(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    const qs = this.state.activeQuests();
    if (!qs.length) {
      c.add(this.txt(x + 20, y + 20, "暂无进行中的事。", 12, "#80a090"));
      return;
    }
    if (!this.selQuest || !qs.some((q) => q.id === this.selQuest)) this.selQuest = qs[0].id;
    qs.forEach((q, i) => {
      const yy = y + 8 + i * 36;
      const on = this.selQuest === q.id;
      const card = this.scene.add.rectangle(x + 130, yy + 14, 240, 32, on ? 0x2a4a28 : 0x141c18, 0.95)
        .setStrokeStyle(1, on ? 0xe8f8d0 : 0x3a6a50).setScrollFactor(0).setInteractive();
      card.on("pointerdown", () => { this.selQuest = q.id; this.refresh(); });
      c.add(card);
      c.add(this.txt(x + 20, yy + 2, `${q.def.kind === "main" ? "主" : "支"}  ${q.def.name}`, 12, q.def.kind === "main" ? "#e8d080" : "#c8e0d0"));
      const step = q.def.steps[Math.min(q.step, q.def.steps.length - 1)];
      const st = q.status === "done" ? "可复命" : q.status === "offered" ? "可接取" : q.status === "turned" ? "已完" : `${step.text}`;
      c.add(this.txt(x + 40, yy + 16, st.slice(0, 16), 10, "#80a090"));
    });
    const q = qs.find((v) => v.id === this.selQuest);
    const dx = x + 300, dy = y + 8, dw = 200, dh = 220;
    this.detailPane(c, dx, dy, dw, dh);
    if (q) {
      c.add(this.txt(dx + 12, dy + 10, q.def.name, 12, "#e8d080"));
      c.add(this.txt(dx + 12, dy + 30, q.def.kind === "main" ? "主线" : "支线", 10, "#80a090"));
      c.add(this.txt(dx + 12, dy + 50, q.def.desc, 10, "#c8e0d0", { wordWrap: { width: dw - 24 } }));
      const step = q.def.steps[Math.min(q.step, q.def.steps.length - 1)];
      const prog = step.count ? ` ${q.progress}/${step.count}` : "";
      c.add(this.txt(dx + 12, dy + 130, `当前：${step.text}${prog}`, 10, "#e8f8f0", { wordWrap: { width: dw - 24 } }));
      if (q.status === "offered") {
        this.btn(c, dx + 70, dy + dh - 24, 64, 18, "接取", () => {
          this.toast(this.state.acceptQuest(q.id));
          this.refresh();
        }, 10);
      }
    }
  }

  private drawMap(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    const world = REGIONS.filter((r) => !r.id.startsWith("dungeon_"));
    const pos: Record<string, [number, number]> = {
      qingming_outskirts: [x + 110, y + 90],
      cangyun_ridge: [x + 250, y + 70],
      canzhao_realm: [x + 380, y + 110],
      wanghai_market: [x + 200, y + 180],
      youming_forbidden: [x + 340, y + 40],
    };
    c.add(this.txt(x + 16, y + 4, "已发现的地域可点击前往。副本入口在区域内。", 10, "#80a090"));
    // paths
    const links: [string, string][] = [
      ["qingming_outskirts", "cangyun_ridge"],
      ["qingming_outskirts", "wanghai_market"],
      ["cangyun_ridge", "canzhao_realm"],
      ["cangyun_ridge", "youming_forbidden"],
      ["canzhao_realm", "wanghai_market"],
    ];
    const g = this.scene.add.graphics().setScrollFactor(0);
    g.lineStyle(1, 0x3a6a50, 0.85);
    for (const [a, b] of links) {
      const pa = pos[a], pb = pos[b];
      if (pa && pb) g.lineBetween(pa[0], pa[1], pb[0], pb[1]);
    }
    c.add(g);
    world.forEach((r) => {
      const [px, py] = pos[r.id] ?? [x + 80, y + 80];
      const known = this.state.data.discovered.includes(r.id);
      const here = this.state.data.region === r.id;
      this.btn(c, px, py, 100, 22, here ? `【${r.name}】` : known ? r.name : "？？？", () => {
        if (!known) { this.toast("尚未踏足此地。"); return; }
        this.closePanel();
        this.onTravel(r.id);
      }, 12, here ? 0x3a5a28 : known ? 0x1c2c24 : 0x181818);
    });
  }

  private drawAuction(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    if (!this.state.data.auction.length) {
      c.add(this.txt(x + 20, y + 20, "今日没有拍品。", 12, "#80a090"));
      return;
    }
    if (!this.selAuction) this.selAuction = this.state.data.auction[0].uid;
    this.state.data.auction.slice(0, 8).forEach((a, i) => {
      const def = ITEM_MAP[a.item.id];
      const yy = y + 8 + i * 26;
      const on = this.selAuction === a.uid;
      const row = this.scene.add.rectangle(x + 150, yy + 10, 280, 24, on ? 0x2a4a28 : 0x141c18, 0.95)
        .setStrokeStyle(1, on ? 0xe8f8d0 : this.rarityColor(a.item)).setScrollFactor(0).setInteractive();
      row.on("pointerdown", () => { this.selAuction = a.uid; this.refresh(); });
      c.add(row);
      this.iconOf(a.item.id, x + 24, yy + 10, c);
      c.add(this.txt(x + 38, yy + 2, `${def?.name ?? a.item.id}  ${a.item.treasure ?? ""}`, 10, "#e8f8f0"));
      c.add(this.txt(x + 200, yy + 2, `${a.bid} / ${a.buyout}  ${Math.ceil(a.remain)}秒`, 10, "#e8d080"));
    });
    const a = this.state.data.auction.find((v) => v.uid === this.selAuction);
    const dx = x + 310, dy = y + 8, dw = 190, dh = 220;
    this.detailPane(c, dx, dy, dw, dh);
    if (a) {
      const def = ITEM_MAP[a.item.id];
      this.iconOf(a.item.id, dx + 24, dy + 24, c);
      c.add(this.txt(dx + 40, dy + 10, def?.name ?? a.item.id, 12, "#e8f8f0"));
      c.add(this.txt(dx + 12, dy + 40, `${a.item.treasure ?? ""} · ${a.item.grade ?? def?.grade ?? ""}`, 10, "#e8d080"));
      c.add(this.txt(dx + 12, dy + 60, def?.desc ?? "", 10, "#a0c0b0", { wordWrap: { width: dw - 24 } }));
      c.add(this.txt(dx + 12, dy + 120, `现价 ${a.bid}    一口 ${a.buyout}`, 10, "#e8f8f0"));
      c.add(this.txt(dx + 12, dy + 138, `剩余 ${Math.ceil(a.remain)} 秒`, 10, "#80a090"));
      this.btn(c, dx + 50, dy + dh - 24, 52, 18, "出价", () => { this.toast(this.state.bid(a.uid)); this.refresh(); }, 10);
      this.btn(c, dx + 110, dy + dh - 24, 52, 18, "买断", () => { this.toast(this.state.buyout(a.uid)); this.refresh(); }, 10, 0x3a2c14);
    }
  }

  private drawShop(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    if (!this.selShop && this.shopIds[0]) this.selShop = this.shopIds[0];
    this.shopIds.forEach((id, i) => {
      const def = ITEM_MAP[id];
      if (!def) return;
      const price = Math.max(1, Math.floor(def.value * this.state.priceMul()));
      const yy = y + 8 + i * 26;
      const on = this.selShop === id;
      const row = this.scene.add.rectangle(x + 140, yy + 10, 260, 24, on ? 0x2a4a28 : 0x141c18, 0.95)
        .setStrokeStyle(1, on ? 0xe8f8d0 : 0x3a6a50).setScrollFactor(0).setInteractive();
      row.on("pointerdown", () => { this.selShop = id; this.refresh(); });
      c.add(row);
      this.iconOf(id, x + 24, yy + 10, c);
      c.add(this.txt(x + 38, yy + 2, `${def.name}    ${price}钱`, 12, "#e8f8f0"));
    });
    const def = this.selShop ? ITEM_MAP[this.selShop] : undefined;
    const dx = x + 310, dy = y + 8, dw = 190, dh = 220;
    this.detailPane(c, dx, dy, dw, dh);
    if (def && this.selShop) {
      const price = Math.max(1, Math.floor(def.value * this.state.priceMul()));
      this.iconOf(this.selShop, dx + 24, dy + 24, c);
      c.add(this.txt(dx + 40, dy + 10, def.name, 12, "#e8f8f0"));
      c.add(this.txt(dx + 12, dy + 40, def.desc, 10, "#a0c0b0", { wordWrap: { width: dw - 24 } }));
      c.add(this.txt(dx + 12, dy + 130, `售价 ${price} 钱`, 12, "#e8d080"));
      this.btn(c, dx + 70, dy + dh - 24, 64, 18, "买入", () => { this.toast(this.state.buy(this.selShop)); this.refresh(); }, 10);
    }
  }

  private drawCraft(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    if (this.craftMode === "cauldron") {
      const recs = RECIPES.filter((r) => r.type === "alchemy");
      if (!this.selRecipe && recs[0]) this.selRecipe = recs[0].id;
      recs.forEach((r, i) => {
        const ok = this.state.canCraft(r.id);
        const yy = y + 8 + i * 28;
        const on = this.selRecipe === r.id;
        const row = this.scene.add.rectangle(x + 140, yy + 10, 260, 26, on ? 0x2a4a28 : 0x141c18, 0.95)
          .setStrokeStyle(1, on ? 0xe8f8d0 : 0x3a6a50).setScrollFactor(0).setInteractive();
        row.on("pointerdown", () => { this.selRecipe = r.id; this.refresh(); });
        c.add(row);
        c.add(this.txt(x + 20, yy + 2, r.name, 12, ok ? "#e8f8f0" : "#809080"));
      });
      const r = recs.find((v) => v.id === this.selRecipe);
      const dx = x + 310, dy = y + 8, dw = 190, dh = 220;
      this.detailPane(c, dx, dy, dw, dh);
      if (r) {
        const ok = this.state.canCraft(r.id);
        c.add(this.txt(dx + 12, dy + 10, r.name, 12, "#e8f8f0"));
        c.add(this.txt(dx + 12, dy + 32, "所需材料", 10, "#80a090"));
        r.inputs.forEach((inp, i) => {
          const have = this.state.countItem(inp.id);
          const enough = have >= inp.qty;
          this.iconOf(inp.id, dx + 24, dy + 58 + i * 22, c);
          c.add(this.txt(dx + 40, dy + 50 + i * 22, `${itemName(inp.id)}  ${have}/${inp.qty}`, 10, enough ? "#b0f0c0" : "#f0c0a0"));
        });
        this.btn(c, dx + 70, dy + dh - 24, 64, 18, "炼制", () => { this.toast(this.state.brew(r.id)); this.refresh(); }, 10, ok ? 0x2a4a28 : 0x201818);
      }
    } else {
      c.add(this.txt(x + 16, y + 4, "选择一件装备升阶。消耗玄铁矿与丹砂；高级用寒髓石。", 10, "#80a090", { wordWrap: { width: 280 } }));
      const eqs = this.state.data.inventory.filter((i) => ITEM_MAP[i.id]?.kind === "equip");
      if (!this.selInv && eqs[0]) this.selInv = eqs[0].uid;
      eqs.slice(0, 7).forEach((it, i) => {
        const def = ITEM_MAP[it.id];
        const yy = y + 32 + i * 28;
        const on = this.selInv === it.uid;
        const row = this.scene.add.rectangle(x + 140, yy + 10, 260, 26, on ? 0x2a4a28 : 0x141c18, 0.95)
          .setStrokeStyle(1, on ? 0xe8f8d0 : this.rarityColor(it)).setScrollFactor(0).setInteractive();
        row.on("pointerdown", () => { this.selInv = it.uid; this.refresh(); });
        c.add(row);
        this.iconOf(it.id, x + 24, yy + 10, c);
        c.add(this.txt(x + 38, yy + 2, `${def.name} +${it.plus ?? 0}`, 12, "#e8f8f0"));
      });
      const it = eqs.find((v) => v.uid === this.selInv);
      const dx = x + 310, dy = y + 8, dw = 190, dh = 220;
      this.detailPane(c, dx, dy, dw, dh);
      if (it) {
        const def = ITEM_MAP[it.id];
        this.iconOf(it.id, dx + 24, dy + 24, c);
        c.add(this.txt(dx + 40, dy + 10, `${def.name} +${it.plus ?? 0}`, 12, "#e8f8f0"));
        c.add(this.txt(dx + 12, dy + 40, `${it.treasure} · ${it.grade}`, 10, "#e8d080"));
        c.add(this.txt(dx + 12, dy + 60, this.itemStats(it).join("　"), 10, "#c8e0d0", { wordWrap: { width: dw - 24 } }));
        this.btn(c, dx + 50, dy + dh - 24, 52, 18, "炼", () => { this.toast(this.state.refine(it.uid, false)); this.refresh(); }, 10);
        this.btn(c, dx + 110, dy + dh - 24, 52, 18, "淬", () => { this.toast(this.state.refine(it.uid, true)); this.refresh(); }, 10, 0x3a2c14);
      }
    }
  }

  private drawMenu(c: Phaser.GameObjects.Container, x: number, y: number) {
    c.add(this.txt(x + 20, y + 16, "自动存档于本地。刷新页面可继续。", 12, "#c8e0d0"));
    this.btn(c, x + 100, y + 70, 110, 22, "立即存档", () => { this.state.save(); this.toast("已记下此间因果。"); }, 12);
    this.btn(c, x + 230, y + 70, 110, 22, "操作说明", () => this.open("help"), 12);
    this.btn(c, x + 100, y + 110, 110, 22, "返回标题", () => {
      this.state.save();
      this.scene.scene.start("TitleScene");
    }, 12);
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
    lines.forEach((l, i) => c.add(this.txt(x + 20, y + 12 + i * 28, l, 12, "#d0e8dc", { wordWrap: { width: 470 } })));
  }

  private drawSect(c: Phaser.GameObjects.Container, x: number, y: number, w: number) {
    SECTS.forEach((s, i) => {
      const yy = y + 8 + i * 50;
      c.add(this.scene.add.rectangle(x + 220, yy + 20, 400, 44, 0x141c18, 0.9).setStrokeStyle(1, s.color).setScrollFactor(0));
      c.add(this.txt(x + 24, yy + 4, `${s.name}（${FACTIONS.find((f) => f.id === s.faction)?.name}）`, 12, "#e8d080"));
      c.add(this.txt(x + 24, yy + 22, s.motto + "  " + s.desc, 10, "#c0d8c8", { wordWrap: { width: 320 } }));
      this.btn(c, x + 430, yy + 22, 52, 18, "拜入", () => { this.toast(this.state.joinSect(s.id)); this.refresh(); }, 10);
    });
  }
}

export function itemLabel(it: InvItem): string {
  const def = ITEM_MAP[it.id];
  return `${def?.name ?? it.id}${it.plus ? " +" + it.plus : ""}`;
}
