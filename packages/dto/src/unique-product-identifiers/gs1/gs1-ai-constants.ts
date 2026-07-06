/**
 * @generated DO NOT EDIT BY HAND
 *
 * Regenerate with: pnpm gen:gs1  (scripts/gs1-generator/index.mts)
 *
 * Provenance: GS1 Application Identifier registry — https://ref.gs1.org/ai/
 * Retrieved: 2026-07-06 (UTC), 541 entries
 * Upstream payload SHA-256: 01e985153cb17c9492a07da87a3d934bfe737db8be0a436ba56a7849e4762224
 *
 * Data © GS1 AISBL, published under the GS1 terms of use (factual standards
 * data, attribution given; no open-source license).
 *
 * Named-constant enum objects for the GS1 Application Identifiers, one per AI
 * kind, derived from gs1-ai-table.ts. Pure data + types, no I/O.
 *
 * Naming rule:
 * title -> trim -> strip parentheticals -> uppercase -> collapse
 * non-alphanumeric runs to "_" -> strip leading/trailing "_" -> fix known
 * misspelled words (INTERNATINAL -> INTERNATIONAL); members of a same-name
 * collision group within a kind carry a `_<AI>` suffix.
 */

/** GS1 primary identifier (key) Application Identifiers (type 'I' in the vendored AI table), keyed by derived name. */
export const Gs1KeyAi = {
  /** AI 00 — Serial Shipping Container Code (SSCC) */
  SERIAL_SHIPPING_CONTAINER_CODE: "00",
  /** AI 01 — Global Trade Item Number (GTIN) */
  GLOBAL_TRADE_ITEM_NUMBER: "01",
  /** AI 253 — Global Document Type Identifier (GDTI) */
  GLOBAL_DOCUMENT_TYPE_IDENTIFIER: "253",
  /** AI 255 — Global Coupon Number (GCN) */
  GLOBAL_COUPON_NUMBER: "255",
  /** AI 401 — Global Identification Number for Consignment (GINC) */
  GLOBAL_IDENTIFICATION_NUMBER_FOR_CONSIGNMENT: "401",
  /** AI 402 — Global Shipment Identification Number (GSIN) */
  GLOBAL_SHIPMENT_IDENTIFICATION_NUMBER: "402",
  /** AI 414 — Identification of a physical location - Global Location Number (GLN) */
  IDENTIFICATION_OF_A_PHYSICAL_LOCATION_GLOBAL_LOCATION_NUMBER: "414",
  /** AI 415 — Global Location Number (GLN) of the invoicing party */
  GLOBAL_LOCATION_NUMBER_OF_THE_INVOICING_PARTY: "415",
  /** AI 417 — Party Global Location Number (GLN) */
  PARTY_GLOBAL_LOCATION_NUMBER: "417",
  /** AI 8003 — Global Returnable Asset Identifier (GRAI) */
  GLOBAL_RETURNABLE_ASSET_IDENTIFIER: "8003",
  /** AI 8004 — Global Individual Asset Identifier (GIAI) */
  GLOBAL_INDIVIDUAL_ASSET_IDENTIFIER: "8004",
  /** AI 8006 — Identification of an individual trade item piece (ITIP) */
  IDENTIFICATION_OF_AN_INDIVIDUAL_TRADE_ITEM_PIECE: "8006",
  /** AI 8010 — Component/Part Identifier (CPID) */
  COMPONENT_PART_IDENTIFIER: "8010",
  /** AI 8013 — Global Model Number (GMN) */
  GLOBAL_MODEL_NUMBER: "8013",
  /** AI 8017 — Global Service Relation Number (GSRN) to identify the relationship between an organisation offering services and the provider of services */
  GLOBAL_SERVICE_RELATION_NUMBER_TO_IDENTIFY_THE_RELATIONSHIP_BETWEEN_AN_ORGANISATION_OFFERING_SERVICES_AND_THE_PROVIDER_OF_SERVICES:
    "8017",
  /** AI 8018 — Global Service Relation Number (GSRN) to identify the relationship between an organisation offering services and the recipient of services */
  GLOBAL_SERVICE_RELATION_NUMBER_TO_IDENTIFY_THE_RELATIONSHIP_BETWEEN_AN_ORGANISATION_OFFERING_SERVICES_AND_THE_RECIPIENT_OF_SERVICES:
    "8018",
} as const;

/** The union of Gs1KeyAi AI string values. */
export type Gs1KeyAi = (typeof Gs1KeyAi)[keyof typeof Gs1KeyAi];

/** GS1 key-qualifier Application Identifiers (type 'Q' in the vendored AI table), keyed by derived name. */
export const Gs1QualifierAi = {
  /** AI 10 — Batch or lot number */
  BATCH_OR_LOT_NUMBER: "10",
  /** AI 21 — Serial number */
  SERIAL_NUMBER: "21",
  /** AI 22 — Consumer product variant */
  CONSUMER_PRODUCT_VARIANT: "22",
  /** AI 235 — Third Party Controlled, Serialised Extension of Global Trade Item Number (GTIN) (TPX) */
  THIRD_PARTY_CONTROLLED_SERIALISED_EXTENSION_OF_GLOBAL_TRADE_ITEM_NUMBER: "235",
  /** AI 254 — Global Location Number (GLN) extension component */
  GLOBAL_LOCATION_NUMBER_EXTENSION_COMPONENT: "254",
  /** AI 7040 — GS1 UIC with Extension 1 and Importer index */
  GS1_UIC_WITH_EXTENSION_1_AND_IMPORTER_INDEX: "7040",
  /** AI 8011 — Component/Part Identifier serial number (CPID SERIAL) */
  COMPONENT_PART_IDENTIFIER_SERIAL_NUMBER: "8011",
  /** AI 8019 — Service Relation Instance Number (SRIN) */
  SERVICE_RELATION_INSTANCE_NUMBER: "8019",
  /** AI 8020 — Payment slip reference number */
  PAYMENT_SLIP_REFERENCE_NUMBER: "8020",
} as const;

/** The union of Gs1QualifierAi AI string values. */
export type Gs1QualifierAi = (typeof Gs1QualifierAi)[keyof typeof Gs1QualifierAi];

