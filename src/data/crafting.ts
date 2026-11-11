import type { RecipeDef } from "../types";

export const RECIPES: RecipeDef[] = [
  { id: "r_heal", name: "回春丹", type: "alchemy", station: "cauldron", inputs: [{ id: "herb_ling", qty: 2 }, { id: "cinnabar", qty: 1 }], output: "heal_pill", outputQty: 2 },
  { id: "r_qi", name: "回气丹", type: "alchemy", station: "cauldron", inputs: [{ id: "herb_ling", qty: 1 }, { id: "spirit_wood", qty: 1 }], output: "qi_pill", outputQty: 2 },
  { id: "r_lingqi", name: "聚气丹", type: "alchemy", station: "cauldron", inputs: [{ id: "herb_ling", qty: 2 }, { id: "herb_frost", qty: 1 }, { id: "cinnabar", qty: 1 }], output: "lingqi_pill", outputQty: 1 },
  { id: "r_capture", name: "安魂丹", type: "alchemy", station: "cauldron", inputs: [{ id: "beast_core", qty: 1 }, { id: "herb_frost", qty: 2 }], output: "capture_pill", outputQty: 1 },
  { id: "r_trib", name: "避劫丹", type: "alchemy", station: "cauldron", inputs: [{ id: "thunder_shard", qty: 1 }, { id: "cinnabar", qty: 2 }, { id: "herb_frost", qty: 2 }], output: "trib_pill", outputQty: 1 },
  { id: "r_zhuji", name: "筑基丹", type: "alchemy", station: "cauldron", inputs: [{ id: "beast_core", qty: 2 }, { id: "cinnabar", qty: 2 }, { id: "herb_ling", qty: 3 }], output: "zhuji_pill", outputQty: 1 },
  { id: "r_bind", name: "拘灵符", type: "alchemy", station: "cauldron", inputs: [{ id: "spirit_wood", qty: 1 }, { id: "cinnabar", qty: 1 }], output: "talisman_bind", outputQty: 2 },
  { id: "ref_weapon", name: "炼器升阶", type: "refine", station: "furnace", inputs: [{ id: "ore_iron", qty: 2 }, { id: "cinnabar", qty: 1 }], output: "__refine__" },
  { id: "ref_high", name: "灵料淬炼", type: "refine", station: "furnace", inputs: [{ id: "ore_cold", qty: 1 }, { id: "beast_scale", qty: 1 }, { id: "cinnabar", qty: 1 }], output: "__refine_high__" },
];

export const RECIPE_MAP = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
