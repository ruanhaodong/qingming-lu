import type { GradeId, ItemDef, TreasureKind } from "../types";

export const TREASURES: TreasureKind[] = ["法器", "灵宝", "法宝", "本命法宝", "通天灵宝", "玄天至宝"];
export const GRADES: GradeId[] = ["凡品", "黄品", "玄品", "地品", "天品"];

export const GRADE_COLOR: Record<GradeId, number> = {
  凡品: 0xb0b8b0,
  黄品: 0xd8c060,
  玄品: 0x70c0e8,
  地品: 0x80e090,
  天品: 0xf0d080,
};

export const TREASURE_COLOR: Record<TreasureKind, number> = {
  法器: 0x9aaa9a,
  灵宝: 0x70c8a0,
  法宝: 0x70b0e0,
  本命法宝: 0xc080e0,
  通天灵宝: 0xe0a050,
  玄天至宝: 0xffe080,
};

export const ITEMS: ItemDef[] = [
  // weapons
  { id: "wood_sword", name: "青木剑", kind: "equip", slot: "weapon", treasure: "法器", grade: "凡品", atk: 6, value: 20, stack: 1, icon: "sword", desc: "村中常见的木胎开刃剑，可引一缕剑气。" },
  { id: "qingming_sword", name: "青冥残剑", kind: "equip", slot: "weapon", treasure: "法器", grade: "黄品", atk: 12, mp: 8, innateSkill: "qingming_jianqi", value: 80, stack: 1, icon: "sword", desc: "外门遗剑，剑脊隐有青光。携带青冥剑气。" },
  { id: "iron_sword", name: "玄铁剑", kind: "equip", slot: "weapon", treasure: "法器", grade: "黄品", atk: 16, value: 120, stack: 1, icon: "sword", desc: "以玄铁锻成，沉重但可靠。" },
  { id: "flame_blade", name: "丹火刀", kind: "equip", slot: "weapon", treasure: "灵宝", grade: "黄品", atk: 22, innateSkill: "danhuo_lianpo", value: 260, stack: 1, icon: "blade", desc: "烈焰谷余火所铸，刀鸣如炉。携带丹火炼魄。" },
  { id: "frost_fan", name: "霜纹扇", kind: "equip", slot: "weapon", treasure: "灵宝", grade: "玄品", atk: 20, mp: 16, value: 320, stack: 1, icon: "fan", desc: "玄霜宫散出的冰纹扇骨。" },
  { id: "blood_sword", name: "血饮", kind: "equip", slot: "weapon", treasure: "法宝", grade: "玄品", atk: 30, hp: -10, innateSkill: "xueyin_zhan", value: 500, stack: 1, icon: "sword", desc: "血剑楼禁兵，见血则锋。携带血饮斩。" },
  { id: "spirit_sword", name: "御风飞剑", kind: "equip", slot: "weapon", treasure: "法宝", grade: "地品", atk: 36, innateSkill: "yujian_shu", value: 900, stack: 1, icon: "sword", desc: "可离手御使。携带御剑术。" },
  { id: "minghong", name: "鸣虹", kind: "equip", slot: "weapon", treasure: "本命法宝", grade: "地品", atk: 48, mp: 20, value: 2000, stack: 1, icon: "sword", desc: "可认主的本命飞剑胚。" },
  { id: "tongtian_ruler", name: "通天尺", kind: "equip", slot: "weapon", treasure: "通天灵宝", grade: "天品", atk: 64, value: 6000, stack: 1, icon: "ruler", desc: "传闻可量天机，残件亦能开山。" },
  { id: "xuanyu_mirror", name: "玄宇镜", kind: "equip", slot: "weapon", treasure: "玄天至宝", grade: "天品", atk: 80, def: 20, value: 12000, stack: 1, icon: "mirror", desc: "镜中另有一方天地。" },

  // armor
  { id: "cloth_robe", name: "青布道袍", kind: "equip", slot: "armor", treasure: "法器", grade: "凡品", def: 4, hp: 12, value: 18, stack: 1, icon: "robe", desc: "寻常道袍，勉强挡风。" },
  { id: "qingming_robe", name: "青冥外门袍", kind: "equip", slot: "armor", treasure: "法器", grade: "黄品", def: 8, hp: 20, mp: 8, value: 70, stack: 1, icon: "robe", desc: "外门弟子制式青袍。" },
  { id: "scale_armor", name: "鳞纹甲", kind: "equip", slot: "armor", treasure: "灵宝", grade: "黄品", def: 14, hp: 28, value: 200, stack: 1, icon: "armor", desc: "以灵兽鳞片缝制。" },
  { id: "frost_veil", name: "霜绡衣", kind: "equip", slot: "armor", treasure: "灵宝", grade: "玄品", def: 16, mp: 20, value: 340, stack: 1, icon: "robe", desc: "触手生寒，可化小伤。" },
  { id: "blood_mail", name: "血织衫", kind: "equip", slot: "armor", treasure: "法宝", grade: "玄品", def: 22, hp: 40, value: 520, stack: 1, icon: "armor", desc: "魔道血线织就，伤愈更快。" },
  { id: "void_cloak", name: "炼虚披氅", kind: "equip", slot: "armor", treasure: "本命法宝", grade: "地品", def: 30, hp: 56, mp: 24, value: 1800, stack: 1, icon: "cloak", desc: "披上如入虚空。" },

  // accessory
  { id: "wood_bead", name: "青木念珠", kind: "equip", slot: "accessory", treasure: "法器", grade: "凡品", mp: 10, lingqiRate: 0.05, value: 24, stack: 1, icon: "bead", desc: "助静心引气。" },
  { id: "ling_ring", name: "聚灵戒", kind: "equip", slot: "accessory", treasure: "灵宝", grade: "黄品", mp: 16, lingqiRate: 0.12, value: 180, stack: 1, icon: "ring", desc: "轻微聚拢周遭灵气。" },
  { id: "thunder_pendant", name: "掌雷坠", kind: "equip", slot: "accessory", treasure: "法宝", grade: "玄品", atk: 8, mp: 12, innateSkill: "zhangxin_lei", value: 400, stack: 1, icon: "pendant", desc: "内封一缕雷种。携带掌心雷。" },
  { id: "soul_lock", name: "锁魂铃", kind: "equip", slot: "accessory", treasure: "通天灵宝", grade: "地品", hp: 30, def: 8, value: 2400, stack: 1, icon: "bell", desc: "可定神魂片刻。" },

  // artifacts
  { id: "paper_talisman", name: "护身符篆", kind: "equip", slot: "artifact", treasure: "法器", grade: "凡品", def: 3, innateSkill: "fuzhuan_jinzhi", value: 40, stack: 1, icon: "talisman", desc: "初级符器。携带符篆禁制。" },
  { id: "ling_furnace", name: "袖里丹炉", kind: "equip", slot: "artifact", treasure: "灵宝", grade: "黄品", mp: 10, lingqiRate: 0.08, value: 220, stack: 1, icon: "furnace", desc: "可温养丹火。" },
  { id: "shield_mirror", name: "护体宝镜", kind: "equip", slot: "artifact", treasure: "法宝", grade: "玄品", def: 18, innateSkill: "huti_zhenqi", value: 480, stack: 1, icon: "mirror", desc: "镜光化盾。携带护体真气。" },
  { id: "sky_gourd", name: "吞云葫芦", kind: "equip", slot: "artifact", treasure: "本命法宝", grade: "地品", hp: 24, mp: 24, value: 1600, stack: 1, icon: "gourd", desc: "可存灵气与丹药。" },

  // pills
  { id: "heal_pill", name: "回春丹", kind: "pill", healHp: 40, value: 12, stack: 20, icon: "pill_green", desc: "疗伤续命的凡丹。" },
  { id: "qi_pill", name: "回气丹", kind: "pill", healMp: 30, value: 12, stack: 20, icon: "pill_blue", desc: "补充法力。" },
  { id: "lingqi_pill", name: "聚气丹", kind: "pill", lingqi: 40, cultivate: 20, value: 20, stack: 20, icon: "pill_cyan", desc: "助修士短时引气。" },
  { id: "capture_pill", name: "安魂丹", kind: "pill", capture: 0.15, value: 30, stack: 10, icon: "pill_purple", desc: "使灵兽神智暂安，利于收服。" },
  { id: "trib_pill", name: "避劫丹", kind: "pill", tribulation: 0.2, value: 80, stack: 5, icon: "pill_gold", desc: "渡劫前服用，可增一线生机。" },
  { id: "zhuji_pill", name: "筑基丹", kind: "pill", cultivate: 40, value: 120, stack: 5, icon: "pill_gold", desc: "筑基所需的关键丹药。" },
  { id: "jindan_pill", name: "结金丹", kind: "pill", cultivate: 60, value: 280, stack: 3, icon: "pill_gold", desc: "凝结金丹时护住丹胎。" },
  { id: "yuanying_pill", name: "养婴丹", kind: "pill", cultivate: 80, value: 500, stack: 3, icon: "pill_gold", desc: "元婴破壳时可稳住神魂。" },
  { id: "huashen_pill", name: "化神丹", kind: "pill", cultivate: 100, value: 900, stack: 2, icon: "pill_gold", desc: "化神时调和神识。" },

  // materials
  { id: "herb_ling", name: "灵叶草", kind: "material", value: 4, stack: 99, icon: "herb", desc: "村外常见灵草。" },
  { id: "herb_frost", name: "霜华芝", kind: "material", value: 10, stack: 99, icon: "herb", desc: "苍云岭阴处所生。" },
  { id: "herb_blood", name: "血滴兰", kind: "material", value: 14, stack: 99, icon: "herb", desc: "带有微弱血腥灵气。" },
  { id: "ore_iron", name: "玄铁矿", kind: "material", value: 8, stack: 99, icon: "ore", desc: "矿洞中的凡中灵矿。" },
  { id: "ore_cold", name: "寒髓石", kind: "material", value: 16, stack: 99, icon: "ore", desc: "残照秘境的冷光矿。" },
  { id: "beast_core", name: "兽核", kind: "material", value: 18, stack: 50, icon: "core", desc: "灵兽丹田所凝。" },
  { id: "beast_scale", name: "灵鳞", kind: "material", value: 12, stack: 50, icon: "scale", desc: "可作甲片或药引。" },
  { id: "spirit_wood", name: "青冥木", kind: "material", value: 9, stack: 99, icon: "wood", desc: "宜作剑胎与符纸骨。" },
  { id: "cinnabar", name: "丹砂", kind: "material", value: 15, stack: 50, icon: "sand", desc: "炼丹、炼器皆需。" },
  { id: "soul_silk", name: "魂丝", kind: "material", value: 22, stack: 30, icon: "silk", desc: "用于禁制与傀儡线。" },
  { id: "thunder_shard", name: "雷纹碎晶", kind: "material", value: 28, stack: 30, icon: "crystal", desc: "掌心雷与雷法的材料。" },
  { id: "void_dust", name: "虚空尘", kind: "material", value: 40, stack: 20, icon: "dust", desc: "禁地偶尔飘落的粉末。" },

  // manuals & talismans
  { id: "manual_jianqi", name: "《青冥剑诀》残页", kind: "manual", value: 50, stack: 1, icon: "book", desc: "可学习青冥剑气。" },
  { id: "manual_lei", name: "《五雷手》残卷", kind: "manual", value: 80, stack: 1, icon: "book", desc: "可学习掌心雷。" },
  { id: "manual_huti", name: "《护体真诀》", kind: "manual", value: 70, stack: 1, icon: "book", desc: "可学习护体真气。" },
  { id: "manual_yujian", name: "《御剑小术》", kind: "manual", value: 120, stack: 1, icon: "book", desc: "可学习御剑术。" },
  { id: "manual_fu", name: "《符篆入门》", kind: "manual", value: 60, stack: 1, icon: "book", desc: "可学习符篆禁制。" },
  { id: "manual_fire", name: "《丹火炼魄篇》", kind: "manual", value: 90, stack: 1, icon: "book", desc: "可学习丹火炼魄。" },
  { id: "talisman_bind", name: "拘灵符", kind: "talisman", value: 25, stack: 20, icon: "talisman", desc: "削弱灵兽后可尝试收服。" },
  { id: "talisman_escape", name: "遁符", kind: "talisman", value: 20, stack: 10, icon: "talisman", desc: "副本中使用可立刻离开。" },

  // quest / misc
  { id: "quest_letter", name: "村中书信", kind: "quest", value: 0, stack: 1, icon: "letter", desc: "青松托你带给望海坊的旧识。" },
  { id: "spirit_stone", name: "下品灵石", kind: "misc", value: 8, stack: 99, icon: "stone", desc: "可当货币，亦可慢慢吸收。" },
];

export const ITEM_MAP = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export function itemName(id: string): string {
  return ITEM_MAP[id]?.name ?? id;
}

export const MANUAL_TO_SKILL: Record<string, string> = {
  manual_jianqi: "qingming_jianqi",
  manual_lei: "zhangxin_lei",
  manual_huti: "huti_zhenqi",
  manual_yujian: "yujian_shu",
  manual_fu: "fuzhuan_jinzhi",
  manual_fire: "danhuo_lianpo",
};