/** GS1 data-attribute (non-key) Application Identifiers (type 'D' in the vendored AI table), keyed by derived name. */
export const Gs1DataAttributeAi = {
  /** AI 02 — Global Trade Item Number (GTIN) of contained trade items */
  GLOBAL_TRADE_ITEM_NUMBER_OF_CONTAINED_TRADE_ITEMS: "02",
  /** AI 11 — Production date (YYMMDD) */
  PRODUCTION_DATE: "11",
  /** AI 12 — Due date (YYMMDD) */
  DUE_DATE: "12",
  /** AI 13 — Packaging date (YYMMDD) */
  PACKAGING_DATE: "13",
  /** AI 15 — Best before date (YYMMDD) */
  BEST_BEFORE_DATE: "15",
  /** AI 16 — Sell by date (YYMMDD) */
  SELL_BY_DATE: "16",
  /** AI 17 — Expiration date (YYMMDD) */
  EXPIRATION_DATE: "17",
  /** AI 20 — Internal product variant */
  INTERNAL_PRODUCT_VARIANT: "20",
  /** AI 240 — Additional product identification assigned by the manufacturer */
  ADDITIONAL_PRODUCT_IDENTIFICATION_ASSIGNED_BY_THE_MANUFACTURER: "240",
  /** AI 241 — Customer part number */
  CUSTOMER_PART_NUMBER: "241",
  /** AI 242 — Made-to-Order variation number */
  MADE_TO_ORDER_VARIATION_NUMBER: "242",
  /** AI 243 — Packaging component number */
  PACKAGING_COMPONENT_NUMBER: "243",
  /** AI 250 — Secondary serial number */
  SECONDARY_SERIAL_NUMBER: "250",
  /** AI 251 — Reference to source entity */
  REFERENCE_TO_SOURCE_ENTITY: "251",
  /** AI 30 — Variable count of items (variable measure trade item) */
  VARIABLE_COUNT_OF_ITEMS: "30",
  /** AI 3100 — Net weight, kilograms (variable measure trade item) */
  NET_WEIGHT_KILOGRAMS_3100: "3100",
  /** AI 3101 — Net weight, kilograms (variable measure trade item) */
  NET_WEIGHT_KILOGRAMS_3101: "3101",
  /** AI 3102 — Net weight, kilograms (variable measure trade item) */
  NET_WEIGHT_KILOGRAMS_3102: "3102",
  /** AI 3103 — Net weight, kilograms (variable measure trade item) */
  NET_WEIGHT_KILOGRAMS_3103: "3103",
  /** AI 3104 — Net weight, kilograms (variable measure trade item) */
  NET_WEIGHT_KILOGRAMS_3104: "3104",
  /** AI 3105 — Net weight, kilograms (variable measure trade item) */
  NET_WEIGHT_KILOGRAMS_3105: "3105",
  /** AI 3110 — Length or first dimension, metres (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_METRES_3110: "3110",
  /** AI 3111 — Length or first dimension, metres (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_METRES_3111: "3111",
  /** AI 3112 — Length or first dimension, metres (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_METRES_3112: "3112",
  /** AI 3113 — Length or first dimension, metres (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_METRES_3113: "3113",
  /** AI 3114 — Length or first dimension, metres (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_METRES_3114: "3114",
  /** AI 3115 — Length or first dimension, metres (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_METRES_3115: "3115",
  /** AI 3120 — Width, diameter, or second dimension, metres (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3120: "3120",
  /** AI 3121 — Width, diameter, or second dimension, metres (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3121: "3121",
  /** AI 3122 — Width, diameter, or second dimension, metres (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3122: "3122",
  /** AI 3123 — Width, diameter, or second dimension, metres (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3123: "3123",
  /** AI 3124 — Width, diameter, or second dimension, metres (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3124: "3124",
  /** AI 3125 — Width, diameter, or second dimension, metres (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3125: "3125",
  /** AI 3130 — Depth, thickness, height, or third dimension, metres (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3130: "3130",
  /** AI 3131 — Depth, thickness, height, or third dimension, metres (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3131: "3131",
  /** AI 3132 — Depth, thickness, height, or third dimension, metres (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3132: "3132",
  /** AI 3133 — Depth, thickness, height, or third dimension, metres (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3133: "3133",
  /** AI 3134 — Depth, thickness, height, or third dimension, metres (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3134: "3134",
  /** AI 3135 — Depth, thickness, height, or third dimension, metres (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3135: "3135",
  /** AI 3140 — Area, square metres (variable measure trade item) */
  AREA_SQUARE_METRES_3140: "3140",
  /** AI 3141 — Area, square metres (variable measure trade item) */
  AREA_SQUARE_METRES_3141: "3141",
  /** AI 3142 — Area, square metres (variable measure trade item) */
  AREA_SQUARE_METRES_3142: "3142",
  /** AI 3143 — Area, square metres (variable measure trade item) */
  AREA_SQUARE_METRES_3143: "3143",
  /** AI 3144 — Area, square metres (variable measure trade item) */
  AREA_SQUARE_METRES_3144: "3144",
  /** AI 3145 — Area, square metres (variable measure trade item) */
  AREA_SQUARE_METRES_3145: "3145",
  /** AI 3150 — Net volume, litres (variable measure trade item) */
  NET_VOLUME_LITRES_3150: "3150",
  /** AI 3151 — Net volume, litres (variable measure trade item) */
  NET_VOLUME_LITRES_3151: "3151",
  /** AI 3152 — Net volume, litres (variable measure trade item) */
  NET_VOLUME_LITRES_3152: "3152",
  /** AI 3153 — Net volume, litres (variable measure trade item) */
  NET_VOLUME_LITRES_3153: "3153",
  /** AI 3154 — Net volume, litres (variable measure trade item) */
  NET_VOLUME_LITRES_3154: "3154",
  /** AI 3155 — Net volume, litres (variable measure trade item) */
  NET_VOLUME_LITRES_3155: "3155",
  /** AI 3160 — Net volume, cubic metres (variable measure trade item) */
  NET_VOLUME_CUBIC_METRES_3160: "3160",
  /** AI 3161 — Net volume, cubic metres (variable measure trade item) */
  NET_VOLUME_CUBIC_METRES_3161: "3161",
  /** AI 3162 — Net volume, cubic metres (variable measure trade item) */
  NET_VOLUME_CUBIC_METRES_3162: "3162",
  /** AI 3163 — Net volume, cubic metres (variable measure trade item) */
  NET_VOLUME_CUBIC_METRES_3163: "3163",
  /** AI 3164 — Net volume, cubic metres (variable measure trade item) */
  NET_VOLUME_CUBIC_METRES_3164: "3164",
  /** AI 3165 — Net volume, cubic metres (variable measure trade item) */
  NET_VOLUME_CUBIC_METRES_3165: "3165",
  /** AI 3200 — Net weight, pounds (variable measure trade item) */
  NET_WEIGHT_POUNDS_3200: "3200",
  /** AI 3201 — Net weight, pounds (variable measure trade item) */
  NET_WEIGHT_POUNDS_3201: "3201",
  /** AI 3202 — Net weight, pounds (variable measure trade item) */
  NET_WEIGHT_POUNDS_3202: "3202",
  /** AI 3203 — Net weight, pounds (variable measure trade item) */
  NET_WEIGHT_POUNDS_3203: "3203",
  /** AI 3204 — Net weight, pounds (variable measure trade item) */
  NET_WEIGHT_POUNDS_3204: "3204",
  /** AI 3205 — Net weight, pounds (variable measure trade item) */
  NET_WEIGHT_POUNDS_3205: "3205",
  /** AI 3210 — Length or first dimension, inches (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3210: "3210",
  /** AI 3211 — Length or first dimension, inches (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3211: "3211",
  /** AI 3212 — Length or first dimension, inches (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3212: "3212",
  /** AI 3213 — Length or first dimension, inches (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3213: "3213",
  /** AI 3214 — Length or first dimension, inches (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3214: "3214",
  /** AI 3215 — Length or first dimension, inches (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3215: "3215",
  /** AI 3220 — Length or first dimension, feet (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_FEET_3220: "3220",
  /** AI 3221 — Length or first dimension, feet (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_FEET_3221: "3221",
  /** AI 3222 — Length or first dimension, feet (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_FEET_3222: "3222",
  /** AI 3223 — Length or first dimension, feet (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_FEET_3223: "3223",
  /** AI 3224 — Length or first dimension, feet (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_FEET_3224: "3224",
  /** AI 3225 — Length or first dimension, feet (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_FEET_3225: "3225",
  /** AI 3230 — Length or first dimension, yards (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3230: "3230",
  /** AI 3231 — Length or first dimension, yards (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3231: "3231",
  /** AI 3232 — Length or first dimension, yards (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3232: "3232",
  /** AI 3233 — Length or first dimension, yards (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3233: "3233",
  /** AI 3234 — Length or first dimension, yards (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3234: "3234",
  /** AI 3235 — Length or first dimension, yards (variable measure trade item) */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3235: "3235",
  /** AI 3240 — Width, diameter, or second dimension, inches (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3240: "3240",
  /** AI 3241 — Width, diameter, or second dimension, inches (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3241: "3241",
  /** AI 3242 — Width, diameter, or second dimension, inches (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3242: "3242",
  /** AI 3243 — Width, diameter, or second dimension, inches (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3243: "3243",
  /** AI 3244 — Width, diameter, or second dimension, inches (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3244: "3244",
  /** AI 3245 — Width, diameter, or second dimension, inches (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3245: "3245",
  /** AI 3250 — Width, diameter, or second dimension, feet (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3250: "3250",
  /** AI 3251 — Width, diameter, or second dimension, feet (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3251: "3251",
  /** AI 3252 — Width, diameter, or second dimension, feet (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3252: "3252",
  /** AI 3253 — Width, diameter, or second dimension, feet (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3253: "3253",
  /** AI 3254 — Width, diameter, or second dimension, feet (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3254: "3254",
  /** AI 3255 — Width, diameter, or second dimension, feet (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3255: "3255",
  /** AI 3260 — Width, diameter, or second dimension, yards (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARDS_3260: "3260",
  /** AI 3261 — Width, diameter, or second dimension, yards (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARDS_3261: "3261",
  /** AI 3262 — Width, diameter, or second dimension, yards (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARDS_3262: "3262",
  /** AI 3263 — Width, diameter, or second dimension, yards (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARDS_3263: "3263",
  /** AI 3264 — Width, diameter, or second dimension, yards (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARDS_3264: "3264",
  /** AI 3265 — Width, diameter, or second dimension, yards (variable measure trade item) */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARDS_3265: "3265",
  /** AI 3270 — Depth, thickness, height, or third dimension, inches (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3270: "3270",
  /** AI 3271 — Depth, thickness, height, or third dimension, inches (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3271: "3271",
  /** AI 3272 — Depth, thickness, height, or third dimension, inches (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3272: "3272",
  /** AI 3273 — Depth, thickness, height, or third dimension, inches (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3273: "3273",
  /** AI 3274 — Depth, thickness, height, or third dimension, inches (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3274: "3274",
  /** AI 3275 — Depth, thickness, height, or third dimension, inches (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3275: "3275",
  /** AI 3280 — Depth, thickness, height, or third dimension, feet (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3280: "3280",
  /** AI 3281 — Depth, thickness, height, or third dimension, feet (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3281: "3281",
  /** AI 3282 — Depth, thickness, height, or third dimension, feet (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3282: "3282",
  /** AI 3283 — Depth, thickness, height, or third dimension, feet (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3283: "3283",
  /** AI 3284 — Depth, thickness, height, or third dimension, feet (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3284: "3284",
  /** AI 3285 — Depth, thickness, height, or third dimension, feet (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3285: "3285",
  /** AI 3290 — Depth, thickness, height, or third dimension, yards (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3290: "3290",
  /** AI 3291 — Depth, thickness, height, or third dimension, yards (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3291: "3291",
  /** AI 3292 — Depth, thickness, height, or third dimension, yards (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3292: "3292",
  /** AI 3293 — Depth, thickness, height, or third dimension, yards (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3293: "3293",
  /** AI 3294 — Depth, thickness, height, or third dimension, yards (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3294: "3294",
  /** AI 3295 — Depth, thickness, height, or third dimension, yards (variable measure trade item) */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3295: "3295",
  /** AI 3300 — Logistic weight, kilograms */
  LOGISTIC_WEIGHT_KILOGRAMS_3300: "3300",
  /** AI 3301 — Logistic weight, kilograms */
  LOGISTIC_WEIGHT_KILOGRAMS_3301: "3301",
  /** AI 3302 — Logistic weight, kilograms */
  LOGISTIC_WEIGHT_KILOGRAMS_3302: "3302",
  /** AI 3303 — Logistic weight, kilograms */
  LOGISTIC_WEIGHT_KILOGRAMS_3303: "3303",
  /** AI 3304 — Logistic weight, kilograms */
  LOGISTIC_WEIGHT_KILOGRAMS_3304: "3304",
  /** AI 3305 — Logistic weight, kilograms */
  LOGISTIC_WEIGHT_KILOGRAMS_3305: "3305",
  /** AI 3310 — Length or first dimension, metres */
  LENGTH_OR_FIRST_DIMENSION_METRES_3310: "3310",
  /** AI 3311 — Length or first dimension, metres */
  LENGTH_OR_FIRST_DIMENSION_METRES_3311: "3311",
  /** AI 3312 — Length or first dimension, metres */
  LENGTH_OR_FIRST_DIMENSION_METRES_3312: "3312",
  /** AI 3313 — Length or first dimension, metres */
  LENGTH_OR_FIRST_DIMENSION_METRES_3313: "3313",
  /** AI 3314 — Length or first dimension, metres */
  LENGTH_OR_FIRST_DIMENSION_METRES_3314: "3314",
  /** AI 3315 — Length or first dimension, metres */
  LENGTH_OR_FIRST_DIMENSION_METRES_3315: "3315",
  /** AI 3320 — Width, diameter, or second dimension, metres */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3320: "3320",
  /** AI 3321 — Width, diameter, or second dimension, metres */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3321: "3321",
  /** AI 3322 — Width, diameter, or second dimension, metres */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3322: "3322",
  /** AI 3323 — Width, diameter, or second dimension, metres */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3323: "3323",
  /** AI 3324 — Width, diameter, or second dimension, metres */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3324: "3324",
  /** AI 3325 — Width, diameter, or second dimension, metres */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_METRES_3325: "3325",
  /** AI 3330 — Depth, thickness, height, or third dimension, metres */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3330: "3330",
  /** AI 3331 — Depth, thickness, height, or third dimension, metres */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3331: "3331",
  /** AI 3332 — Depth, thickness, height, or third dimension, metres */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3332: "3332",
  /** AI 3333 — Depth, thickness, height, or third dimension, metres */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3333: "3333",
  /** AI 3334 — Depth, thickness, height, or third dimension, metres */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3334: "3334",
  /** AI 3335 — Depth, thickness, height, or third dimension, metres */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_METRES_3335: "3335",
  /** AI 3340 — Area, square metres */
  AREA_SQUARE_METRES_3340: "3340",
  /** AI 3341 — Area, square metres */
  AREA_SQUARE_METRES_3341: "3341",
  /** AI 3342 — Area, square metres */
  AREA_SQUARE_METRES_3342: "3342",
  /** AI 3343 — Area, square metres */
  AREA_SQUARE_METRES_3343: "3343",
  /** AI 3344 — Area, square metres */
  AREA_SQUARE_METRES_3344: "3344",
  /** AI 3345 — Area, square metres */
  AREA_SQUARE_METRES_3345: "3345",
  /** AI 3350 — Logistic volume, litres */
  LOGISTIC_VOLUME_LITRES_3350: "3350",
  /** AI 3351 — Logistic volume, litres */
  LOGISTIC_VOLUME_LITRES_3351: "3351",
  /** AI 3352 — Logistic volume, litres */
  LOGISTIC_VOLUME_LITRES_3352: "3352",
  /** AI 3353 — Logistic volume, litres */
  LOGISTIC_VOLUME_LITRES_3353: "3353",
  /** AI 3354 — Logistic volume, litres */
  LOGISTIC_VOLUME_LITRES_3354: "3354",
  /** AI 3355 — Logistic volume, litres */
  LOGISTIC_VOLUME_LITRES_3355: "3355",
  /** AI 3360 — Logistic volume, cubic metres */
  LOGISTIC_VOLUME_CUBIC_METRES_3360: "3360",
  /** AI 3361 — Logistic volume, cubic metres */
  LOGISTIC_VOLUME_CUBIC_METRES_3361: "3361",
  /** AI 3362 — Logistic volume, cubic metres */
  LOGISTIC_VOLUME_CUBIC_METRES_3362: "3362",
  /** AI 3363 — Logistic volume, cubic metres */
  LOGISTIC_VOLUME_CUBIC_METRES_3363: "3363",
  /** AI 3364 — Logistic volume, cubic metres */
  LOGISTIC_VOLUME_CUBIC_METRES_3364: "3364",
  /** AI 3365 — Logistic volume, cubic metres */
  LOGISTIC_VOLUME_CUBIC_METRES_3365: "3365",
  /** AI 3370 — Kilograms per square metre */
  KILOGRAMS_PER_SQUARE_METRE_3370: "3370",
  /** AI 3371 — Kilograms per square metre */
  KILOGRAMS_PER_SQUARE_METRE_3371: "3371",
  /** AI 3372 — Kilograms per square metre */
  KILOGRAMS_PER_SQUARE_METRE_3372: "3372",
  /** AI 3373 — Kilograms per square metre */
  KILOGRAMS_PER_SQUARE_METRE_3373: "3373",
  /** AI 3374 — Kilograms per square metre */
  KILOGRAMS_PER_SQUARE_METRE_3374: "3374",
  /** AI 3375 — Kilograms per square metre */
  KILOGRAMS_PER_SQUARE_METRE_3375: "3375",
  /** AI 3400 — Logistic weight, pounds */
  LOGISTIC_WEIGHT_POUNDS_3400: "3400",
  /** AI 3401 — Logistic weight, pounds */
  LOGISTIC_WEIGHT_POUNDS_3401: "3401",
  /** AI 3402 — Logistic weight, pounds */
  LOGISTIC_WEIGHT_POUNDS_3402: "3402",
  /** AI 3403 — Logistic weight, pounds */
  LOGISTIC_WEIGHT_POUNDS_3403: "3403",
  /** AI 3404 — Logistic weight, pounds */
  LOGISTIC_WEIGHT_POUNDS_3404: "3404",
  /** AI 3405 — Logistic weight, pounds */
  LOGISTIC_WEIGHT_POUNDS_3405: "3405",
  /** AI 3410 — Length or first dimension, inches */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3410: "3410",
  /** AI 3411 — Length or first dimension, inches */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3411: "3411",
  /** AI 3412 — Length or first dimension, inches */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3412: "3412",
  /** AI 3413 — Length or first dimension, inches */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3413: "3413",
  /** AI 3414 — Length or first dimension, inches */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3414: "3414",
  /** AI 3415 — Length or first dimension, inches */
  LENGTH_OR_FIRST_DIMENSION_INCHES_3415: "3415",
  /** AI 3420 — Length or first dimension, feet */
  LENGTH_OR_FIRST_DIMENSION_FEET_3420: "3420",
  /** AI 3421 — Length or first dimension, feet */
  LENGTH_OR_FIRST_DIMENSION_FEET_3421: "3421",
  /** AI 3422 — Length or first dimension, feet */
  LENGTH_OR_FIRST_DIMENSION_FEET_3422: "3422",
  /** AI 3423 — Length or first dimension, feet */
  LENGTH_OR_FIRST_DIMENSION_FEET_3423: "3423",
  /** AI 3424 — Length or first dimension, feet */
  LENGTH_OR_FIRST_DIMENSION_FEET_3424: "3424",
  /** AI 3425 — Length or first dimension, feet */
  LENGTH_OR_FIRST_DIMENSION_FEET_3425: "3425",
  /** AI 3430 — Length or first dimension, yards */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3430: "3430",
  /** AI 3431 — Length or first dimension, yards */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3431: "3431",
  /** AI 3432 — Length or first dimension, yards */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3432: "3432",
  /** AI 3433 — Length or first dimension, yards */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3433: "3433",
  /** AI 3434 — Length or first dimension, yards */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3434: "3434",
  /** AI 3435 — Length or first dimension, yards */
  LENGTH_OR_FIRST_DIMENSION_YARDS_3435: "3435",
  /** AI 3440 — Width, diameter, or second dimension, inches */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3440: "3440",
  /** AI 3441 — Width, diameter, or second dimension, inches */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3441: "3441",
  /** AI 3442 — Width, diameter, or second dimension, inches */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3442: "3442",
  /** AI 3443 — Width, diameter, or second dimension, inches */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3443: "3443",
  /** AI 3444 — Width, diameter, or second dimension, inches */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3444: "3444",
  /** AI 3445 — Width, diameter, or second dimension, inches */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_INCHES_3445: "3445",
  /** AI 3450 — Width, diameter, or second dimension, feet */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3450: "3450",
  /** AI 3451 — Width, diameter, or second dimension, feet */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3451: "3451",
  /** AI 3452 — Width, diameter, or second dimension, feet */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3452: "3452",
  /** AI 3453 — Width, diameter, or second dimension, feet */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3453: "3453",
  /** AI 3454 — Width, diameter, or second dimension, feet */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3454: "3454",
  /** AI 3455 — Width, diameter, or second dimension, feet */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_FEET_3455: "3455",
  /** AI 3460 — Width, diameter, or second dimension, yard */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARD_3460: "3460",
  /** AI 3461 — Width, diameter, or second dimension, yard */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARD_3461: "3461",
  /** AI 3462 — Width, diameter, or second dimension, yard */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARD_3462: "3462",
  /** AI 3463 — Width, diameter, or second dimension, yard */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARD_3463: "3463",
  /** AI 3464 — Width, diameter, or second dimension, yard */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARD_3464: "3464",
  /** AI 3465 — Width, diameter, or second dimension, yard */
  WIDTH_DIAMETER_OR_SECOND_DIMENSION_YARD_3465: "3465",
  /** AI 3470 — Depth, thickness, height, or third dimension, inches */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3470: "3470",
  /** AI 3471 — Depth, thickness, height, or third dimension, inches */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3471: "3471",
  /** AI 3472 — Depth, thickness, height, or third dimension, inches */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3472: "3472",
  /** AI 3473 — Depth, thickness, height, or third dimension, inches */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3473: "3473",
  /** AI 3474 — Depth, thickness, height, or third dimension, inches */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3474: "3474",
  /** AI 3475 — Depth, thickness, height, or third dimension, inches */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_INCHES_3475: "3475",
  /** AI 3480 — Depth, thickness, height, or third dimension, feet */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3480: "3480",
  /** AI 3481 — Depth, thickness, height, or third dimension, feet */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3481: "3481",
  /** AI 3482 — Depth, thickness, height, or third dimension, feet */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3482: "3482",
  /** AI 3483 — Depth, thickness, height, or third dimension, feet */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3483: "3483",
  /** AI 3484 — Depth, thickness, height, or third dimension, feet */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3484: "3484",
  /** AI 3485 — Depth, thickness, height, or third dimension, feet */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_FEET_3485: "3485",
  /** AI 3490 — Depth, thickness, height, or third dimension, yards */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3490: "3490",
  /** AI 3491 — Depth, thickness, height, or third dimension, yards */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3491: "3491",
  /** AI 3492 — Depth, thickness, height, or third dimension, yards */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3492: "3492",
  /** AI 3493 — Depth, thickness, height, or third dimension, yards */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3493: "3493",
  /** AI 3494 — Depth, thickness, height, or third dimension, yards */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3494: "3494",
  /** AI 3495 — Depth, thickness, height, or third dimension, yards */
  DEPTH_THICKNESS_HEIGHT_OR_THIRD_DIMENSION_YARDS_3495: "3495",
  /** AI 3500 — Area, square inches (variable measure trade item) */
  AREA_SQUARE_INCHES_3500: "3500",
  /** AI 3501 — Area, square inches (variable measure trade item) */
  AREA_SQUARE_INCHES_3501: "3501",
  /** AI 3502 — Area, square inches (variable measure trade item) */
  AREA_SQUARE_INCHES_3502: "3502",
  /** AI 3503 — Area, square inches (variable measure trade item) */
  AREA_SQUARE_INCHES_3503: "3503",
  /** AI 3504 — Area, square inches (variable measure trade item) */
  AREA_SQUARE_INCHES_3504: "3504",
  /** AI 3505 — Area, square inches (variable measure trade item) */
  AREA_SQUARE_INCHES_3505: "3505",
  /** AI 3510 — Area, square feet (variable measure trade item) */
  AREA_SQUARE_FEET_3510: "3510",
  /** AI 3511 — Area, square feet (variable measure trade item) */
  AREA_SQUARE_FEET_3511: "3511",
  /** AI 3512 — Area, square feet (variable measure trade item) */
  AREA_SQUARE_FEET_3512: "3512",
  /** AI 3513 — Area, square feet (variable measure trade item) */
  AREA_SQUARE_FEET_3513: "3513",
  /** AI 3514 — Area, square feet (variable measure trade item) */
  AREA_SQUARE_FEET_3514: "3514",
  /** AI 3515 — Area, square feet (variable measure trade item) */
  AREA_SQUARE_FEET_3515: "3515",
  /** AI 3520 — Area, square yards (variable measure trade item) */
  AREA_SQUARE_YARDS_3520: "3520",
  /** AI 3521 — Area, square yards (variable measure trade item) */
  AREA_SQUARE_YARDS_3521: "3521",
  /** AI 3522 — Area, square yards (variable measure trade item) */
  AREA_SQUARE_YARDS_3522: "3522",
  /** AI 3523 — Area, square yards (variable measure trade item) */
  AREA_SQUARE_YARDS_3523: "3523",
  /** AI 3524 — Area, square yards (variable measure trade item) */
  AREA_SQUARE_YARDS_3524: "3524",
  /** AI 3525 — Area, square yards (variable measure trade item) */
  AREA_SQUARE_YARDS_3525: "3525",
  /** AI 3530 — Area, square inches */
  AREA_SQUARE_INCHES_3530: "3530",
  /** AI 3531 — Area, square inches */
  AREA_SQUARE_INCHES_3531: "3531",
  /** AI 3532 — Area, square inches */
  AREA_SQUARE_INCHES_3532: "3532",
  /** AI 3533 — Area, square inches */
  AREA_SQUARE_INCHES_3533: "3533",
  /** AI 3534 — Area, square inches */
  AREA_SQUARE_INCHES_3534: "3534",
  /** AI 3535 — Area, square inches */
  AREA_SQUARE_INCHES_3535: "3535",
  /** AI 3540 — Area, square feet */
  AREA_SQUARE_FEET_3540: "3540",
  /** AI 3541 — Area, square feet */
  AREA_SQUARE_FEET_3541: "3541",
  /** AI 3542 — Area, square feet */
  AREA_SQUARE_FEET_3542: "3542",
  /** AI 3543 — Area, square feet */
  AREA_SQUARE_FEET_3543: "3543",
  /** AI 3544 — Area, square feet */
  AREA_SQUARE_FEET_3544: "3544",
  /** AI 3545 — Area, square feet */
  AREA_SQUARE_FEET_3545: "3545",
  /** AI 3550 — Area, square yards */
  AREA_SQUARE_YARDS_3550: "3550",
  /** AI 3551 — Area, square yards */
  AREA_SQUARE_YARDS_3551: "3551",
  /** AI 3552 — Area, square yards */
  AREA_SQUARE_YARDS_3552: "3552",
  /** AI 3553 — Area, square yards */
  AREA_SQUARE_YARDS_3553: "3553",
  /** AI 3554 — Area, square yards */
  AREA_SQUARE_YARDS_3554: "3554",
  /** AI 3555 — Area, square yards */
  AREA_SQUARE_YARDS_3555: "3555",
  /** AI 3560 — Net weight, troy ounces (variable measure trade item) */
  NET_WEIGHT_TROY_OUNCES_3560: "3560",
  /** AI 3561 — Net weight, troy ounces (variable measure trade item) */
  NET_WEIGHT_TROY_OUNCES_3561: "3561",
  /** AI 3562 — Net weight, troy ounces (variable measure trade item) */
  NET_WEIGHT_TROY_OUNCES_3562: "3562",
  /** AI 3563 — Net weight, troy ounces (variable measure trade item) */
  NET_WEIGHT_TROY_OUNCES_3563: "3563",
  /** AI 3564 — Net weight, troy ounces (variable measure trade item) */
  NET_WEIGHT_TROY_OUNCES_3564: "3564",
  /** AI 3565 — Net weight, troy ounces (variable measure trade item) */
  NET_WEIGHT_TROY_OUNCES_3565: "3565",
  /** AI 3570 — Net weight (or volume), ounces (variable measure trade item) */
  NET_WEIGHT_OUNCES_3570: "3570",
  /** AI 3571 — Net weight (or volume), ounces (variable measure trade item) */
  NET_WEIGHT_OUNCES_3571: "3571",
  /** AI 3572 — Net weight (or volume), ounces (variable measure trade item) */
  NET_WEIGHT_OUNCES_3572: "3572",
  /** AI 3573 — Net weight (or volume), ounces (variable measure trade item) */
  NET_WEIGHT_OUNCES_3573: "3573",
  /** AI 3574 — Net weight (or volume), ounces (variable measure trade item) */
  NET_WEIGHT_OUNCES_3574: "3574",
  /** AI 3575 — Net weight (or volume), ounces (variable measure trade item) */
  NET_WEIGHT_OUNCES_3575: "3575",
  /** AI 3600 — Net volume, quarts (variable measure trade item) */
  NET_VOLUME_QUARTS_3600: "3600",
  /** AI 3601 — Net volume, quarts (variable measure trade item) */
  NET_VOLUME_QUARTS_3601: "3601",
  /** AI 3602 — Net volume, quarts (variable measure trade item) */
  NET_VOLUME_QUARTS_3602: "3602",
  /** AI 3603 — Net volume, quarts (variable measure trade item) */
  NET_VOLUME_QUARTS_3603: "3603",
  /** AI 3604 — Net volume, quarts (variable measure trade item) */
  NET_VOLUME_QUARTS_3604: "3604",
  /** AI 3605 — Net volume, quarts (variable measure trade item) */
  NET_VOLUME_QUARTS_3605: "3605",
  /** AI 3610 — Net volume, gallons U.S. (variable measure trade item) */
  NET_VOLUME_GALLONS_U_S_3610: "3610",
  /** AI 3611 — Net volume, gallons U.S. (variable measure trade item) */
  NET_VOLUME_GALLONS_U_S_3611: "3611",
  /** AI 3612 — Net volume, gallons U.S. (variable measure trade item) */
  NET_VOLUME_GALLONS_U_S_3612: "3612",
  /** AI 3613 — Net volume, gallons U.S. (variable measure trade item) */
  NET_VOLUME_GALLONS_U_S_3613: "3613",
  /** AI 3614 — Net volume, gallons U.S. (variable measure trade item) */
  NET_VOLUME_GALLONS_U_S_3614: "3614",
  /** AI 3615 — Net volume, gallons U.S. (variable measure trade item) */
  NET_VOLUME_GALLONS_U_S_3615: "3615",
  /** AI 3620 — Logistic volume, quarts */
  LOGISTIC_VOLUME_QUARTS_3620: "3620",
  /** AI 3621 — Logistic volume, quarts */
  LOGISTIC_VOLUME_QUARTS_3621: "3621",
  /** AI 3622 — Logistic volume, quarts */
  LOGISTIC_VOLUME_QUARTS_3622: "3622",
  /** AI 3623 — Logistic volume, quarts */
  LOGISTIC_VOLUME_QUARTS_3623: "3623",
  /** AI 3624 — Logistic volume, quarts */
  LOGISTIC_VOLUME_QUARTS_3624: "3624",
  /** AI 3625 — Logistic volume, quarts */
  LOGISTIC_VOLUME_QUARTS_3625: "3625",
  /** AI 3630 — Logistic volume, gallons U.S. */
  LOGISTIC_VOLUME_GALLONS_U_S_3630: "3630",
  /** AI 3631 — Logistic volume, gallons U.S. */
  LOGISTIC_VOLUME_GALLONS_U_S_3631: "3631",
  /** AI 3632 — Logistic volume, gallons U.S. */
  LOGISTIC_VOLUME_GALLONS_U_S_3632: "3632",
  /** AI 3633 — Logistic volume, gallons U.S. */
  LOGISTIC_VOLUME_GALLONS_U_S_3633: "3633",
  /** AI 3634 — Logistic volume, gallons U.S. */
  LOGISTIC_VOLUME_GALLONS_U_S_3634: "3634",
  /** AI 3635 — Logistic volume, gallons U.S. */
  LOGISTIC_VOLUME_GALLONS_U_S_3635: "3635",
  /** AI 3640 — Net volume, cubic inches (variable measure trade item) */
  NET_VOLUME_CUBIC_INCHES_3640: "3640",
  /** AI 3641 — Net volume, cubic inches (variable measure trade item) */
  NET_VOLUME_CUBIC_INCHES_3641: "3641",
  /** AI 3642 — Net volume, cubic inches (variable measure trade item) */
  NET_VOLUME_CUBIC_INCHES_3642: "3642",
  /** AI 3643 — Net volume, cubic inches (variable measure trade item) */
  NET_VOLUME_CUBIC_INCHES_3643: "3643",
  /** AI 3644 — Net volume, cubic inches (variable measure trade item) */
  NET_VOLUME_CUBIC_INCHES_3644: "3644",
  /** AI 3645 — Net volume, cubic inches (variable measure trade item) */
  NET_VOLUME_CUBIC_INCHES_3645: "3645",
  /** AI 3650 — Net volume, cubic feet (variable measure trade item) */
  NET_VOLUME_CUBIC_FEET_3650: "3650",
  /** AI 3651 — Net volume, cubic feet (variable measure trade item) */
  NET_VOLUME_CUBIC_FEET_3651: "3651",
  /** AI 3652 — Net volume, cubic feet (variable measure trade item) */
  NET_VOLUME_CUBIC_FEET_3652: "3652",
  /** AI 3653 — Net volume, cubic feet (variable measure trade item) */
  NET_VOLUME_CUBIC_FEET_3653: "3653",
  /** AI 3654 — Net volume, cubic feet (variable measure trade item) */
  NET_VOLUME_CUBIC_FEET_3654: "3654",
  /** AI 3655 — Net volume, cubic feet (variable measure trade item) */
  NET_VOLUME_CUBIC_FEET_3655: "3655",
  /** AI 3660 — Net volume, cubic yards (variable measure trade item) */
  NET_VOLUME_CUBIC_YARDS_3660: "3660",
  /** AI 3661 — Net volume, cubic yards (variable measure trade item) */
  NET_VOLUME_CUBIC_YARDS_3661: "3661",
  /** AI 3662 — Net volume, cubic yards (variable measure trade item) */
  NET_VOLUME_CUBIC_YARDS_3662: "3662",
  /** AI 3663 — Net volume, cubic yards (variable measure trade item) */
  NET_VOLUME_CUBIC_YARDS_3663: "3663",
  /** AI 3664 — Net volume, cubic yards (variable measure trade item) */
  NET_VOLUME_CUBIC_YARDS_3664: "3664",
  /** AI 3665 — Net volume, cubic yards (variable measure trade item) */
  NET_VOLUME_CUBIC_YARDS_3665: "3665",
  /** AI 3670 — Logistic volume, cubic inches */
  LOGISTIC_VOLUME_CUBIC_INCHES_3670: "3670",
  /** AI 3671 — Logistic volume, cubic inches */
  LOGISTIC_VOLUME_CUBIC_INCHES_3671: "3671",
  /** AI 3672 — Logistic volume, cubic inches */
  LOGISTIC_VOLUME_CUBIC_INCHES_3672: "3672",
  /** AI 3673 — Logistic volume, cubic inches */
  LOGISTIC_VOLUME_CUBIC_INCHES_3673: "3673",
  /** AI 3674 — Logistic volume, cubic inches */
  LOGISTIC_VOLUME_CUBIC_INCHES_3674: "3674",
  /** AI 3675 — Logistic volume, cubic inches */
  LOGISTIC_VOLUME_CUBIC_INCHES_3675: "3675",
  /** AI 3680 — Logistic volume, cubic feet */
  LOGISTIC_VOLUME_CUBIC_FEET_3680: "3680",
  /** AI 3681 — Logistic volume, cubic feet */
  LOGISTIC_VOLUME_CUBIC_FEET_3681: "3681",
  /** AI 3682 — Logistic volume, cubic feet */
  LOGISTIC_VOLUME_CUBIC_FEET_3682: "3682",
  /** AI 3683 — Logistic volume, cubic feet */
  LOGISTIC_VOLUME_CUBIC_FEET_3683: "3683",
  /** AI 3684 — Logistic volume, cubic feet */
  LOGISTIC_VOLUME_CUBIC_FEET_3684: "3684",
  /** AI 3685 — Logistic volume, cubic feet */
  LOGISTIC_VOLUME_CUBIC_FEET_3685: "3685",
  /** AI 3690 — Logistic volume, cubic yards */
  LOGISTIC_VOLUME_CUBIC_YARDS_3690: "3690",
  /** AI 3691 — Logistic volume, cubic yards */
  LOGISTIC_VOLUME_CUBIC_YARDS_3691: "3691",
  /** AI 3692 — Logistic volume, cubic yards */
  LOGISTIC_VOLUME_CUBIC_YARDS_3692: "3692",
  /** AI 3693 — Logistic volume, cubic yards */
  LOGISTIC_VOLUME_CUBIC_YARDS_3693: "3693",
  /** AI 3694 — Logistic volume, cubic yards */
  LOGISTIC_VOLUME_CUBIC_YARDS_3694: "3694",
  /** AI 3695 — Logistic volume, cubic yards */
  LOGISTIC_VOLUME_CUBIC_YARDS_3695: "3695",
  /** AI 37 — Count of trade items or trade item pieces contained in a logistic unit */
  COUNT_OF_TRADE_ITEMS_OR_TRADE_ITEM_PIECES_CONTAINED_IN_A_LOGISTIC_UNIT: "37",
  /** AI 3900 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3900: "3900",
  /** AI 3901 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3901: "3901",
  /** AI 3902 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3902: "3902",
  /** AI 3903 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3903: "3903",
  /** AI 3904 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3904: "3904",
  /** AI 3905 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3905: "3905",
  /** AI 3906 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3906: "3906",
  /** AI 3907 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3907: "3907",
  /** AI 3908 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3908: "3908",
  /** AI 3909 — Applicable amount payable or Coupon value, local currency */
  APPLICABLE_AMOUNT_PAYABLE_OR_COUPON_VALUE_LOCAL_CURRENCY_3909: "3909",
  /** AI 3910 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3910: "3910",
  /** AI 3911 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3911: "3911",
  /** AI 3912 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3912: "3912",
  /** AI 3913 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3913: "3913",
  /** AI 3914 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3914: "3914",
  /** AI 3915 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3915: "3915",
  /** AI 3916 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3916: "3916",
  /** AI 3917 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3917: "3917",
  /** AI 3918 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3918: "3918",
  /** AI 3919 — Applicable amount payable with ISO currency code */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3919: "3919",
  /** AI 3920 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3920: "3920",
  /** AI 3921 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3921: "3921",
  /** AI 3922 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3922: "3922",
  /** AI 3923 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3923: "3923",
  /** AI 3924 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3924: "3924",
  /** AI 3925 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3925: "3925",
  /** AI 3926 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3926: "3926",
  /** AI 3927 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3927: "3927",
  /** AI 3928 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3928: "3928",
  /** AI 3929 — Applicable amount payable, single monetary area (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_SINGLE_MONETARY_AREA_3929: "3929",
  /** AI 3930 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3930: "3930",
  /** AI 3931 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3931: "3931",
  /** AI 3932 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3932: "3932",
  /** AI 3933 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3933: "3933",
  /** AI 3934 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3934: "3934",
  /** AI 3935 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3935: "3935",
  /** AI 3936 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3936: "3936",
  /** AI 3937 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3937: "3937",
  /** AI 3938 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3938: "3938",
  /** AI 3939 — Applicable amount payable with ISO currency code (variable measure trade item) */
  APPLICABLE_AMOUNT_PAYABLE_WITH_ISO_CURRENCY_CODE_3939: "3939",
  /** AI 3940 — Percentage discount of a coupon */
  PERCENTAGE_DISCOUNT_OF_A_COUPON_3940: "3940",
  /** AI 3941 — Percentage discount of a coupon */
  PERCENTAGE_DISCOUNT_OF_A_COUPON_3941: "3941",
  /** AI 3942 — Percentage discount of a coupon */
  PERCENTAGE_DISCOUNT_OF_A_COUPON_3942: "3942",
  /** AI 3943 — Percentage discount of a coupon */
  PERCENTAGE_DISCOUNT_OF_A_COUPON_3943: "3943",
  /** AI 3950 — Amount Payable per unit of measure single monetary area (variable measure trade item) */
  AMOUNT_PAYABLE_PER_UNIT_OF_MEASURE_SINGLE_MONETARY_AREA_3950: "3950",
  /** AI 3951 — Amount Payable per unit of measure single monetary area (variable measure trade item) */
  AMOUNT_PAYABLE_PER_UNIT_OF_MEASURE_SINGLE_MONETARY_AREA_3951: "3951",
  /** AI 3952 — Amount Payable per unit of measure single monetary area (variable measure trade item) */
  AMOUNT_PAYABLE_PER_UNIT_OF_MEASURE_SINGLE_MONETARY_AREA_3952: "3952",
  /** AI 3953 — Amount Payable per unit of measure single monetary area (variable measure trade item) */
  AMOUNT_PAYABLE_PER_UNIT_OF_MEASURE_SINGLE_MONETARY_AREA_3953: "3953",
  /** AI 3954 — Amount Payable per unit of measure single monetary area (variable measure trade item) */
  AMOUNT_PAYABLE_PER_UNIT_OF_MEASURE_SINGLE_MONETARY_AREA_3954: "3954",
  /** AI 3955 — Amount Payable per unit of measure single monetary area (variable measure trade item) */
  AMOUNT_PAYABLE_PER_UNIT_OF_MEASURE_SINGLE_MONETARY_AREA_3955: "3955",
  /** AI 400 — Customers purchase order number */
  CUSTOMERS_PURCHASE_ORDER_NUMBER: "400",
  /** AI 403 — Routing code */
  ROUTING_CODE: "403",
  /** AI 410 — Ship to / Deliver to Global Location Number (GLN) */
  SHIP_TO_DELIVER_TO_GLOBAL_LOCATION_NUMBER: "410",
  /** AI 411 — Bill to / Invoice to Global Location Number (GLN) */
  BILL_TO_INVOICE_TO_GLOBAL_LOCATION_NUMBER: "411",
  /** AI 412 — Purchased from Global Location Number (GLN) */
  PURCHASED_FROM_GLOBAL_LOCATION_NUMBER: "412",
  /** AI 413 — Ship for / Deliver for - Forward to Global Location Number (GLN) */
  SHIP_FOR_DELIVER_FOR_FORWARD_TO_GLOBAL_LOCATION_NUMBER: "413",
  /** AI 416 — Global Location Number (GLN) of the production or service location */
  GLOBAL_LOCATION_NUMBER_OF_THE_PRODUCTION_OR_SERVICE_LOCATION: "416",
  /** AI 420 — Ship to / Deliver to postal code within a single postal authority */
  SHIP_TO_DELIVER_TO_POSTAL_CODE_WITHIN_A_SINGLE_POSTAL_AUTHORITY: "420",
  /** AI 421 — Ship to / Deliver to postal code with ISO country code */
  SHIP_TO_DELIVER_TO_POSTAL_CODE_WITH_ISO_COUNTRY_CODE: "421",
  /** AI 422 — Country of origin of a trade item */
  COUNTRY_OF_ORIGIN_OF_A_TRADE_ITEM: "422",
  /** AI 423 — Country of initial processing */
  COUNTRY_OF_INITIAL_PROCESSING: "423",
  /** AI 424 — Country of processing */
  COUNTRY_OF_PROCESSING: "424",
  /** AI 425 — Country of disassembly */
  COUNTRY_OF_DISASSEMBLY: "425",
  /** AI 426 — Country covering full process chain */
  COUNTRY_COVERING_FULL_PROCESS_CHAIN: "426",
  /** AI 427 — Country subdivision Of origin */
  COUNTRY_SUBDIVISION_OF_ORIGIN: "427",
  /** AI 4300 — Ship-to / Deliver-to company name */
  SHIP_TO_DELIVER_TO_COMPANY_NAME: "4300",
  /** AI 4301 — Ship-to / Deliver-to contact */
  SHIP_TO_DELIVER_TO_CONTACT: "4301",
  /** AI 4302 — Ship-to / Deliver-to address line 1 */
  SHIP_TO_DELIVER_TO_ADDRESS_LINE_1: "4302",
  /** AI 4303 — Ship-to / Deliver-to address line 2 */
  SHIP_TO_DELIVER_TO_ADDRESS_LINE_2: "4303",
  /** AI 4304 — Ship-to / Deliver-to suburb */
  SHIP_TO_DELIVER_TO_SUBURB: "4304",
  /** AI 4305 — Ship-to / Deliver-to locality */
  SHIP_TO_DELIVER_TO_LOCALITY: "4305",
  /** AI 4306 — Ship-to / Deliver-to region */
  SHIP_TO_DELIVER_TO_REGION: "4306",
  /** AI 4307 — Ship-to / Deliver-to country code */
  SHIP_TO_DELIVER_TO_COUNTRY_CODE: "4307",
  /** AI 4308 — Ship-to / Deliver-to telephone number */
  SHIP_TO_DELIVER_TO_TELEPHONE_NUMBER: "4308",
  /** AI 4309 — Ship-to / Deliver-to GEO location */
  SHIP_TO_DELIVER_TO_GEO_LOCATION: "4309",
  /** AI 4310 — Return-to company name */
  RETURN_TO_COMPANY_NAME: "4310",
  /** AI 4311 — Return-to contact */
  RETURN_TO_CONTACT: "4311",
  /** AI 4312 — Return-to address line 1 */
  RETURN_TO_ADDRESS_LINE_1: "4312",
  /** AI 4313 — Return-to address line 2 */
  RETURN_TO_ADDRESS_LINE_2: "4313",
  /** AI 4314 — Return-to suburb */
  RETURN_TO_SUBURB: "4314",
  /** AI 4315 — Return-to locality */
  RETURN_TO_LOCALITY: "4315",
  /** AI 4316 — Return-to region */
  RETURN_TO_REGION: "4316",
  /** AI 4317 — Return-to country code */
  RETURN_TO_COUNTRY_CODE: "4317",
  /** AI 4318 — Return-to postal code */
  RETURN_TO_POSTAL_CODE: "4318",
  /** AI 4319 — Return-to telephone number */
  RETURN_TO_TELEPHONE_NUMBER: "4319",
  /** AI 4320 — Service code description */
  SERVICE_CODE_DESCRIPTION: "4320",
  /** AI 4321 — Dangerous goods flag */
  DANGEROUS_GOODS_FLAG: "4321",
  /** AI 4322 — Authority to leave */
  AUTHORITY_TO_LEAVE: "4322",
  /** AI 4323 — Signature required flag */
  SIGNATURE_REQUIRED_FLAG: "4323",
  /** AI 4324 — Not before delivery date time (YYMMDDhhmm) */
  NOT_BEFORE_DELIVERY_DATE_TIME: "4324",
  /** AI 4325 — Not after delivery date time (YYMMDDhhmm) */
  NOT_AFTER_DELIVERY_DATE_TIME: "4325",
  /** AI 4326 — Release date (YYMMDD) */
  RELEASE_DATE: "4326",
  /** AI 4330 — Maximum temperature in Fahrenheit (expressed in hundredths of degrees) */
  MAXIMUM_TEMPERATURE_IN_FAHRENHEIT: "4330",
  /** AI 4331 — Maximum temperature in Celsius (expressed in hundredths of degrees) */
  MAXIMUM_TEMPERATURE_IN_CELSIUS: "4331",
  /** AI 4332 — Minimum temperature in Fahrenheit (expressed in hundredths of degrees) */
  MINIMUM_TEMPERATURE_IN_FAHRENHEIT: "4332",
  /** AI 4333 — Minimum temperature in Celsius (expressed in hundredths of degrees) */
  MINIMUM_TEMPERATURE_IN_CELSIUS: "4333",
  /** AI 7001 — NATO Stock Number (NSN) */
  NATO_STOCK_NUMBER: "7001",
  /** AI 7002 — UN/ECE meat carcasses and cuts classification */
  UN_ECE_MEAT_CARCASSES_AND_CUTS_CLASSIFICATION: "7002",
  /** AI 7003 — Expiration date and time (YYMMDDhhmm) */
  EXPIRATION_DATE_AND_TIME: "7003",
  /** AI 7004 — Active potency */
  ACTIVE_POTENCY: "7004",
  /** AI 7005 — Catch area */
  CATCH_AREA: "7005",
  /** AI 7006 — First freeze date (YYMMDD) */
  FIRST_FREEZE_DATE: "7006",
  /** AI 7007 — Harvest date (YYMMDD[YYMMDD]) */
  HARVEST_DATE: "7007",
  /** AI 7008 — Species for fishery purposes */
  SPECIES_FOR_FISHERY_PURPOSES: "7008",
  /** AI 7009 — Fishing gear type */
  FISHING_GEAR_TYPE: "7009",
  /** AI 7010 — Production method */
  PRODUCTION_METHOD: "7010",
  /** AI 7011 — Test by date (YYMMDD[hhmm]) */
  TEST_BY_DATE: "7011",
  /** AI 7020 — Refurbishment lot ID */
  REFURBISHMENT_LOT_ID: "7020",
  /** AI 7021 — Functional status */
  FUNCTIONAL_STATUS: "7021",
  /** AI 7022 — Revision status */
  REVISION_STATUS: "7022",
  /** AI 7023 — Global Individual Asset Identifier (GIAI) of an assembly */
  GLOBAL_INDIVIDUAL_ASSET_IDENTIFIER_OF_AN_ASSEMBLY: "7023",
  /** AI 7030 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7030: "7030",
  /** AI 7031 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7031: "7031",
  /** AI 7032 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7032: "7032",
  /** AI 7033 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7033: "7033",
  /** AI 7034 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7034: "7034",
  /** AI 7035 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7035: "7035",
  /** AI 7036 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7036: "7036",
  /** AI 7037 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7037: "7037",
  /** AI 7038 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7038: "7038",
  /** AI 7039 — Number of processor with three-digit ISO country code */
  NUMBER_OF_PROCESSOR_WITH_THREE_DIGIT_ISO_COUNTRY_CODE_7039: "7039",
  /** AI 710 — National Healthcare Reimbursement Number (NHRN) - Germany PZN */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_GERMANY_PZN: "710",
  /** AI 711 — National Healthcare Reimbursement Number (NHRN) - France CIP */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_FRANCE_CIP: "711",
  /** AI 712 — National Healthcare Reimbursement Number (NHRN) - Spain CN */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_SPAIN_CN: "712",
  /** AI 713 — National Healthcare Reimbursement Number (NHRN) - Brasil DRN */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_BRASIL_DRN: "713",
  /** AI 714 — National Healthcare Reimbursement Number (NHRN) - Portugal AIM */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_PORTUGAL_AIM: "714",
  /** AI 715 — National Healthcare Reimbursement Number (NHRN) - United States of America NDC */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_UNITED_STATES_OF_AMERICA_NDC: "715",
  /** AI 716 — National Healthcare Reimbursement Number (NHRN) - Italy AIC */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_ITALY_AIC: "716",
  /** AI 717 — National Healthcare Reimbursement Number (NHRN) - Costa Rica Sanitary Register Number */
  NATIONAL_HEALTHCARE_REIMBURSEMENT_NUMBER_COSTA_RICA_SANITARY_REGISTER_NUMBER: "717",
  /** AI 7230 — Certification Reference */
  CERTIFICATION_REFERENCE_7230: "7230",
  /** AI 7231 — Certification Reference */
  CERTIFICATION_REFERENCE_7231: "7231",
  /** AI 7232 — Certification Reference */
  CERTIFICATION_REFERENCE_7232: "7232",
  /** AI 7233 — Certification Reference */
  CERTIFICATION_REFERENCE_7233: "7233",
  /** AI 7234 — Certification Reference */
  CERTIFICATION_REFERENCE_7234: "7234",
  /** AI 7235 — Certification Reference */
  CERTIFICATION_REFERENCE_7235: "7235",
  /** AI 7236 — Certification Reference */
  CERTIFICATION_REFERENCE_7236: "7236",
  /** AI 7237 — Certification Reference */
  CERTIFICATION_REFERENCE_7237: "7237",
  /** AI 7238 — Certification Reference */
  CERTIFICATION_REFERENCE_7238: "7238",
  /** AI 7239 — Certification Reference */
  CERTIFICATION_REFERENCE_7239: "7239",
  /** AI 7240 — Protocol ID */
  PROTOCOL_ID: "7240",
  /** AI 7241 — AIDC media type */
  AIDC_MEDIA_TYPE: "7241",
  /** AI 7242 — Version Control Number (VCN) */
  VERSION_CONTROL_NUMBER: "7242",
  /** AI 7250 — Date of birth (YYYYMMDD) */
  DATE_OF_BIRTH: "7250",
  /** AI 7251 — Date and time of birth (YYYYMMDDhhmm) */
  DATE_AND_TIME_OF_BIRTH: "7251",
  /** AI 7252 — Biological sex */
  BIOLOGICAL_SEX: "7252",
  /** AI 7253 — Family name of person */
  FAMILY_NAME_OF_PERSON: "7253",
  /** AI 7254 — Given name of person */
  GIVEN_NAME_OF_PERSON: "7254",
  /** AI 7255 — Name suffix of person */
  NAME_SUFFIX_OF_PERSON: "7255",
  /** AI 7256 — Full name of person */
  FULL_NAME_OF_PERSON: "7256",
  /** AI 7257 — Address of person */
  ADDRESS_OF_PERSON: "7257",
  /** AI 7258 — Baby birth sequence */
  BABY_BIRTH_SEQUENCE: "7258",
  /** AI 7259 — Baby of family name */
  BABY_OF_FAMILY_NAME: "7259",
  /** AI 8001 — Roll products (width, length, core diameter, direction, splices) */
  ROLL_PRODUCTS: "8001",
  /** AI 8002 — Cellular mobile telephone identifier */
  CELLULAR_MOBILE_TELEPHONE_IDENTIFIER: "8002",
  /** AI 8005 — Price per unit of measure */
  PRICE_PER_UNIT_OF_MEASURE: "8005",
  /** AI 8007 — International Bank Account Number (IBAN) */
  INTERNATIONAL_BANK_ACCOUNT_NUMBER: "8007",
  /** AI 8008 — Date and time of production (YYMMDDhh[mm[ss]]) */
  DATE_AND_TIME_OF_PRODUCTION: "8008",
  /** AI 8009 — Optically Readable Sensor Indicator */
  OPTICALLY_READABLE_SENSOR_INDICATOR: "8009",
  /** AI 8012 — Software version */
  SOFTWARE_VERSION: "8012",
  /** AI 8026 — Identification of pieces of a trade item (ITIP) contained in a logistic unit */
  IDENTIFICATION_OF_PIECES_OF_A_TRADE_ITEM_CONTAINED_IN_A_LOGISTIC_UNIT: "8026",
  /** AI 8030 — Digital Signature (DigSig) */
  DIGITAL_SIGNATURE: "8030",
  /** AI 8040 — Internatinal Mobile Equipment Identity (IMEI) */
  INTERNATIONAL_MOBILE_EQUIPMENT_IDENTITY: "8040",
  /** AI 8041 — Internatinal Mobile Equipment Identity 2 (IMEI2) */
  INTERNATIONAL_MOBILE_EQUIPMENT_IDENTITY_2: "8041",
  /** AI 8042 — Embedded SIM number */
  EMBEDDED_SIM_NUMBER: "8042",
  /** AI 8043 — Physical SIM number */
  PHYSICAL_SIM_NUMBER: "8043",
  /** AI 8110 — Coupon code identification for use in North America */
  COUPON_CODE_IDENTIFICATION_FOR_USE_IN_NORTH_AMERICA: "8110",
  /** AI 8111 — Loyalty points of a coupon */
  LOYALTY_POINTS_OF_A_COUPON: "8111",
  /** AI 8112 — Positive offer file coupon code identification for use in North America */
  POSITIVE_OFFER_FILE_COUPON_CODE_IDENTIFICATION_FOR_USE_IN_NORTH_AMERICA: "8112",
  /** AI 90 — Information mutually agreed between trading partners */
  INFORMATION_MUTUALLY_AGREED_BETWEEN_TRADING_PARTNERS: "90",
  /** AI 91 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_91: "91",
  /** AI 92 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_92: "92",
  /** AI 93 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_93: "93",
  /** AI 94 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_94: "94",
  /** AI 95 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_95: "95",
  /** AI 96 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_96: "96",
  /** AI 97 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_97: "97",
  /** AI 98 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_98: "98",
  /** AI 99 — Company internal information */
  COMPANY_INTERNAL_INFORMATION_99: "99",
} as const;

/** The union of Gs1DataAttributeAi AI string values. */
export type Gs1DataAttributeAi = (typeof Gs1DataAttributeAi)[keyof typeof Gs1DataAttributeAi];
