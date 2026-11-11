import type { RealmDef, StageDef } from "../types";

export const REALMS: RealmDef[] = [
  { id: "lianqi", name: "炼气", index: 0, color: 0x7ad0a0 },
  { id: "zhuji", name: "筑基", index: 1, color: 0x6ec8e0 },
  { id: "jindan", name: "金丹", index: 2, color: 0xe0c050 },
  { id: "yuanying", name: "元婴", index: 3, color: 0xd080e0 },
  { id: "huashen", name: "化神", index: 4, color: 0x80a0ff },
  { id: "lianxu", name: "炼虚", index: 5, color: 0xa0e0d0 },
  { id: "heti", name: "合体", index: 6, color: 0xf0a060 },
  { id: "dacheng", name: "大乘", index: 7, color: 0xf0e8a0 },
  { id: "dujie", name: "渡劫", index: 8, color: 0xc0d0ff },
  { id: "zhenxian", name: "真仙", index: 9, color: 0xfff8d0 },
];

export const STAGES: StageDef[] = [
  { id: "early", name: "前期", index: 0 },
  { id: "mid", name: "中期", index: 1 },
  { id: "late", name: "后期", index: 2 },
  { id: "peak", name: "圆满", index: 3 },
];

export function realmName(realm: number, stage: number): string {
  const r = REALMS[Math.max(0, Math.min(REALMS.length - 1, realm))];
  const s = STAGES[Math.max(0, Math.min(STAGES.length - 1, stage))];
  return `${r.name}${s.name}`;
}

export function expToBreakthrough(realm: number, stage: number): number {
  const base = [80, 160, 280, 450, 700, 1100, 1700, 2600, 4000, 6000][realm] ?? 8000;
  return Math.floor(base * (1 + stage * 0.45));
}

export function tribulationChance(realm: number, stage: number, resist: number): number {
  if (stage < 3) return Math.min(0.98, 0.86 + resist * 0.1);
  const hard = 0.72 - realm * 0.04 + resist * 0.12;
  return Math.max(0.35, Math.min(0.95, hard));
}

export function baseStats(realm: number, stage: number) {
  const t = realm * 4 + stage;
  return {
    maxHp: 80 + t * 18,
    maxMp: 40 + t * 10,
    maxLingqi: 100 + t * 25,
    atk: 8 + t * 3,
    def: 3 + t * 2,
  };
}

export const BREAKTHROUGH_PILLS: Record<number, string | undefined> = {
  1: "zhuji_pill",
  2: "jindan_pill",
  3: "yuanying_pill",
  4: "huashen_pill",
};
