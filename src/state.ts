import {
  BREAKTHROUGH_PILLS,
  ENEMY_MAP,
  EVENT_MAP,
  EVENTS,
  FACTIONS,
  GRADES,
  ITEM_MAP,
  MANUAL_TO_SKILL,
  QUEST_MAP,
  QUESTS,
  RECIPE_MAP,
  RECIPES,
  REGION_MAP,
  SECT_MAP,
  SKILL_MAP,
  TREASURES,
  beastFromEnemy,
  baseStats,
  expToBreakthrough,
  tribulationChance,
  CUSTOM_NAME_A,
  CUSTOM_NAME_B,
  CUSTOM_NAME_C,
} from "./data";
import { Rng, hashStr } from "./rng";
import type {
  AuctionListing,
  EquipSlot,
  FactionId,
  InvItem,
  LearnedSkill,
  OwnedBeast,
  QuestState,
  SaveData,
  SkillDef,
} from "./types";
import { SAVE_KEY } from "./types";

export type LogFn = (msg: string, kind?: string) => void;

export class GameState {
  data: SaveData;
  log: LogFn = () => {};
  onFx: (id: string, x?: number, y?: number, opts?: Record<string, unknown>) => void = () => {};

  constructor(data: SaveData) {
    this.data = data;
  }

