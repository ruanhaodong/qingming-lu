import type { BeastDef } from "../types";
import { ENEMIES } from "./enemies";

export const BEASTS: BeastDef[] = [
  { id: "qingyu_que", name: "青羽雀", kind: "灵宠", realm: 0, hp: 36, atk: 7, def: 2, skill: "heal_bloom", desc: "可侦敌，亦可轻啄。", palette: [0x1a3020, 0x3a8060, 0xa0e0b0] },
  { id: "zaomao_tu", name: "杂毛妖兔", kind: "灵宠", realm: 0, hp: 40, atk: 8, def: 3, skill: "basic_slash", desc: "虽然怯战，咬人也不轻。", palette: [0x2a2418, 0x6a5840, 0xd0c0a0] },
  { id: "yinfeng_shu", name: "阴风鼠", kind: "灵宠", realm: 0, hp: 32, atk: 9, def: 1, skill: "basic_slash", desc: "钻洞探路的好手。", palette: [0x181820, 0x404050, 0x808098] },
  { id: "xunshan_kuilei", name: "巡山傀儡", kind: "傀儡", realm: 0, hp: 70, atk: 10, def: 10, skill: "huti_zhenqi", desc: "听符而行的木石守卫。", palette: [0x2a2818, 0x5a5040, 0xb0a070] },
  { id: "kuangwei_elite", name: "矿卫精英", kind: "傀儡", realm: 0, hp: 100, atk: 16, def: 12, skill: "huti_zhenqi", desc: "更厚重的矿洞傀儡。", palette: [0x302820, 0x686050, 0xc0b890] },
  { id: "chilian_she", name: "赤炼蛇", kind: "异兽", realm: 0, hp: 50, atk: 14, def: 4, skill: "shadow_flame", desc: "出没草丛，喷出赤气。", palette: [0x301010, 0x801818, 0xe04030] },
  { id: "kuangdong_yao", name: "矿洞岩蜥", kind: "异兽", realm: 0, hp: 64, atk: 13, def: 8, skill: "basic_slash", desc: "厚皮岩蜥。", palette: [0x2a2420, 0x585048, 0x908878] },
  { id: "wuyin_lang", name: "雾隐狼", kind: "灵宠", realm: 1, hp: 90, atk: 22, def: 8, skill: "basic_slash", desc: "忠诚的狩猎搭档。", palette: [0x1a2030, 0x405060, 0x90a8b8] },
  { id: "cangyan_niu", name: "苍岩牛", kind: "异兽", realm: 1, hp: 120, atk: 20, def: 14, skill: "huti_zhenqi", desc: "可作坐骑的灵牛（目前只会顶人）。", palette: [0x202018, 0x505040, 0x909070] },
  { id: "bilin_xi", name: "碧鳞蜥", kind: "异兽", realm: 1, hp: 100, atk: 21, def: 12, skill: "frost_lance", desc: "鳞光如水。", palette: [0x103028, 0x208060, 0x60e0a0] },
  { id: "shijia_wei", name: "石甲卫", kind: "傀儡", realm: 1, hp: 150, atk: 18, def: 20, skill: "huti_zhenqi", desc: "笨重却可靠。", palette: [0x242428, 0x585860, 0xa0a0aa] },
  { id: "yanwen_hu", name: "炎纹虎", kind: "异兽", realm: 2, hp: 160, atk: 32, def: 14, skill: "danhuo_lianpo", desc: "火焰与兽性并存。", palette: [0x301008, 0x882010, 0xf06020] },
  { id: "xuanbing_chan", name: "玄冰蟾", kind: "灵宠", realm: 2, hp: 170, atk: 26, def: 18, skill: "frost_lance", desc: "蹲着也能打仗。", palette: [0x102030, 0x306090, 0xa0d8f0] },
  { id: "xuefu_shi", name: "血蝠王侍", kind: "异兽", realm: 2, hp: 140, atk: 34, def: 10, skill: "shadow_flame", desc: "夜战好手。", palette: [0x200810, 0x701028, 0xc04050] },
  { id: "leiwen_jiaoyou", name: "雷纹蛟幼", kind: "神兽", realm: 3, hp: 240, atk: 46, def: 16, skill: "lightning_call", desc: "神兽之苗，雷随其行。", palette: [0x101830, 0x2040a0, 0x80c0ff] },
  { id: "shihun_chi", name: "噬魂螭", kind: "神兽", realm: 5, hp: 400, atk: 72, def: 24, skill: "shadow_flame", desc: "极难收服的神兽。", palette: [0x180820, 0x501870, 0xc060e0] },
  { id: "jieyun_kui", name: "劫云傀", kind: "傀儡", realm: 6, hp: 500, atk: 80, def: 32, skill: "lightning_call", desc: "劫云铸就的战场傀儡。", palette: [0x181828, 0x404060, 0xd0d0f0] },
];

export const BEAST_MAP = Object.fromEntries(BEASTS.map((b) => [b.id, b]));

export function beastFromEnemy(id: string): BeastDef | undefined {
  return BEAST_MAP[id] ?? (ENEMIES.find((e) => e.id === id && e.beastKind)
    ? {
        id,
        name: ENEMIES.find((e) => e.id === id)!.name,
        kind: ENEMIES.find((e) => e.id === id)!.beastKind!,
        realm: ENEMIES.find((e) => e.id === id)!.realm,
        hp: ENEMIES.find((e) => e.id === id)!.hp,
        atk: ENEMIES.find((e) => e.id === id)!.atk,
        def: ENEMIES.find((e) => e.id === id)!.def,
        desc: ENEMIES.find((e) => e.id === id)!.desc,
        palette: ENEMIES.find((e) => e.id === id)!.palette,
      }
    : undefined);
}
