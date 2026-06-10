export const MARKETPLACE_CONDITION_OPTIONS = ["明顯使用", "五成新", "八成新", "九成新", "全新"] as const;
export const ALL_MARKETPLACE_CATEGORIES_LABEL = "全部";
export const MARKETPLACE_EXCHANGE_MODES = ["price", "treat_drink", "treat_food", "free", "custom"] as const;

export const MARKETPLACE_EXCHANGE_MODE_LABELS = {
  price: "價格",
  treat_drink: "請喝",
  treat_food: "請吃",
  free: "免費贈送",
  custom: "其他"
} as const;

export type MarketplaceConditionOption = (typeof MARKETPLACE_CONDITION_OPTIONS)[number];
export type MarketplaceExchangeModeOption = (typeof MARKETPLACE_EXCHANGE_MODES)[number];