  static hasSave(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  static load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return null;
      return new GameState(data);
    } catch {
      return null;
    }
  }

  static newGame(name: string, seed = 42): GameState {
    const n = (name || "青行").slice(0, 8);
    const stats = baseStats(0, 0);
    const rng = new Rng(seed);
    const st = new GameState({
      version: 1,
      name: n,
      seed,
      playTime: 0,
      worldTime: 20,
      region: "qingming_outskirts",
      tileX: 14,
      tileY: 18,
      facing: 0,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      mp: stats.maxMp,
      maxMp: stats.maxMp,
      lingqi: 10,
      maxLingqi: stats.maxLingqi,
      realm: 0,
      stage: 0,
      exp: 0,
      gold: 30,
      inventory: [],
      equipped: {},
      skills: [{ id: "basic_slash", source: "学习" }],
      skillBar: ["basic_slash", null, null, null],
      beasts: [],
      faction: "san",
      standing: { zheng: 0, mo: 0, san: 5, qingming: 0, lieyan: 0, xuanshuang: 0, xuejian: 0 },
      quests: [],
      discovered: ["qingming_outskirts"],
      flags: {},
      knownRecipes: RECIPES.filter((r) => r.type === "alchemy").slice(0, 4).map((r) => r.id).concat(["ref_weapon"]),
      auction: [],
      event: null,
      nextEventAt: 45,
      uidCursor: 1,
    });
    st.addItem("wood_sword", 1);
    st.addItem("cloth_robe", 1);
    st.addItem("heal_pill", 3);
    st.addItem("talisman_bind", 1);
    st.addItem("herb_ling", 2);
    const w = st.data.inventory.find((i) => i.id === "wood_sword");
    const a = st.data.inventory.find((i) => i.id === "cloth_robe");
    if (w) st.equip(w.uid);
    if (a) st.equip(a.uid);
    st.offerQuest("main_01_village");
    st.acceptQuest("main_01_village");
    st.regenAuction(rng);
    st.save();
    return st;
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch { /* ignore quota */ }
  }

  uid(prefix = "u"): string {
    this.data.uidCursor++;
    return `${prefix}${this.data.uidCursor.toString(36)}`;
  }

  rng(salt = "sys"): Rng {
    return new Rng((this.data.seed ^ hashStr(salt + this.data.uidCursor + this.data.playTime.toFixed(0))) >>> 0);
  }

  // ----- stats -----
  atk(): number {
    const b = baseStats(this.data.realm, this.data.stage).atk;
    return b + this.equipSum("atk") + (this.data.flags.buffAtk ? 6 : 0);
  }
  def(): number {
    return baseStats(this.data.realm, this.data.stage).def + this.equipSum("def");
  }
  lingqiRate(): number {
    let r = 1 + this.equipSum("lingqiRate");
    if (this.data.event?.id === "lingqi_leak") r += 0.8;
    // 青泉残韵：打坐时略微精炼驳杂灵气，不能改命。
    if (this.data.flags.spring_echo) r += 0.08;
    return r;
  }
  priceMul(): number {
    const f = this.data.faction;
    if (f === "zheng") return 0.9;
    if (f === "mo") return 1.15;
    return 1;
  }
  private equipSum(stat: "atk" | "def" | "hp" | "mp" | "lingqiRate"): number {
    let s = 0;
    for (const uid of Object.values(this.data.equipped)) {
      if (!uid) continue;
      const it = this.data.inventory.find((i) => i.uid === uid);
      if (!it) continue;
      const def = ITEM_MAP[it.id];
      const plus = (it.plus ?? 0) * (stat === "lingqiRate" ? 0.02 : 2);
      const fromItem = stat === "lingqiRate" ? 0 : (it[stat] ?? 0);
      s += (fromItem || def?.[stat] || 0) + plus;
    }
    return s;
  }

  recalcVitals(heal = false) {
    const b = baseStats(this.data.realm, this.data.stage);
    this.data.maxHp = b.maxHp + this.equipSum("hp");
    this.data.maxMp = b.maxMp + this.equipSum("mp");
    this.data.maxLingqi = b.maxLingqi;
    if (heal) {
      this.data.hp = this.data.maxHp;
      this.data.mp = this.data.maxMp;
    }
    this.data.hp = Math.min(this.data.hp, this.data.maxHp);
    this.data.mp = Math.min(this.data.mp, this.data.maxMp);
  }

  // ----- inventory -----
  addItem(id: string, qty = 1, extras?: Partial<InvItem>): InvItem | null {
    const def = ITEM_MAP[id];
    if (!def) return null;
    if (def.stack > 1 && !extras) {
      const exist = this.data.inventory.find((i) => i.id === id && (i.plus ?? 0) === 0);
      if (exist) {
        exist.qty += qty;
        return exist;
      }
    }
    const it: InvItem = {
      uid: this.uid("i"),
      id,
      qty,
      treasure: extras?.treasure ?? def.treasure,
      grade: extras?.grade ?? def.grade,
      plus: extras?.plus ?? 0,
      atk: extras?.atk,
      def: extras?.def,
      hp: extras?.hp,
      mp: extras?.mp,
      innateSkill: extras?.innateSkill ?? def.innateSkill,
    };
    this.data.inventory.push(it);
    if (it.innateSkill) this.maybeLearnWeaponSkill(it.innateSkill);
    return it;
  }

  removeItem(uidOrId: string, qty = 1): boolean {
    const byUid = this.data.inventory.find((i) => i.uid === uidOrId);
    const it = byUid ?? this.data.inventory.find((i) => i.id === uidOrId);
    if (!it || it.qty < qty) return false;
    it.qty -= qty;
    if (it.qty <= 0) {
      for (const k of Object.keys(this.data.equipped) as EquipSlot[]) {
        if (this.data.equipped[k] === it.uid) delete this.data.equipped[k];
      }
      this.data.inventory = this.data.inventory.filter((x) => x.uid !== it.uid);
    }
    return true;
  }

  countItem(id: string): number {
    return this.data.inventory.filter((i) => i.id === id).reduce((s, i) => s + i.qty, 0);
  }

  equip(uid: string): boolean {
    const it = this.data.inventory.find((i) => i.uid === uid);
    const def = it && ITEM_MAP[it.id];
    if (!it || !def?.slot) return false;
    this.data.equipped[def.slot] = uid;
    if (it.innateSkill || def.innateSkill) this.maybeLearnWeaponSkill(it.innateSkill ?? def.innateSkill!);
    this.recalcVitals();
    this.log(`装备了${def.name}`, "item");
    return true;
  }

  unequip(slot: EquipSlot) {
    delete this.data.equipped[slot];
    this.recalcVitals();
  }

  maybeLearnWeaponSkill(id: string) {
    if (!SKILL_MAP[id]) return;
    if (this.data.skills.some((s) => s.id === id)) return;
    this.data.skills.push({ id, source: "武器携带" });
    this.autoSlot(id);
    this.log(`领悟武器携带技能：${SKILL_MAP[id].name}`, "skill");
  }

  useItem(uid: string): string {
    const it = this.data.inventory.find((i) => i.uid === uid);
    if (!it) return "没有这件东西。";
    const def = ITEM_MAP[it.id];
    if (!def) return "未知物品。";
    if (def.kind === "equip") {
      this.equip(uid);
      return `已装备${def.name}。`;
    }
    if (def.kind === "manual") {
      const sid = MANUAL_TO_SKILL[def.id];
      if (!sid) return "这页已经模糊了。";
      if (this.data.skills.some((s) => s.id === sid)) return "你早已学会。";
      this.data.skills.push({ id: sid, source: "学习" });
      this.autoSlot(sid);
      this.removeItem(uid, 1);
      this.onFx("ui/level-up");
      this.log(`学会了${SKILL_MAP[sid].name}`, "skill");
      return `你学会了「${SKILL_MAP[sid].name}」。`;
    }
    if (def.kind === "pill") {
      if (def.healHp) this.data.hp = Math.min(this.data.maxHp, this.data.hp + def.healHp);
      if (def.healMp) this.data.mp = Math.min(this.data.maxMp, this.data.mp + def.healMp);
      if (def.lingqi) this.data.lingqi = Math.min(this.data.maxLingqi, this.data.lingqi + def.lingqi);
      if (def.cultivate) this.gainExp(def.cultivate);
      if (def.tribulation) this.data.flags.tribResist = Number(this.data.flags.tribResist ?? 0) + def.tribulation;
      if (def.capture) this.data.flags.captureBonus = Number(this.data.flags.captureBonus ?? 0) + def.capture;
      this.removeItem(uid, 1);
      this.onFx("pickups/potion");
      return `服用了${def.name}。`;
    }
    if (def.id === "spirit_stone") {
      this.data.gold += 8;
      this.data.lingqi = Math.min(this.data.maxLingqi, this.data.lingqi + 4);
      this.removeItem(uid, 1);
      this.onFx("ui/coin-collect");
      return "碾碎下品灵石，得了些铜钱与灵气。";
    }
    if (def.id === "talisman_escape") {
      if (!this.data.region.startsWith("dungeon_")) return "此刻不必遁走。";
      this.removeItem(uid, 1);
      this.data.flags.wantEscape = 1;
      return "你捏碎遁符。";
    }
    return `${def.name}现在用不上。`;
  }

  autoSlot(id: string) {
    const i = this.data.skillBar.findIndex((s) => !s);
    if (i >= 0) this.data.skillBar[i] = id;
  }

  // ----- cultivate -----
  gainExp(n: number) {
    this.data.exp += Math.floor(n);
  }
  gainLingqi(n: number) {
    this.data.lingqi = Math.min(this.data.maxLingqi, this.data.lingqi + n);
  }

  meditate(dt: number, atPool: boolean) {
    const rate = (atPool ? 8 : 3) * this.lingqiRate();
    this.gainLingqi(rate * dt);
    const expMul = this.data.flags.spring_echo ? 0.28 : 0.25;
    this.gainExp(rate * expMul * dt);
    if (this.data.flags.spring_echo) {
      const acc = Number(this.data.flags.echo_time ?? 0) + dt;
      this.data.flags.echo_time = acc;
      if (acc >= 3 && !this.data.flags.echo_used) {
        this.data.flags.echo_used = 1;
        this.questFlag("echo_used");
      }
    }
  }

  canBreakthrough(): { ok: boolean; reason: string } {
    if (this.data.realm >= 9 && this.data.stage >= 3) return { ok: false, reason: "已至真仙圆满。" };
    const need = expToBreakthrough(this.data.realm, this.data.stage);
    if (this.data.exp < need) return { ok: false, reason: `修为不足（${Math.floor(this.data.exp)}/${need}）。` };
    if (this.data.lingqi < need * 0.4) return { ok: false, reason: "灵气不足，难以冲关。" };
    const pill = this.data.stage === 3 ? BREAKTHROUGH_PILLS[this.data.realm + 1] : undefined;
    if (pill && this.countItem(pill) <= 0) return { ok: false, reason: `需服用${ITEM_MAP[pill].name}。` };
    return { ok: true, reason: "可以尝试突破。" };
  }

  breakthrough(): { ok: boolean; msg: string } {
    const c = this.canBreakthrough();
    if (!c.ok) return { ok: false, msg: c.reason };
    const need = expToBreakthrough(this.data.realm, this.data.stage);
    const pill = this.data.stage === 3 ? BREAKTHROUGH_PILLS[this.data.realm + 1] : undefined;
    if (pill) this.removeItem(pill, 1);
    this.data.lingqi -= Math.floor(need * 0.4);
    this.data.exp -= need;
    const resist = Number(this.data.flags.tribResist ?? 0);
    const chance = tribulationChance(this.data.realm, this.data.stage, resist);
    this.data.flags.tribResist = 0;
    const rng = this.rng("trib");
    const success = rng.chance(chance);
    if (!success) {
      this.data.hp = Math.max(1, Math.floor(this.data.hp * 0.4));
      this.data.exp += Math.floor(need * 0.3);
      this.log("冲击失败，经脉受损。", "warn");
      this.onFx("lightning/thunderclap");
      this.save();
      return { ok: false, msg: "天劫未渡，功亏一篑。修为还剩几分。" };
    }
    if (this.data.stage < 3) this.data.stage++;
    else {
      this.data.stage = 0;
      this.data.realm++;
    }
    this.recalcVitals(true);
    this.onFx("holy/sunburst");
    this.onFx("ui/level-up");
    this.log("突破成功！", "good");
    this.questRealm();
    this.save();
    const grit = this.data.realm === 1 && this.data.stage === 0
      ? "经脉险些走火，好在留了退路。你仍是门中不起眼的人物。"
      : this.data.realm === 2 && this.data.stage === 0
        ? "金丹结成。自此才有自保之力，可在化神面前，你仍是凡人。"
        : "周身灵气一震，境界更进一步！";
    return { ok: true, msg: grit };
  }

  // ----- skills workshop -----
  knownSkill(id: string): LearnedSkill | undefined {
    return this.data.skills.find((s) => s.id === id);
  }

  skillView(ls: LearnedSkill): SkillDef & LearnedSkill {
    const base = SKILL_MAP[ls.id] ?? SKILL_MAP.basic_slash;
    return {
      ...base,
      ...ls,
      name: ls.name ?? base.name,
      fx: ls.fx ?? base.fx,
      palette: ls.palette ?? base.palette,
      damage: ls.damage ?? base.damage,
      element: ls.element ?? base.element,
    };
  }

  splitSkill(id: string): string {
    const ls = this.knownSkill(id);
    if (!ls) return "未学会此技。";
    if (ls.id === "basic_slash") return "根基之术不可拆。";
    this.data.skills = this.data.skills.filter((s) => s !== ls);
    this.data.skillBar = this.data.skillBar.map((s) => (s === id ? null : s));
    this.addItem("cinnabar", 1);
    this.addItem("soul_silk", 1);
    this.log(`拆分了技能，炼出材料。`, "skill");
    this.save();
    return "技能拆作两缕残意，凝成丹砂与魂丝。";
  }

  mergeOrCreate(a: string, b: string): string {
    if (a === b) return "须以两门不同技能相合。";
    const sa = this.knownSkill(a);
    const sb = this.knownSkill(b);
    if (!sa || !sb) return "须已学会这两门技能。";
    const va = this.skillView(sa);
    const vb = this.skillView(sb);
    const rng = this.rng("craftskill" + a + b);
    const palA = va.palette ?? ["#102018", "#3cb88a", "#ffffff"];
    const palB = vb.palette ?? ["#201010", "#e06040", "#ffffff"];
    const pal = palA.map((c, i) => (i % 2 === 0 ? c : palB[i % palB.length]));
    const name =
      rng.pick(CUSTOM_NAME_A) + rng.pick(CUSTOM_NAME_B) + rng.pick(CUSTOM_NAME_C);
    const id = "custom_" + this.uid("sk");
    const fx = rng.chance(0.5) ? va.fx : vb.fx;
    const neu: LearnedSkill = {
      id,
      source: "自创",
      custom: true,
      name,
      fx,
      palette: pal,
      damage: Math.floor((va.damage + vb.damage) * 0.7 + 4),
      element: rng.chance(0.5) ? va.element : vb.element,
      from: [va.name, vb.name],
    };
    this.data.skills.push(neu);
    this.autoSlot(id);
    this.onFx("arcane/mana-burst");
    this.log(`自创技能「${name}」`, "skill");
    this.save();
    return `两道法意相合，你创出了「${name}」。`;
  }

  // ----- beasts -----
  tryCapture(enemyId: string, hpRatio: number): string {
    const def = ENEMY_MAP[enemyId];
    if (!def?.capture) return "此物不可收服。";
    if (this.countItem("talisman_bind") <= 0) return "没有拘灵符。";
    if (hpRatio > 0.35) return "它还太强，符纸会被震碎。先削弱它！";
    this.removeItem("talisman_bind", 1);
    const bonus = Number(this.data.flags.captureBonus ?? 0);
    this.data.flags.captureBonus = 0;
    const chance = def.capture.chance + bonus + (1 - hpRatio) * 0.2;
    if (!this.rng("cap" + enemyId).chance(chance)) {
      this.log("收服失败，符纸燃成灰。", "warn");
      this.onFx("spawn/poof");
      return "拘灵失败，它挣扎着挣开了符箓。";
    }
    const bdef = beastFromEnemy(enemyId);
    if (!bdef) return "收服异常。";
    const pet: OwnedBeast = {
      uid: this.uid("b"),
      defId: bdef.id,
      name: bdef.name,
      kind: bdef.kind,
      hp: bdef.hp,
      maxHp: bdef.hp,
      atk: bdef.atk,
      def: bdef.def,
      summoned: this.data.beasts.every((x) => !x.summoned),
    };
    this.data.beasts.push(pet);
    this.data.flags.captured_one = 1;
    this.questFlag("captured_one");
    this.onFx("spawn/summon-rise");
    this.log(`收服了${pet.kind}「${pet.name}」`, "good");
    this.save();
    return `符光一敛，你收服了${pet.kind}「${pet.name}」。`;
  }

  toggleSummon(uid: string) {
    const b = this.data.beasts.find((x) => x.uid === uid);
    if (!b) return;
    if (b.summoned) b.summoned = false;
    else {
      for (const o of this.data.beasts) o.summoned = false;
      b.summoned = true;
      this.onFx("spawn/spawn-portal");
    }
    this.save();
  }

  activePet(): OwnedBeast | undefined {
    return this.data.beasts.find((b) => b.summoned);
  }

  // ----- sect / faction -----
  joinSect(id: string): string {
    const sect = SECT_MAP[id];
    if (!sect) return "没有这个门派。";
    if (this.data.sect === id) return "你已是此派弟子。";
    if (this.data.sect) return "既入一门，不可再改投（本纪如此）。";
    this.data.sect = id;
    this.data.faction = sect.faction;
    this.data.standing[id] = (this.data.standing[id] ?? 0) + 20;
    this.data.standing[sect.faction] = (this.data.standing[sect.faction] ?? 0) + 15;
    for (const sid of sect.heritage) {
      if (!this.data.skills.some((s) => s.id === sid)) {
        this.data.skills.push({ id: sid, source: "传承" });
        this.autoSlot(sid);
      }
    }
    this.data.flags.joined_sect = 1;
    this.questFlag("joined_sect");
    this.onFx("holy/blessing");
    this.log(`拜入${sect.name}`, "good");
    this.save();
    return `你对天起誓，拜入${sect.name}。得传：${sect.heritage.map((s) => SKILL_MAP[s]?.name).join("、")}。`;
  }

  factionName(): string {
    return FACTIONS.find((f) => f.id === this.data.faction)?.name ?? "散修";
  }

  // ----- craft -----
  canCraft(rid: string): boolean {
    const r = RECIPE_MAP[rid];
    if (!r || r.type !== "alchemy") return false;
    return r.inputs.every((i) => this.countItem(i.id) >= i.qty);
  }

  brew(rid: string): string {
    const r = RECIPE_MAP[rid];
    if (!r || r.type !== "alchemy") return "这不是丹方。";
    if (!this.canCraft(rid)) return "材料不足。";
    for (const i of r.inputs) this.removeItem(i.id, i.qty);
    this.addItem(r.output, r.outputQty ?? 1);
    this.onFx("fire/spirit-flame");
    this.log(`炼成${ITEM_MAP[r.output].name}`, "good");
    this.save();
    return `炉火一收，炼成${ITEM_MAP[r.output].name}×${r.outputQty ?? 1}。`;
  }

  refine(uid: string, high = false): string {
    const it = this.data.inventory.find((i) => i.uid === uid);
    const def = it && ITEM_MAP[it.id];
    if (!it || def?.kind !== "equip") return "请选择一件法器。";
    const recipe = RECIPE_MAP[high ? "ref_high" : "ref_weapon"];
    if (!recipe.inputs.every((i) => this.countItem(i.id) >= i.qty)) return "炼器材料不足。";
    for (const i of recipe.inputs) this.removeItem(i.id, i.qty);
    it.plus = (it.plus ?? 0) + 1;
    const gi = GRADES.indexOf(it.grade ?? def.grade ?? "凡品");
    if (it.plus % 3 === 0 && gi >= 0 && gi < GRADES.length - 1) {
      it.grade = GRADES[gi + 1];
      this.log(`${def.name}品阶升至${it.grade}`, "good");
    }
    if (it.plus % 5 === 0) {
      const ti = TREASURES.indexOf(it.treasure ?? def.treasure ?? "法器");
      if (ti >= 0 && ti < TREASURES.length - 1) {
        it.treasure = TREASURES[ti + 1];
        this.log(`${def.name}升至${it.treasure}`, "good");
      }
    }
    this.recalcVitals();
    this.onFx("pickups/gem-spin");
    this.save();
    return `${def.name}炼成 +${it.plus}（${it.treasure ?? def.treasure}·${it.grade ?? def.grade}）。`;
  }

  // ----- quests -----
  offerQuest(id: string) {
    if (this.data.quests.some((q) => q.id === id)) return;
    const def = QUEST_MAP[id];
    if (!def) return;
    this.data.quests.push({ id, step: 0, progress: 0, status: "offered" });
  }

  acceptQuest(id: string): string {
    const q = this.data.quests.find((x) => x.id === id);
    const def = QUEST_MAP[id];
    if (!def) return "没有这个任务。";
    if (!q) {
      this.data.quests.push({ id, step: 0, progress: 0, status: "active" });
    } else if (q.status === "offered") q.status = "active";
    else if (q.status === "active") return "已在进行。";
    else return "已经完成。";
    this.log(`接取任务：${def.name}`, "quest");
    this.save();
    return `接取「${def.name}」。`;
  }

  activeQuests(): (QuestState & { def: (typeof QUESTS)[0] })[] {
    return this.data.quests
      .filter((q) => q.status === "active" || q.status === "offered" || q.status === "done")
      .map((q) => ({ ...q, def: QUEST_MAP[q.id] }))
      .filter((q) => q.def);
  }

  questTalk(npcId: string): string[] {
    const msgs: string[] = [];
    for (const q of this.data.quests) {
      const def = QUEST_MAP[q.id];
      if (!def) continue;
      if (q.status === "offered" && def.steps[0]?.type === "talk" && def.steps[0].target === npcId) {
        q.status = "active";
        this.advanceQuest(q, msgs);
      } else if (q.status === "active") {
        const step = def.steps[q.step];
        if (step?.type === "talk" && step.target === npcId) this.advanceQuest(q, msgs);
      } else if (q.status === "done" && def.steps[def.steps.length - 1]?.type === "talk" && def.steps[def.steps.length - 1].target === npcId) {
        this.turnIn(q, msgs);
      }
    }
    // auto offer related
    for (const def of QUESTS) {
      if (def.autoOffer && !this.data.quests.some((q) => q.id === def.id)) this.offerQuest(def.id);
    }
    return msgs;
  }

  private advanceQuest(q: QuestState, msgs: string[]) {
    const def = QUEST_MAP[q.id];
    q.step++;
    q.progress = 0;
    if (q.step >= def.steps.length) {
      q.status = "done";
      // if last step was talk, turn in immediately
      this.turnIn(q, msgs);
    } else {
      msgs.push(`任务进展：${def.steps[q.step].text}`);
      this.log(def.steps[q.step].text, "quest");
    }
  }

  private turnIn(q: QuestState, msgs: string[]) {
    if (q.status === "turned") return;
    const def = QUEST_MAP[q.id];
    q.status = "turned";
    if (def.rewards.gold) {
      this.data.gold += def.rewards.gold;
      this.onFx("ui/coin-collect");
    }
    if (def.rewards.exp) this.gainExp(def.rewards.exp);
    if (def.rewards.lingqi) this.gainLingqi(def.rewards.lingqi);
    for (const it of def.rewards.items ?? []) this.addItem(it.id, it.qty);
    this.onFx("ui/quest-complete");
    msgs.push(`完成「${def.name}」！`);
    this.log(`完成任务：${def.name}`, "quest");
    for (const u of def.unlock ?? []) this.offerQuest(u);
    this.save();
  }

  questKill(enemyId: string) {
    for (const q of this.data.quests) {
      if (q.status !== "active") continue;
      const def = QUEST_MAP[q.id];
      const step = def?.steps[q.step];
      if (step?.type === "kill" && step.target === enemyId) {
        q.progress++;
        if (q.progress >= (step.count ?? 1)) {
          const msgs: string[] = [];
          this.advanceQuest(q, msgs);
        }
      }
    }
  }

  questGather(itemId: string) {
    for (const q of this.data.quests) {
      if (q.status !== "active") continue;
      const def = QUEST_MAP[q.id];
      const step = def?.steps[q.step];
      if (step?.type === "gather" && step.target === itemId) {
        q.progress = this.countItem(itemId);
        if (q.progress >= (step.count ?? 1)) {
          // wait for talk turn-in usually; mark ready
          const msgs: string[] = [];
          this.advanceQuest(q, msgs);
        }
      }
    }
  }

  questEnter(region: string) {
    this.discover(region);
    for (const q of this.data.quests) {
      if (q.status !== "active") continue;
      const def = QUEST_MAP[q.id];
      const step = def?.steps[q.step];
      if (step?.type === "enter" && step.target === region) {
        const msgs: string[] = [];
        this.advanceQuest(q, msgs);
      }
    }
  }

  questFlag(flag: string) {
    for (const q of this.data.quests) {
      if (q.status !== "active") continue;
      const def = QUEST_MAP[q.id];
      const step = def?.steps[q.step];
      if (step?.type === "flag" && step.target === flag) {
        const msgs: string[] = [];
        this.advanceQuest(q, msgs);
      }
    }
  }

  questRealm() {
    for (const q of this.data.quests) {
      if (q.status !== "active") continue;
      const def = QUEST_MAP[q.id];
      const step = def?.steps[q.step];
      if (step?.type === "realm" && this.data.realm >= Number(step.target)) {
        const msgs: string[] = [];
        this.advanceQuest(q, msgs);
      }
    }
  }

  markSectTrouble(): string {
    if (this.data.flags.sect_trouble) return "这桩祸事已经把你推出门墙。";
    this.data.flags.sect_trouble = 1;
    this.data.flags.left_sect = 1;
    this.data.faction = "san";
    this.questFlag("sect_trouble");
    this.save();
    return "供状已经写上你的名字。你不得不离开门墙，从今起以散修行走。";
  }

  awakenSpring(): string {
    if (this.data.flags.spring_echo) return "识海中那一缕青泉残韵仍在，细得几乎听不见。";
    this.data.flags.spring_echo = 1;
    this.questFlag("spring_echo");
    this.onFx("water/ripples");
    this.log("识海多了一缕青泉残韵。", "good");
    this.save();
    return "坠落的余震过去后，识海里多了一缕极淡的泉音。打坐时，驳杂灵气似乎能多挤出一滴。它改不了资质，也轰不开局面。";
  }

  discover(region: string) {
    if (!this.data.discovered.includes(region)) this.data.discovered.push(region);
  }

  // ----- trade / auction -----
  buy(id: string, fromVendor = true): string {
    const def = ITEM_MAP[id];
    if (!def) return "没有此货。";
    const price = Math.max(1, Math.floor(def.value * this.priceMul()));
    if (this.data.gold < price) return "钱不够。";
    this.data.gold -= price;
    this.addItem(id, 1);
    this.onFx("ui/coin-collect");
    this.save();
    return `买下${def.name}，花了${price}钱。`;
  }

  sell(uid: string): string {
    const it = this.data.inventory.find((i) => i.uid === uid);
    const def = it && ITEM_MAP[it.id];
    if (!it || !def) return "没有这件。";
    if (Object.values(this.data.equipped).includes(it.uid)) return "先卸下再卖。";
    const price = Math.max(1, Math.floor(def.value * 0.5 * (1 + (it.plus ?? 0) * 0.2)));
    this.removeItem(uid, 1);
    this.data.gold += price;
    this.onFx("ui/coin-collect");
    this.save();
    return `售出，得${price}钱。`;
  }

  regenAuction(rng: Rng) {
    const pool = Object.values(ITEM_MAP).filter((i) => i.kind === "equip" || i.kind === "manual" || i.kind === "pill");
    const n = 6 + rng.int(0, 3);
    const list: AuctionListing[] = [];
    for (let i = 0; i < n; i++) {
      const def = rng.pick(pool);
      const it: InvItem = { uid: this.uid("a"), id: def.id, qty: 1, treasure: def.treasure, grade: def.grade };
      const buyout = Math.floor(def.value * rng.float(1.4, 2.2));
      list.push({
        uid: this.uid("al"),
        item: it,
        buyout,
        bid: Math.floor(buyout * 0.5),
        seller: rng.pick(["散修某", "坊市匿名", "海商行", "旧藏", "血剑楼暗桩", "霜使"]),
        remain: rng.int(40, 160),
      });
    }
    this.data.auction = list;
  }

  bid(uid: string): string {
    const a = this.data.auction.find((x) => x.uid === uid);
    if (!a) return "这件已下架。";
    const next = Math.floor(a.bid * 1.2 + 5);
    if (this.data.gold < next) return "金币不足，无法出价。";
    this.data.gold -= next - (a.bidder === this.data.name ? a.bid : 0);
    a.bid = next;
    a.bidder = this.data.name;
    this.data.flags.auctioned = 1;
    this.questFlag("auctioned");
    this.save();
    return `你出价 ${next}。`;
  }

  buyout(uid: string): string {
    const a = this.data.auction.find((x) => x.uid === uid);
    if (!a) return "这件已下架。";
    if (this.data.gold < a.buyout) return "一口价也付不起。";
    this.data.gold -= a.buyout;
    this.data.inventory.push({ ...a.item, uid: this.uid("i") });
    this.data.auction = this.data.auction.filter((x) => x.uid !== uid);
    this.onFx("ui/coin-collect");
    this.onFx("pickups/loot-beam");
    this.log(`拍下${ITEM_MAP[a.item.id]?.name}`, "item");
    this.data.flags.auctioned = 1;
    this.questFlag("auctioned");
    this.save();
    return `一口价拿下${ITEM_MAP[a.item.id]?.name}。`;
  }

  // ----- world events -----
  tickWorld(dt: number) {
    this.data.playTime += dt;
    this.data.worldTime += dt;
    this.questRealm();
    if (this.data.event) {
      this.data.event.t -= dt;
      if (this.data.event.t <= 0) {
        this.log(`${EVENT_MAP[this.data.event.id]?.name ?? "异象"}消散了。`, "world");
        this.data.event = null;
        this.data.nextEventAt = this.data.playTime + 50 + this.rng("evtgap").int(0, 40);
      }
    } else if (this.data.playTime >= this.data.nextEventAt) {
      this.rollEvent();
    }
    for (const a of this.data.auction) a.remain -= dt;
    const expired = this.data.auction.filter((a) => a.remain <= 0);
    for (const a of expired) {
      if (a.bidder === this.data.name) {
        this.data.inventory.push({ ...a.item, uid: this.uid("i") });
        this.log(`拍卖成交：${ITEM_MAP[a.item.id]?.name}归你。`, "item");
      }
    }
    this.data.auction = this.data.auction.filter((a) => a.remain > 0);
  }

  rollEvent() {
    const rng = this.rng("event" + Math.floor(this.data.playTime));
    const candidates = EVENTS.filter((e) => !e.regions || e.regions.includes(this.data.region) || rng.chance(0.35));
    const ev = rng.weighted(candidates.map((e) => ({ w: e.weight, v: e })));
    this.data.event = { id: ev.id, t: ev.duration, region: this.data.region };
    this.data.nextEventAt = this.data.playTime + ev.duration + rng.int(40, 90);
    this.log(`天地异象：${ev.name}！${ev.desc}`, "world");
    if (ev.kind === "auction") this.regenAuction(rng);
    if (ev.kind === "tribulation") {
      this.data.flags.trib_seen = 1;
      this.questFlag("trib_seen");
    }
    this.save();
  }

  isNight(): boolean {
    const t = ((this.data.worldTime / 180) % 1);
    return t > 0.55 && t < 0.95;
  }
  dayFactor(): number {
    const t = (this.data.worldTime / 180) % 1;
    // 0 day, 1 night
    if (t < 0.45) return 0;
    if (t < 0.55) return (t - 0.45) / 0.1;
    if (t < 0.85) return 1;
    if (t < 0.95) return 1 - (t - 0.85) / 0.1;
    return 0;
  }

  travelTo(region: string): string {
    if (!REGION_MAP[region]) return "没有这条路。";
    if (!this.data.discovered.includes(region) && !REGION_MAP[this.data.region]?.connections.includes(region)) {
      return "尚未发现这条路。";
    }
    this.data.region = region;
    this.discover(region);
    const r = REGION_MAP[region];
    this.data.tileX = Math.floor(r.size / 2);
    this.data.tileY = Math.floor(r.size / 2);
    this.questEnter(region);
    this.save();
    return `你动身前往${r.name}。`;
  }
}
