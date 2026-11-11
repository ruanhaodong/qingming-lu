export const SAVE_KEY = "qingming-lu-save-v2";
export const WIDTH = 640;
export const HEIGHT = 360;
export const TILE_W = 32;
export const TILE_H = 32;

export type RealmId =
  | "lianqi" | "zhuji" | "jindan" | "yuanying" | "huashen"
  | "lianxu" | "heti" | "dacheng" | "dujie" | "zhenxian";

export type StageId = "early" | "mid" | "late" | "peak";

export type TreasureKind = "法器" | "灵宝" | "法宝" | "本命法宝" | "通天灵宝" | "玄天至宝";
export type GradeId = "凡品" | "黄品" | "玄品" | "地品" | "天品";
export type EquipSlot = "weapon" | "armor" | "accessory" | "artifact";
export type BeastKind = "傀儡" | "灵宠" | "异兽" | "神兽";
export type SkillSource = "传承" | "学习" | "武器携带" | "自创";
export type FactionId = "zheng" | "mo" | "san";
export type ItemKind =
  | "equip" | "pill" | "material" | "manual" | "talisman" | "quest" | "misc";

export interface RealmDef {
  id: RealmId;
  name: string;
  index: number;
  color: number;
}

export interface StageDef {
  id: StageId;
  name: string;
  index: number;
}

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  desc: string;
  icon: string;
  value: number;
  stack: number;
  slot?: EquipSlot;
  treasure?: TreasureKind;
  grade?: GradeId;
  atk?: number;
  def?: number;
  hp?: number;
  mp?: number;
  lingqiRate?: number;
  innateSkill?: string;
  realmMin?: number;
  healHp?: number;
  healMp?: number;
  lingqi?: number;
  tribulation?: number;
  capture?: number;
  cultivate?: number;
}

export interface InvItem {
  uid: string;
  id: string;
  qty: number;
  treasure?: TreasureKind;
  grade?: GradeId;
  plus?: number;
  atk?: number;
  def?: number;
  hp?: number;
  mp?: number;
  innateSkill?: string;
}

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  source: SkillSource;
  mp: number;
  cd: number;
  damage: number;
  range: number;
  radius: number;
  element: string;
  fx: string;
  palette?: string[];
  sect?: string;
  realmMin: number;
}

export interface LearnedSkill {
  id: string;
  source: SkillSource;
  custom?: boolean;
  name?: string;
  fx?: string;
  palette?: string[];
  damage?: number;
  element?: string;
  from?: string[];
}

export interface EnemyDef {
  id: string;
  name: string;
  realm: number;
  stage: number;
  kind: "beast" | "human" | "undead" | "construct" | "spirit" | "boss";
  beastKind?: BeastKind;
  hp: number;
  atk: number;
  def: number;
  speed: number;
  exp: number;
  lingqi: number;
  gold: number;
  loot: { id: string; p: number; min?: number; max?: number }[];
  capture?: { kind: BeastKind; chance: number };
  skills: string[];
  palette: number[];
  motif: string;
  desc: string;
  boss?: boolean;
  named?: boolean;
}

export interface BeastDef {
  id: string;
  name: string;
  kind: BeastKind;
  realm: number;
  hp: number;
  atk: number;
  def: number;
  skill?: string;
  desc: string;
  palette: number[];
}

export interface OwnedBeast {
  uid: string;
  defId: string;
  name: string;
  kind: BeastKind;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  summoned: boolean;
}

export interface SectDef {
  id: string;
  name: string;
  faction: FactionId;
  motto: string;
  heritage: string[];
  color: number;
  desc: string;
}

export interface QuestDef {
  id: string;
  name: string;
  kind: "main" | "side";
  region: string;
  desc: string;
  steps: { text: string; type: string; target?: string; count?: number }[];
  rewards: { gold?: number; exp?: number; lingqi?: number; items?: { id: string; qty: number }[] };
  unlock?: string[];
  autoOffer?: boolean;
}

export interface QuestState {
  id: string;
  step: number;
  progress: number;
  status: "offered" | "active" | "done" | "turned";
}

export interface RegionDef {
  id: string;
  name: string;
  desc: string;
  danger: number;
  mapSeed: number;
  size: number;
  biome: "village" | "mountain" | "ruins" | "coast" | "forbidden" | "dungeon";
  connections: string[];
  dungeon?: string;
  weather: string[];
  spawnTable: string[];
  gather: string[];
}

export interface RecipeDef {
  id: string;
  name: string;
  type: "alchemy" | "refine";
  inputs: { id: string; qty: number }[];
  output: string;
  outputQty?: number;
  station: "furnace" | "cauldron";
}

export interface WorldEventDef {
  id: string;
  name: string;
  desc: string;
  weight: number;
  duration: number;
  kind: "lingqi" | "secret" | "horde" | "duel" | "auction" | "tribulation" | "weather";
  regions?: string[];
}

export interface AuctionListing {
  uid: string;
  item: InvItem;
  buyout: number;
  bid: number;
  bidder?: string;
  seller: string;
  remain: number;
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  region: string;
  role: "elder" | "vendor" | "alchemist" | "smith" | "sect" | "auction" | "guard" | "wanderer" | "quest";
  lines: string[];
  shop?: string[];
  sect?: string;
  quests?: string[];
  palette: number[];
}

export interface SaveData {
  version: 1;
  name: string;
  seed: number;
  playTime: number;
  worldTime: number;
  region: string;
  tileX: number;
  tileY: number;
  facing: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  lingqi: number;
  maxLingqi: number;
  realm: number;
  stage: number;
  exp: number;
  gold: number;
  inventory: InvItem[];
  equipped: Partial<Record<EquipSlot, string>>;
  skills: LearnedSkill[];
  skillBar: (string | null)[];
  beasts: OwnedBeast[];
  sect?: string;
  faction: FactionId;
  standing: Record<string, number>;
  quests: QuestState[];
  discovered: string[];
  flags: Record<string, number | string | boolean>;
  knownRecipes: string[];
  auction: AuctionListing[];
  event?: { id: string; t: number; region: string } | null;
  nextEventAt: number;
  uidCursor: number;
}
