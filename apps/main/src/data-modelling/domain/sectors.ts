export const Sector = {
  BATTERY: "Battery",
  TEXTILE: "Textile",
  ELECTRONICS: "Electronics",
  MACHINERY: "Machinery",
  AEROSPACE: "Aerospace",
  CONSTRUCTION: "Construction",
  MEDICAL: "Medical",
  HEALTHCARE: "Healthcare",
  EDUCATION: "Education",
  TRADE: "Trade",
  AGRICULTURE: "Agriculture",
  MINING: "Mining",
  OTHER: "Other",
} as const;

export type Sector_TYPE = (typeof Sector)[keyof typeof Sector];
