export const GranularityLevel = {
  MODEL: "Model",
  ITEM: "Item",
} as const;

export type GranularityLevel_TYPE = (typeof GranularityLevel)[keyof typeof GranularityLevel];
