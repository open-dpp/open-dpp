/**
 * @generated DO NOT EDIT BY HAND
 *
 * Provenance: GS1DigitalLinkToolkit.js — https://github.com/gs1/GS1DigitalLinkToolkit.js
 * Commit: facedb875bcc71b12b16d7236c0d5edd48205bfa
 *
 * Licensed under the Apache-2.0 License.
 * Original copyright: © GS1, used under Apache-2.0.
 *
 * This file vendors the `aitable` array from GS1DigitalLinkToolkit.js, reshaped
 * from an array to a Record keyed by AI string. Pure data + types, no I/O.
 * Zero new runtime dependencies.
 */

/**
 * A single entry in the GS1 Application Identifier table.
 *
 * - `type: 'I'` — Primary identifier (key AI), e.g. GTIN (01), SSCC (00).
 * - `type: 'Q'` — Key qualifier, e.g. batch/lot (10), serial (21).
 * - `type: 'D'` — Data attribute (non-key), e.g. expiration date (17), net weight (3103).
 */
export interface Gs1AiTableEntry {
  /** The Application Identifier string, e.g. "01", "17", "3103". */
  ai: string;
  /** Human-readable title for this AI. */
  title: string;
  /** GS1 format descriptor, e.g. "N14", "X..20", "N6". */
  format: string;
  /** Classification: I = identifier key, Q = key qualifier, D = data attribute. */
  type: "I" | "Q" | "D";
  /** Whether this AI always has a fixed-length value. */
  fixedLength: boolean;
  /** Anchored regex fragment (without ^/$ anchors) for validating the AI value. */
  regex: string;
  /** Optional short mnemonic code. */
  shortcode?: string;
  /** Presence indicates a check-digit variant; value is the check-digit type. */
  checkDigit?: string;
  /** AIs that may qualify this AI (only on type 'I' entries). */
  qualifiers?: string[];
}

/**
 * The complete GS1 Application Identifier table (476 entries), keyed by AI string.
 *
 * Source: GS1DigitalLinkToolkit.js `aitable`, pinned to commit facedb875bcc71b12b16d7236c0d5edd48205bfa.
 * Apache-2.0 License.
 */
export const GS1_AI_TABLE: Readonly<Record<string, Gs1AiTableEntry>> = {
  "00": {
    ai: "00",
    title: "Serial Shipping Container Code (SSCC) ",
    format: "N18",
    type: "I",
    fixedLength: true,
    regex: "(\\d{18})",
    shortcode: "sscc",
    checkDigit: "L"
  },
  "01": {
    ai: "01",
    title: "Global Trade Item Number (GTIN)",
    format: "N14",
    type: "I",
    fixedLength: true,
    regex: "(\\d{12,14}|\\d{8})",
    shortcode: "gtin",
    checkDigit: "L",
    qualifiers: ["22", "10", "21"]
  },
  "02": {
    ai: "02",
    title: "GTIN of contained trade items",
    format: "N14",
    type: "D",
    fixedLength: true,
    regex: "(\\d{14})",
    checkDigit: "L"
  },
  "10": {
    ai: "10",
    title: "Batch or lot number",
    format: "X..20",
    type: "Q",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})",
    shortcode: "lot"
  },
  "11": {
    ai: "11",
    title: "Production date (YYMMDD)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "12": {
    ai: "12",
    title: "Due date (YYMMDD)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "13": {
    ai: "13",
    title: "Packaging date (YYMMDD)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "15": {
    ai: "15",
    title: "Best before date (YYMMDD)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "16": {
    ai: "16",
    title: "Sell by date (YYMMDD)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "17": {
    ai: "17",
    title: "Expiration date (YYMMDD)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})",
    shortcode: "exp"
  },
  "20": {
    ai: "20",
    title: "Internal product variant",
    format: "N2",
    type: "D",
    fixedLength: true,
    regex: "(\\d{2})"
  },
  "21": {
    ai: "21",
    title: "Serial number",
    format: "X..20",
    type: "Q",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})",
    shortcode: "ser"
  },
  "22": {
    ai: "22",
    title: "Consumer product variant",
    format: "X..20",
    type: "Q",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})",
    shortcode: "cpv"
  },
  "240": {
    ai: "240",
    title: "Additional product identification assigned by the manufacturer",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "241": {
    ai: "241",
    title: "Customer part number",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "242": {
    ai: "242",
    title: "Made-to-Order variation number",
    format: "N..6",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,6})"
  },
  "243": {
    ai: "243",
    title: "Packaging component number",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "250": {
    ai: "250",
    title: "Secondary serial number",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "251": {
    ai: "251",
    title: "Reference to source entity",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "253": {
    ai: "253",
    title: "Global Document Type Identifier (GDTI)",
    format: "N13+X..17",
    type: "I",
    fixedLength: false,
    regex: "(\\d{13})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,17})",
    shortcode: "gdti",
    checkDigit: "13"
  },
  "254": {
    ai: "254",
    title: "GLN extension component",
    format: "X..20",
    type: "Q",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})",
    shortcode: "glnx"
  },
  "255": {
    ai: "255",
    title: "Global Coupon Number (GCN)",
    format: "N13+N..12",
    type: "I",
    fixedLength: false,
    regex: "(\\d{13})(\\d{0,12})",
    shortcode: "gcn",
    checkDigit: "13"
  },
  "30": {
    ai: "30",
    title: "Variable count of items (variable measure trade item)",
    format: "N..8",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,8})"
  },
  "3100": {
    ai: "3100",
    title: "Net weight, kilograms (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3101": {
    ai: "3101",
    title: "Net weight, kilograms (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3102": {
    ai: "3102",
    title: "Net weight, kilograms (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3103": {
    ai: "3103",
    title: "Net weight, kilograms (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3104": {
    ai: "3104",
    title: "Net weight, kilograms (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3105": {
    ai: "3105",
    title: "Net weight, kilograms (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3110": {
    ai: "3110",
    title: "Length or first dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3111": {
    ai: "3111",
    title: "Length or first dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3112": {
    ai: "3112",
    title: "Length or first dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3113": {
    ai: "3113",
    title: "Length or first dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3114": {
    ai: "3114",
    title: "Length or first dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3115": {
    ai: "3115",
    title: "Length or first dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3120": {
    ai: "3120",
    title: "Width, diameter, or second dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3121": {
    ai: "3121",
    title: "Width, diameter, or second dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3122": {
    ai: "3122",
    title: "Width, diameter, or second dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3123": {
    ai: "3123",
    title: "Width, diameter, or second dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3124": {
    ai: "3124",
    title: "Width, diameter, or second dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3125": {
    ai: "3125",
    title: "Width, diameter, or second dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3130": {
    ai: "3130",
    title: "Depth, thickness, height, or third dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3131": {
    ai: "3131",
    title: "Depth, thickness, height, or third dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3132": {
    ai: "3132",
    title: "Depth, thickness, height, or third dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3133": {
    ai: "3133",
    title: "Depth, thickness, height, or third dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3134": {
    ai: "3134",
    title: "Depth, thickness, height, or third dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3135": {
    ai: "3135",
    title: "Depth, thickness, height, or third dimension, metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3140": {
    ai: "3140",
    title: "Area, square metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3141": {
    ai: "3141",
    title: "Area, square metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3142": {
    ai: "3142",
    title: "Area, square metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3143": {
    ai: "3143",
    title: "Area, square metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3144": {
    ai: "3144",
    title: "Area, square metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3145": {
    ai: "3145",
    title: "Area, square metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3150": {
    ai: "3150",
    title: "Net volume, litres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3151": {
    ai: "3151",
    title: "Net volume, litres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3152": {
    ai: "3152",
    title: "Net volume, litres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3153": {
    ai: "3153",
    title: "Net volume, litres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3154": {
    ai: "3154",
    title: "Net volume, litres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3155": {
    ai: "3155",
    title: "Net volume, litres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3160": {
    ai: "3160",
    title: "Net volume, cubic metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3161": {
    ai: "3161",
    title: "Net volume, cubic metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3162": {
    ai: "3162",
    title: "Net volume, cubic metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3163": {
    ai: "3163",
    title: "Net volume, cubic metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3164": {
    ai: "3164",
    title: "Net volume, cubic metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3165": {
    ai: "3165",
    title: "Net volume, cubic metres (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3200": {
    ai: "3200",
    title: "Net weight, pounds (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3201": {
    ai: "3201",
    title: "Net weight, pounds (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3202": {
    ai: "3202",
    title: "Net weight, pounds (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3203": {
    ai: "3203",
    title: "Net weight, pounds (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3204": {
    ai: "3204",
    title: "Net weight, pounds (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3205": {
    ai: "3205",
    title: "Net weight, pounds (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3210": {
    ai: "3210",
    title: "Length or first dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3211": {
    ai: "3211",
    title: "Length or first dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3212": {
    ai: "3212",
    title: "Length or first dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3213": {
    ai: "3213",
    title: "Length or first dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3214": {
    ai: "3214",
    title: "Length or first dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3215": {
    ai: "3215",
    title: "Length or first dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3220": {
    ai: "3220",
    title: "Length or first dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3221": {
    ai: "3221",
    title: "Length or first dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3222": {
    ai: "3222",
    title: "Length or first dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3223": {
    ai: "3223",
    title: "Length or first dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3224": {
    ai: "3224",
    title: "Length or first dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3225": {
    ai: "3225",
    title: "Length or first dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3230": {
    ai: "3230",
    title: "Length or first dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3231": {
    ai: "3231",
    title: "Length or first dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3232": {
    ai: "3232",
    title: "Length or first dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3233": {
    ai: "3233",
    title: "Length or first dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3234": {
    ai: "3234",
    title: "Length or first dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3235": {
    ai: "3235",
    title: "Length or first dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3240": {
    ai: "3240",
    title: "Width, diameter, or second dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3241": {
    ai: "3241",
    title: "Width, diameter, or second dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3242": {
    ai: "3242",
    title: "Width, diameter, or second dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3243": {
    ai: "3243",
    title: "Width, diameter, or second dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3244": {
    ai: "3244",
    title: "Width, diameter, or second dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3245": {
    ai: "3245",
    title: "Width, diameter, or second dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3250": {
    ai: "3250",
    title: "Width, diameter, or second dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3251": {
    ai: "3251",
    title: "Width, diameter, or second dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3252": {
    ai: "3252",
    title: "Width, diameter, or second dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3253": {
    ai: "3253",
    title: "Width, diameter, or second dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3254": {
    ai: "3254",
    title: "Width, diameter, or second dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3255": {
    ai: "3255",
    title: "Width, diameter, or second dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3260": {
    ai: "3260",
    title: "Width, diameter, or second dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3261": {
    ai: "3261",
    title: "Width, diameter, or second dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3262": {
    ai: "3262",
    title: "Width, diameter, or second dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3263": {
    ai: "3263",
    title: "Width, diameter, or second dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3264": {
    ai: "3264",
    title: "Width, diameter, or second dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3265": {
    ai: "3265",
    title: "Width, diameter, or second dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3270": {
    ai: "3270",
    title: "Depth, thickness, height, or third dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3271": {
    ai: "3271",
    title: "Depth, thickness, height, or third dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3272": {
    ai: "3272",
    title: "Depth, thickness, height, or third dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3273": {
    ai: "3273",
    title: "Depth, thickness, height, or third dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3274": {
    ai: "3274",
    title: "Depth, thickness, height, or third dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3275": {
    ai: "3275",
    title: "Depth, thickness, height, or third dimension, inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3280": {
    ai: "3280",
    title: "Depth, thickness, height, or third dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3281": {
    ai: "3281",
    title: "Depth, thickness, height, or third dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3282": {
    ai: "3282",
    title: "Depth, thickness, height, or third dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3283": {
    ai: "3283",
    title: "Depth, thickness, height, or third dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3284": {
    ai: "3284",
    title: "Depth, thickness, height, or third dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3285": {
    ai: "3285",
    title: "Depth, thickness, height, or third dimension, feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3290": {
    ai: "3290",
    title: "Depth, thickness, height, or third dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3291": {
    ai: "3291",
    title: "Depth, thickness, height, or third dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3292": {
    ai: "3292",
    title: "Depth, thickness, height, or third dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3293": {
    ai: "3293",
    title: "Depth, thickness, height, or third dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3294": {
    ai: "3294",
    title: "Depth, thickness, height, or third dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3295": {
    ai: "3295",
    title: "Depth, thickness, height, or third dimension, yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3300": {
    ai: "3300",
    title: "Logistic weight, kilograms",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3301": {
    ai: "3301",
    title: "Logistic weight, kilograms",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3302": {
    ai: "3302",
    title: "Logistic weight, kilograms",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3303": {
    ai: "3303",
    title: "Logistic weight, kilograms",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3304": {
    ai: "3304",
    title: "Logistic weight, kilograms",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3305": {
    ai: "3305",
    title: "Logistic weight, kilograms",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3310": {
    ai: "3310",
    title: "Length or first dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3311": {
    ai: "3311",
    title: "Length or first dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3312": {
    ai: "3312",
    title: "Length or first dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3313": {
    ai: "3313",
    title: "Length or first dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3314": {
    ai: "3314",
    title: "Length or first dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3315": {
    ai: "3315",
    title: "Length or first dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3320": {
    ai: "3320",
    title: "Width, diameter, or second dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3321": {
    ai: "3321",
    title: "Width, diameter, or second dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3322": {
    ai: "3322",
    title: "Width, diameter, or second dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3323": {
    ai: "3323",
    title: "Width, diameter, or second dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3324": {
    ai: "3324",
    title: "Width, diameter, or second dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3325": {
    ai: "3325",
    title: "Width, diameter, or second dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3330": {
    ai: "3330",
    title: "Depth, thickness, height, or third dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3331": {
    ai: "3331",
    title: "Depth, thickness, height, or third dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3332": {
    ai: "3332",
    title: "Depth, thickness, height, or third dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3333": {
    ai: "3333",
    title: "Depth, thickness, height, or third dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3334": {
    ai: "3334",
    title: "Depth, thickness, height, or third dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3335": {
    ai: "3335",
    title: "Depth, thickness, height, or third dimension, metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3340": {
    ai: "3340",
    title: "Area, square metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3341": {
    ai: "3341",
    title: "Area, square metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3342": {
    ai: "3342",
    title: "Area, square metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3343": {
    ai: "3343",
    title: "Area, square metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3344": {
    ai: "3344",
    title: "Area, square metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3345": {
    ai: "3345",
    title: "Area, square metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3350": {
    ai: "3350",
    title: "Logistic volume, litres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3351": {
    ai: "3351",
    title: "Logistic volume, litres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3352": {
    ai: "3352",
    title: "Logistic volume, litres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3353": {
    ai: "3353",
    title: "Logistic volume, litres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3354": {
    ai: "3354",
    title: "Logistic volume, litres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3355": {
    ai: "3355",
    title: "Logistic volume, litres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3360": {
    ai: "3360",
    title: "Logistic volume, cubic metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3361": {
    ai: "3361",
    title: "Logistic volume, cubic metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3362": {
    ai: "3362",
    title: "Logistic volume, cubic metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3363": {
    ai: "3363",
    title: "Logistic volume, cubic metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3364": {
    ai: "3364",
    title: "Logistic volume, cubic metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3365": {
    ai: "3365",
    title: "Logistic volume, cubic metres",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3370": {
    ai: "3370",
    title: "Kilograms per square metre",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3371": {
    ai: "3371",
    title: "Kilograms per square metre",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3372": {
    ai: "3372",
    title: "Kilograms per square metre",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3373": {
    ai: "3373",
    title: "Kilograms per square metre",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3374": {
    ai: "3374",
    title: "Kilograms per square metre",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3375": {
    ai: "3375",
    title: "Kilograms per square metre",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3400": {
    ai: "3400",
    title: "Logistic weight, pounds",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3401": {
    ai: "3401",
    title: "Logistic weight, pounds",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3402": {
    ai: "3402",
    title: "Logistic weight, pounds",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3403": {
    ai: "3403",
    title: "Logistic weight, pounds",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3404": {
    ai: "3404",
    title: "Logistic weight, pounds",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3405": {
    ai: "3405",
    title: "Logistic weight, pounds",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3410": {
    ai: "3410",
    title: "Length or first dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3411": {
    ai: "3411",
    title: "Length or first dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3412": {
    ai: "3412",
    title: "Length or first dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3413": {
    ai: "3413",
    title: "Length or first dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3414": {
    ai: "3414",
    title: "Length or first dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3415": {
    ai: "3415",
    title: "Length or first dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3420": {
    ai: "3420",
    title: "Length or first dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3421": {
    ai: "3421",
    title: "Length or first dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3422": {
    ai: "3422",
    title: "Length or first dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3423": {
    ai: "3423",
    title: "Length or first dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3424": {
    ai: "3424",
    title: "Length or first dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3425": {
    ai: "3425",
    title: "Length or first dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3430": {
    ai: "3430",
    title: "Length or first dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3431": {
    ai: "3431",
    title: "Length or first dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3432": {
    ai: "3432",
    title: "Length or first dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3433": {
    ai: "3433",
    title: "Length or first dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3434": {
    ai: "3434",
    title: "Length or first dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3435": {
    ai: "3435",
    title: "Length or first dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3440": {
    ai: "3440",
    title: "Width, diameter, or second dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3441": {
    ai: "3441",
    title: "Width, diameter, or second dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3442": {
    ai: "3442",
    title: "Width, diameter, or second dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3443": {
    ai: "3443",
    title: "Width, diameter, or second dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3444": {
    ai: "3444",
    title: "Width, diameter, or second dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3445": {
    ai: "3445",
    title: "Width, diameter, or second dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3450": {
    ai: "3450",
    title: "Width, diameter, or second dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3451": {
    ai: "3451",
    title: "Width, diameter, or second dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3452": {
    ai: "3452",
    title: "Width, diameter, or second dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3453": {
    ai: "3453",
    title: "Width, diameter, or second dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3454": {
    ai: "3454",
    title: "Width, diameter, or second dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3455": {
    ai: "3455",
    title: "Width, diameter, or second dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3460": {
    ai: "3460",
    title: "Width, diameter, or second dimension, yard",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3461": {
    ai: "3461",
    title: "Width, diameter, or second dimension, yard",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3462": {
    ai: "3462",
    title: "Width, diameter, or second dimension, yard",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3463": {
    ai: "3463",
    title: "Width, diameter, or second dimension, yard",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3464": {
    ai: "3464",
    title: "Width, diameter, or second dimension, yard",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3465": {
    ai: "3465",
    title: "Width, diameter, or second dimension, yard",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3470": {
    ai: "3470",
    title: "Depth, thickness, height, or third dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3471": {
    ai: "3471",
    title: "Depth, thickness, height, or third dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3472": {
    ai: "3472",
    title: "Depth, thickness, height, or third dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3473": {
    ai: "3473",
    title: "Depth, thickness, height, or third dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3474": {
    ai: "3474",
    title: "Depth, thickness, height, or third dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3475": {
    ai: "3475",
    title: "Depth, thickness, height, or third dimension, inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3480": {
    ai: "3480",
    title: "Depth, thickness, height, or third dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3481": {
    ai: "3481",
    title: "Depth, thickness, height, or third dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3482": {
    ai: "3482",
    title: "Depth, thickness, height, or third dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3483": {
    ai: "3483",
    title: "Depth, thickness, height, or third dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3484": {
    ai: "3484",
    title: "Depth, thickness, height, or third dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3485": {
    ai: "3485",
    title: "Depth, thickness, height, or third dimension, feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3490": {
    ai: "3490",
    title: "Depth, thickness, height, or third dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3491": {
    ai: "3491",
    title: "Depth, thickness, height, or third dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3492": {
    ai: "3492",
    title: "Depth, thickness, height, or third dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3493": {
    ai: "3493",
    title: "Depth, thickness, height, or third dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3494": {
    ai: "3494",
    title: "Depth, thickness, height, or third dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3495": {
    ai: "3495",
    title: "Depth, thickness, height, or third dimension, yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3500": {
    ai: "3500",
    title: "Area, square inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3501": {
    ai: "3501",
    title: "Area, square inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3502": {
    ai: "3502",
    title: "Area, square inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3503": {
    ai: "3503",
    title: "Area, square inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3504": {
    ai: "3504",
    title: "Area, square inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3505": {
    ai: "3505",
    title: "Area, square inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3510": {
    ai: "3510",
    title: "Area, square feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3511": {
    ai: "3511",
    title: "Area, square feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3512": {
    ai: "3512",
    title: "Area, square feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3513": {
    ai: "3513",
    title: "Area, square feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3514": {
    ai: "3514",
    title: "Area, square feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3515": {
    ai: "3515",
    title: "Area, square feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3520": {
    ai: "3520",
    title: "Area, square yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3521": {
    ai: "3521",
    title: "Area, square yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3522": {
    ai: "3522",
    title: "Area, square yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3523": {
    ai: "3523",
    title: "Area, square yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3524": {
    ai: "3524",
    title: "Area, square yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3525": {
    ai: "3525",
    title: "Area, square yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3530": {
    ai: "3530",
    title: "Area, square inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3531": {
    ai: "3531",
    title: "Area, square inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3532": {
    ai: "3532",
    title: "Area, square inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3533": {
    ai: "3533",
    title: "Area, square inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3534": {
    ai: "3534",
    title: "Area, square inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3535": {
    ai: "3535",
    title: "Area, square inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3540": {
    ai: "3540",
    title: "Area, square feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3541": {
    ai: "3541",
    title: "Area, square feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3542": {
    ai: "3542",
    title: "Area, square feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3543": {
    ai: "3543",
    title: "Area, square feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3544": {
    ai: "3544",
    title: "Area, square feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3545": {
    ai: "3545",
    title: "Area, square feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3550": {
    ai: "3550",
    title: "Area, square yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3551": {
    ai: "3551",
    title: "Area, square yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3552": {
    ai: "3552",
    title: "Area, square yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3553": {
    ai: "3553",
    title: "Area, square yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3554": {
    ai: "3554",
    title: "Area, square yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3555": {
    ai: "3555",
    title: "Area, square yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3560": {
    ai: "3560",
    title: "Net weight, troy ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3561": {
    ai: "3561",
    title: "Net weight, troy ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3562": {
    ai: "3562",
    title: "Net weight, troy ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3563": {
    ai: "3563",
    title: "Net weight, troy ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3564": {
    ai: "3564",
    title: "Net weight, troy ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3565": {
    ai: "3565",
    title: "Net weight, troy ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3570": {
    ai: "3570",
    title: "Net weight (or volume), ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3571": {
    ai: "3571",
    title: "Net weight (or volume), ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3572": {
    ai: "3572",
    title: "Net weight (or volume), ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3573": {
    ai: "3573",
    title: "Net weight (or volume), ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3574": {
    ai: "3574",
    title: "Net weight (or volume), ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3575": {
    ai: "3575",
    title: "Net weight (or volume), ounces (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3600": {
    ai: "3600",
    title: "Net volume, quarts (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3601": {
    ai: "3601",
    title: "Net volume, quarts (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3602": {
    ai: "3602",
    title: "Net volume, quarts (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3603": {
    ai: "3603",
    title: "Net volume, quarts (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3604": {
    ai: "3604",
    title: "Net volume, quarts (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3605": {
    ai: "3605",
    title: "Net volume, quarts (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3610": {
    ai: "3610",
    title: "Net volume, gallons U.S. (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3611": {
    ai: "3611",
    title: "Net volume, gallons U.S. (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3612": {
    ai: "3612",
    title: "Net volume, gallons U.S. (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3613": {
    ai: "3613",
    title: "Net volume, gallons U.S. (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3614": {
    ai: "3614",
    title: "Net volume, gallons U.S. (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3615": {
    ai: "3615",
    title: "Net volume, gallons U.S. (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3620": {
    ai: "3620",
    title: "Logistic volume, quarts",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3621": {
    ai: "3621",
    title: "Logistic volume, quarts",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3622": {
    ai: "3622",
    title: "Logistic volume, quarts",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3623": {
    ai: "3623",
    title: "Logistic volume, quarts",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3624": {
    ai: "3624",
    title: "Logistic volume, quarts",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3625": {
    ai: "3625",
    title: "Logistic volume, quarts",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3630": {
    ai: "3630",
    title: "Logistic volume, gallons U.S.",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3631": {
    ai: "3631",
    title: "Logistic volume, gallons U.S.",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3632": {
    ai: "3632",
    title: "Logistic volume, gallons U.S.",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3633": {
    ai: "3633",
    title: "Logistic volume, gallons U.S.",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3634": {
    ai: "3634",
    title: "Logistic volume, gallons U.S.",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3635": {
    ai: "3635",
    title: "Logistic volume, gallons U.S.",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3640": {
    ai: "3640",
    title: "Net volume, cubic inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3641": {
    ai: "3641",
    title: "Net volume, cubic inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3642": {
    ai: "3642",
    title: "Net volume, cubic inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3643": {
    ai: "3643",
    title: "Net volume, cubic inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3644": {
    ai: "3644",
    title: "Net volume, cubic inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3645": {
    ai: "3645",
    title: "Net volume, cubic inches (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3650": {
    ai: "3650",
    title: "Net volume, cubic feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3651": {
    ai: "3651",
    title: "Net volume, cubic feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3652": {
    ai: "3652",
    title: "Net volume, cubic feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3653": {
    ai: "3653",
    title: "Net volume, cubic feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3654": {
    ai: "3654",
    title: "Net volume, cubic feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3655": {
    ai: "3655",
    title: "Net volume, cubic feet (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3660": {
    ai: "3660",
    title: "Net volume, cubic yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3661": {
    ai: "3661",
    title: "Net volume, cubic yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3662": {
    ai: "3662",
    title: "Net volume, cubic yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3663": {
    ai: "3663",
    title: "Net volume, cubic yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3664": {
    ai: "3664",
    title: "Net volume, cubic yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3665": {
    ai: "3665",
    title: "Net volume, cubic yards (variable measure trade item)",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3670": {
    ai: "3670",
    title: "Logistic volume, cubic inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3671": {
    ai: "3671",
    title: "Logistic volume, cubic inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3672": {
    ai: "3672",
    title: "Logistic volume, cubic inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3673": {
    ai: "3673",
    title: "Logistic volume, cubic inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3674": {
    ai: "3674",
    title: "Logistic volume, cubic inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3675": {
    ai: "3675",
    title: "Logistic volume, cubic inches",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3680": {
    ai: "3680",
    title: "Logistic volume, cubic feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3681": {
    ai: "3681",
    title: "Logistic volume, cubic feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3682": {
    ai: "3682",
    title: "Logistic volume, cubic feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3683": {
    ai: "3683",
    title: "Logistic volume, cubic feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3684": {
    ai: "3684",
    title: "Logistic volume, cubic feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3685": {
    ai: "3685",
    title: "Logistic volume, cubic feet",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3690": {
    ai: "3690",
    title: "Logistic volume, cubic yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3691": {
    ai: "3691",
    title: "Logistic volume, cubic yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3692": {
    ai: "3692",
    title: "Logistic volume, cubic yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3693": {
    ai: "3693",
    title: "Logistic volume, cubic yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3694": {
    ai: "3694",
    title: "Logistic volume, cubic yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "3695": {
    ai: "3695",
    title: "Logistic volume, cubic yards",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "37": {
    ai: "37",
    title: "Count of trade items",
    format: "N..8",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,8})"
  },
  "3900": {
    ai: "3900",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3901": {
    ai: "3901",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3902": {
    ai: "3902",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3903": {
    ai: "3903",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3904": {
    ai: "3904",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3905": {
    ai: "3905",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3906": {
    ai: "3906",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3907": {
    ai: "3907",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3908": {
    ai: "3908",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3909": {
    ai: "3909",
    title: "Applicable amount payable or Coupon value, local currency",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3910": {
    ai: "3910",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3911": {
    ai: "3911",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3912": {
    ai: "3912",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3913": {
    ai: "3913",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3914": {
    ai: "3914",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3915": {
    ai: "3915",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3916": {
    ai: "3916",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3917": {
    ai: "3917",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3918": {
    ai: "3918",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3919": {
    ai: "3919",
    title: "Applicable amount payable with ISO currency code",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3920": {
    ai: "3920",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3921": {
    ai: "3921",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3922": {
    ai: "3922",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3923": {
    ai: "3923",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3924": {
    ai: "3924",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3925": {
    ai: "3925",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3926": {
    ai: "3926",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3927": {
    ai: "3927",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3928": {
    ai: "3928",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3929": {
    ai: "3929",
    title: "Applicable amount payable, single monetary area (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,15})"
  },
  "3930": {
    ai: "3930",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3931": {
    ai: "3931",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3932": {
    ai: "3932",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3933": {
    ai: "3933",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3934": {
    ai: "3934",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3935": {
    ai: "3935",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3936": {
    ai: "3936",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3937": {
    ai: "3937",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3938": {
    ai: "3938",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3939": {
    ai: "3939",
    title: "Applicable amount payable with ISO currency code (variable measure trade item)",
    format: "N..15",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,15})"
  },
  "3940": {
    ai: "3940",
    title: "Percentage discount of a coupon",
    format: "N4",
    type: "D",
    fixedLength: true,
    regex: "(\\d{4})"
  },
  "3941": {
    ai: "3941",
    title: "Percentage discount of a coupon",
    format: "N4",
    type: "D",
    fixedLength: true,
    regex: "(\\d{4})"
  },
  "3942": {
    ai: "3942",
    title: "Percentage discount of a coupon",
    format: "N4",
    type: "D",
    fixedLength: true,
    regex: "(\\d{4})"
  },
  "3943": {
    ai: "3943",
    title: "Percentage discount of a coupon",
    format: "N4",
    type: "D",
    fixedLength: true,
    regex: "(\\d{4})"
  },
  "400": {
    ai: "400",
    title: "Customer's purchase order number",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "401": {
    ai: "401",
    title: "Global Identification Number for Consignment (GINC)",
    format: "X..30",
    type: "I",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})",
    shortcode: "ginc"
  },
  "402": {
    ai: "402",
    title: "Global Shipment Identification Number (GSIN)",
    format: "N17",
    type: "I",
    fixedLength: true,
    regex: "(\\d{17})",
    shortcode: "gsin",
    checkDigit: "L"
  },
  "403": {
    ai: "403",
    title: "Routing code",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "410": {
    ai: "410",
    title: "Ship to - Deliver to Global Location Number",
    format: "N13",
    type: "D",
    fixedLength: true,
    regex: "(\\d{13})",
    checkDigit: "L"
  },
  "411": {
    ai: "411",
    title: "Bill to - Invoice to Global Location Number",
    format: "N13",
    type: "D",
    fixedLength: true,
    regex: "(\\d{13})",
    checkDigit: "L"
  },
  "412": {
    ai: "412",
    title: "Purchased from Global Location Number",
    format: "N13",
    type: "D",
    fixedLength: true,
    regex: "(\\d{13})",
    checkDigit: "L"
  },
  "413": {
    ai: "413",
    title: "Ship for - Deliver for - Forward to Global Location Number",
    format: "N13",
    type: "D",
    fixedLength: true,
    regex: "(\\d{13})",
    checkDigit: "L"
  },
  "414": {
    ai: "414",
    title: "Identification of a physical location - Global Location Number",
    format: "N13",
    type: "I",
    fixedLength: true,
    regex: "(\\d{13})",
    shortcode: "gln",
    checkDigit: "L",
    qualifiers: ["254"]
  },
  "415": {
    ai: "415",
    title: "Global Location Number of the invoicing party",
    format: "N13",
    type: "I",
    fixedLength: true,
    regex: "(\\d{13})",
    shortcode: "payto",
    checkDigit: "L"
  },
  "416": {
    ai: "416",
    title: "GLN of the production or service location",
    format: "N13",
    type: "D",
    fixedLength: true,
    regex: "(\\d{13})",
    checkDigit: "L"
  },
  "420": {
    ai: "420",
    title: "Ship to - Deliver to postal code within a single postal authority",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "421": {
    ai: "421",
    title: "Ship to - Deliver to postal code with ISO country code",
    format: "N3+X..9",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,9})"
  },
  "422": {
    ai: "422",
    title: "Country of origin of a trade item",
    format: "N3",
    type: "D",
    fixedLength: true,
    regex: "(\\d{3})"
  },
  "423": {
    ai: "423",
    title: "Country of initial processing",
    format: "N3+N..12",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,12})"
  },
  "424": {
    ai: "424",
    title: "Country of processing",
    format: "N3",
    type: "D",
    fixedLength: true,
    regex: "(\\d{3})"
  },
  "425": {
    ai: "425",
    title: "Country of disassembly",
    format: "N3+N..12",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})(\\d{0,12})"
  },
  "426": {
    ai: "426",
    title: "Country covering full process chain",
    format: "N3",
    type: "D",
    fixedLength: true,
    regex: "(\\d{3})"
  },
  "427": {
    ai: "427",
    title: "Country subdivision Of origin",
    format: "X..3",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,3})"
  },
  "7001": {
    ai: "7001",
    title: "NATO Stock Number (NSN)",
    format: "N13",
    type: "D",
    fixedLength: true,
    regex: "(\\d{13})"
  },
  "7002": {
    ai: "7002",
    title: "UN/ECE meat carcasses and cuts classification",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "7003": {
    ai: "7003",
    title: "Expiration date and time",
    format: "N10",
    type: "D",
    fixedLength: true,
    regex: "(\\d{10})",
    shortcode: "expdt"
  },
  "7004": {
    ai: "7004",
    title: "Active potency",
    format: "N..4",
    type: "D",
    fixedLength: false,
    regex: "(\\d{0,4})"
  },
  "7005": {
    ai: "7005",
    title: "Catch area",
    format: "X..12",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,12})"
  },
  "7006": {
    ai: "7006",
    title: "First freeze date ",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "7007": {
    ai: "7007",
    title: "Harvest date",
    format: "N6..12",
    type: "D",
    fixedLength: false,
    regex: "(\\d{6,12})"
  },
  "7008": {
    ai: "7008",
    title: "Species for fishery purposes",
    format: "X..3",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,3})"
  },
  "7009": {
    ai: "7009",
    title: "Fishing gear type",
    format: "X..10",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,10})"
  },
  "7010": {
    ai: "7010",
    title: "Production method",
    format: "X..2",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,2})"
  },
  "7020": {
    ai: "7020",
    title: "Refurbishment lot ID",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "7021": {
    ai: "7021",
    title: "Functional status",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "7022": {
    ai: "7022",
    title: "Revision status",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "7023": {
    ai: "7023",
    title: "Global Individual Asset Identifier (GIAI) of an assembly",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "7030": {
    ai: "7030",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7031": {
    ai: "7031",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7032": {
    ai: "7032",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7033": {
    ai: "7033",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7034": {
    ai: "7034",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7035": {
    ai: "7035",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7036": {
    ai: "7036",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7037": {
    ai: "7037",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7038": {
    ai: "7038",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "7039": {
    ai: "7039",
    title: "Number of processor with ISO Country Code",
    format: "X..27",
    type: "D",
    fixedLength: false,
    regex: "(\\d{3})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,27})"
  },
  "710": {
    ai: "710",
    title: "National Healthcare Reimbursement Number (NHRN) - Germany PZN",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "711": {
    ai: "711",
    title: "National Healthcare Reimbursement Number (NHRN) - France CIP",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "712": {
    ai: "712",
    title: "National Healthcare Reimbursement Number (NHRN) - Spain CN",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "713": {
    ai: "713",
    title: "National Healthcare Reimbursement Number (NHRN) - Brasil DRN",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "714": {
    ai: "714",
    title: "National Healthcare Reimbursement Number (NHRN) - Portugal AIM",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "7230": {
    ai: "7230",
    title: "Certification reference # 0",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7231": {
    ai: "7231",
    title: "Certification reference # 1",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7232": {
    ai: "7232",
    title: "Certification reference # 2",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7233": {
    ai: "7233",
    title: "Certification reference # 3",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7234": {
    ai: "7234",
    title: "Certification reference # 4",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7235": {
    ai: "7235",
    title: "Certification reference # 5",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7236": {
    ai: "7236",
    title: "Certification reference # 6",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7237": {
    ai: "7237",
    title: "Certification reference # 7",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7238": {
    ai: "7238",
    title: "Certification reference # 8",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "7239": {
    ai: "7239",
    title: "Certification reference # 9",
    format: "X2+X..28",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{2,30})"
  },
  "8001": {
    ai: "8001",
    title: "Roll products (width, length, core diameter, direction, splices)",
    format: "N14",
    type: "D",
    fixedLength: true,
    regex: "(\\d{14})"
  },
  "8002": {
    ai: "8002",
    title: "Cellular mobile telephone identifier",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "8003": {
    ai: "8003",
    title: "Global Returnable Asset Identifier (GRAI)",
    format: "N14+X..16",
    type: "I",
    fixedLength: false,
    regex: "(\\d{14})([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,16})",
    shortcode: "grai",
    checkDigit: "13"
  },
  "8004": {
    ai: "8004",
    title: "Global Individual Asset Identifier (GIAI)",
    format: "X..30",
    type: "I",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})",
    shortcode: "giai"
  },
  "8005": {
    ai: "8005",
    title: "Price per unit of measure",
    format: "N6",
    type: "D",
    fixedLength: true,
    regex: "(\\d{6})"
  },
  "8006": {
    ai: "8006",
    title: "Identification of an individual trade item piece",
    format: "N14+N2+N2",
    type: "I",
    fixedLength: true,
    regex: "(\\d{14})(\\d{2})(\\d{2})",
    shortcode: "itip",
    checkDigit: "14",
    qualifiers: ["22", "10", "21"]
  },
  "8007": {
    ai: "8007",
    title: "International Bank Account Number (IBAN) ",
    format: "X..34",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,34})"
  },
  "8008": {
    ai: "8008",
    title: "Date and time of production",
    format: "N8+N..4",
    type: "D",
    fixedLength: false,
    regex: "(\\d{8})(\\d{0,4})"
  },
  "8009": {
    ai: "8009",
    title: "Optically Readable Sensor Indicator",
    format: "X..50",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,50})"
  },
  "8010": {
    ai: "8010",
    title: "Component/Part Identifier (CPID)",
    format: "Y..30",
    type: "I",
    fixedLength: false,
    regex: "([\\x23\\x2D\\x2F\\x30-\\x39\\x41-\\x5A]{0,30})",
    shortcode: "cpid",
    qualifiers: ["8011"]
  },
  "8011": {
    ai: "8011",
    title: "Component/Part Identifier serial number (CPID SERIAL)",
    format: "N..12",
    type: "Q",
    fixedLength: false,
    regex: "(\\d{0,12})",
    shortcode: "cpsn"
  },
  "8012": {
    ai: "8012",
    title: "Software version",
    format: "X..20",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
  },
  "8013": {
    ai: "8013",
    title: "Global Model Number (GMN)",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "8017": {
    ai: "8017",
    title: "Global Service Relation Number - Provider",
    format: "N18",
    type: "I",
    fixedLength: true,
    regex: "(\\d{18})",
    shortcode: "gsrnp",
    checkDigit: "L",
    qualifiers: ["8019"]
  },
  "8018": {
    ai: "8018",
    title: "Global Service Relation Number - Recipient",
    format: "N18",
    type: "I",
    fixedLength: true,
    regex: "(\\d{18})",
    shortcode: "gsrn",
    checkDigit: "L",
    qualifiers: ["8019"]
  },
  "8019": {
    ai: "8019",
    title: "Service Relation Instance Number (SRIN)",
    format: "N..10",
    type: "Q",
    fixedLength: false,
    regex: "(\\d{0,10})",
    shortcode: "srin"
  },
  "8020": {
    ai: "8020",
    title: "Payment slip reference number",
    format: "X..25",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,25})"
  },
  "8026": {
    ai: "8026",
    title: "Identification of pieces of a trade item contained in a logistics unit",
    format: "N14+N2+N2",
    type: "D",
    fixedLength: true,
    regex: "(\\d{14})(\\d{2})(\\d{2})",
    checkDigit: "14"
  },
  "8110": {
    ai: "8110",
    title: "Coupon code identification for use in North America",
    format: "X..70",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,70})"
  },
  "8111": {
    ai: "8111",
    title: "Loyalty points of a coupon",
    format: "N4",
    type: "D",
    fixedLength: true,
    regex: "(\\d{4})"
  },
  "8112": {
    ai: "8112",
    title: "Paperless coupon code identification for use in North America",
    format: "X..70",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,70})"
  },
  "8200": {
    ai: "8200",
    title: "Extended Packaging URL ",
    format: "X..70",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,70})"
  },
  "90": {
    ai: "90",
    title: "Information mutually agreed between trading partners",
    format: "X..30",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,30})"
  },
  "91": {
    ai: "91",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "92": {
    ai: "92",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "93": {
    ai: "93",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "94": {
    ai: "94",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "95": {
    ai: "95",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "96": {
    ai: "96",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "97": {
    ai: "97",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "98": {
    ai: "98",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  },
  "99": {
    ai: "99",
    title: "Company internal information",
    format: "X..90",
    type: "D",
    fixedLength: false,
    regex: "([\\x21-\\x22\\x25-\\x2F\\x30-\\x3F\\x41-\\x5A\\x5F\\x61-\\x7A]{0,90})"
  }
} as const;
