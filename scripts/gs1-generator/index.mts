/**
 * Regenerates the GS1 Application Identifier artifacts in
 * packages/dto/src/unique-product-identifiers/gs1/ from ref.gs1.org:
 *
 *   - gs1-ai-table.ts      — the full AI registry (Gs1AiTableEntry records)
 *   - gs1-ai-constants.ts  — named-constant objects per AI kind (I / Q / D)
 *   - gs1-ai-i18n.ts       — de/en description translations + family keys
 *
 * Executed with tsx (root devDependency). Run via `pnpm gen:gs1`. Fails loudly
 * on any upstream shape change.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { Gs1AiTableEntry } from "../../packages/dto/src/unique-product-identifiers/gs1/gs1-ai-table.js";

const AI_URL = "https://ref.gs1.org/ai/";
const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "packages",
  "dto",
  "src",
  "unique-product-identifiers",
  "gs1",
);
/** Languages vendored into gs1-ai-i18n.ts. `en` is mandatory per row. */
const LANGS = ["en", "de"] as const;
type Lang = (typeof LANGS)[number];
const MIN_ENTRIES = 500;
const MIN_I18N_ROWS = 150;
const FETCH_TIMEOUT_MS = 30_000;

/**
 * True if `source` compiles as an anchored regex body — mirrors how the
 * generated table's regex fragments are consumed (`^(?:<regex>)$`).
 */
const compilesAsRegex = (source: string): boolean => {
  try {
    new RegExp(`^(?:${source})$`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Upstream ref.gs1.org JSON entry — only the fields this generator consumes.
 * The three fields every derived AI needs (`applicationIdentifier`,
 * `description`, `regex`) are validated here so `deriveEntries` can assume them.
 */
const RefGs1AiEntry = z.object({
  applicationIdentifier: z.string().regex(/^\d{2,4}$/),
  description: z.string().refine((s) => s.trim().length > 0, "empty description"),
  formatString: z.string().optional(),
  regex: z.string().min(1).refine(compilesAsRegex, "regex does not compile"),
  separatorRequired: z.boolean().optional(),
  gs1DigitalLinkPrimaryKey: z.boolean().optional(),
  gs1DigitalLinkQualifiers: z.array(z.array(z.string())).optional(),
  validAsDataAttribute: z.boolean().optional(),
});
type RefGs1AiEntry = z.infer<typeof RefGs1AiEntry>;

/** Header metadata stamped into every generated file. */
interface Provenance {
  retrieved: string;
  detail: string;
  hash: string;
}

interface KindMember {
  name: string;
  entry: Gs1AiTableEntry;
}

interface KindSpec {
  constName: string;
  doc: string;
  members: KindMember[];
}

type I18nTexts = { en: string } & Partial<Record<Lang, string>>;
type I18nRow = [key: string, texts: I18nTexts];

function fail(message: string): never {
  throw new Error(`gs1 generator: ${message}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

async function fetchText(accept: string): Promise<string> {
  const response = await fetch(AI_URL, {
    headers: {
      accept,
      "user-agent": "open-dpp-gs1-generator (+https://github.com/open-dpp/open-dpp)",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  assert(response.ok, `GET ${AI_URL} (${accept}) -> HTTP ${response.status}`);
  return response.text();
}

const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");
const q = (value: unknown): string => JSON.stringify(value);
/** ASCII sort, matching the key order of the previously vendored table. */
const byAi = <T extends { ai: string }>(a: T, b: T): number => (a.ai < b.ai ? -1 : 1);

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/** type precedence I > Q > D > N; Q = referenced in any Digital Link qualifier set. */
function deriveEntries(raw: RefGs1AiEntry[]): Gs1AiTableEntry[] {
  const qualifierAis = new Set(
    raw.flatMap((entry) => (entry.gs1DigitalLinkQualifiers ?? []).flat()),
  );
  return raw.map((entry) => {
    // applicationIdentifier, description, and regex are validated by RefGs1AiEntry.
    const ai = entry.applicationIdentifier;
    const title = entry.description.trim();

    const formatParts = String(entry.formatString ?? "").split("+");
    assert(
      formatParts[0] === `N${ai.length}`,
      `AI ${ai}: formatString ${q(entry.formatString)} does not start with its AI prefix`,
    );
    const format = formatParts.slice(1).join("+");
    assert(format.length > 0, `AI ${ai}: empty value format`);

    let type: Gs1AiTableEntry["type"];
    if (entry.gs1DigitalLinkPrimaryKey) type = "I";
    else if (qualifierAis.has(ai)) type = "Q";
    else if (entry.validAsDataAttribute) type = "D";
    else type = "N";
    // First qualifier hierarchy, flattened — compat with the previous flat list.
    const qualifiers = entry.gs1DigitalLinkQualifiers?.[0];
    return {
      ai,
      title,
      format,
      type,
      fixedLength: !entry.separatorRequired,
      regex: entry.regex,
      ...(qualifiers ? { qualifiers } : {}),
    };
  });
}

/** Known upstream title misspellings, corrected in derived member names only. */
const NAME_FIXES: Readonly<Record<string, string>> = {
  INTERNATINAL: "INTERNATIONAL",
};

/**
 * Naming rule (mirrored by gs1-ai-constants.spec.ts): title -> trim -> strip
 * parentheticals -> uppercase -> collapse non-alphanumeric runs to "_" ->
 * strip edge "_" -> fix known misspelled words; same-name collision groups
 * within a kind get a `_<AI>` suffix.
 */
function deriveMemberNames(entries: Gs1AiTableEntry[]): KindMember[] {
  const byName = new Map<string, Gs1AiTableEntry[]>();
  for (const entry of entries) {
    const name = entry.title
      .trim()
      .replace(/\([^)]*\)/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .split("_")
      .map((word) => NAME_FIXES[word] ?? word)
      .join("_");
    assert(name.length > 0, `AI ${entry.ai}: title ${q(entry.title)} derives an empty name`);
    assert(
      /^[A-Z_]/.test(name),
      `AI ${entry.ai}: derived name ${q(name)} is not a valid identifier`,
    );
    byName.set(name, [...(byName.get(name) ?? []), entry]);
  }
  const members: KindMember[] = [];
  for (const [name, group] of byName) {
    for (const entry of group) {
      members.push({ name: group.length === 1 ? name : `${name}_${entry.ai}`, entry });
    }
  }
  assert(
    new Set(members.map((m) => m.name)).size === members.length,
    "collision suffixing did not produce unique member names",
  );
  return members.sort((a, b) => byAi(a.entry, b.entry));
}

// ---------------------------------------------------------------------------
// i18n TSV
// ---------------------------------------------------------------------------

/** AI-like translation keys: exact AIs, "390n"/"703s" families, the "91-99" range. */
const I18N_KEY = /^(?:\d{2,4}[ns]?|91-99)$/;

function parseI18n(html: string): I18nRow[] {
  const match = html.match(/<script[^>]*id="translatedText"[^>]*>([\s\S]*?)<\/script>/);
  assert(match, `no <script id="translatedText"> block found in ${AI_URL} HTML`);
  const lines = match[1]
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  const header = lines[0].split("\t").map((column) => column.trim());
  assert(header[0] === "key", `unexpected TSV header: ${q(lines[0])}`);
  const columns: [Lang, number][] = LANGS.map((lang) => {
    const index = header.indexOf(lang);
    assert(index > 0, `TSV header has no ${q(lang)} column`);
    return [lang, index];
  });

  const rows = new Map<string, I18nTexts>();
  for (const line of lines.slice(1)) {
    const cells = line.split("\t");
    const key = cells[0].trim();
    if (!I18N_KEY.test(key)) continue; // note-* and nav-* UI strings
    assert(!rows.has(key), `duplicate TSV key ${q(key)}`);
    const texts: Partial<Record<Lang, string>> = {};
    for (const [lang, index] of columns) {
      const text = (cells[index] ?? "").trim();
      if (text.length > 0) texts[lang] = text;
    }
    assert(typeof texts.en === "string", `TSV row ${q(key)} has no English text`);
    rows.set(key, { ...texts, en: texts.en });
  }
  assert(
    rows.size >= MIN_I18N_ROWS,
    `only ${rows.size} AI translation rows (expected >= ${MIN_I18N_ROWS})`,
  );
  return [...rows.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
}

// ---------------------------------------------------------------------------
// Emission
// ---------------------------------------------------------------------------

function provenance({ retrieved, detail, hash }: Provenance): string {
  return [
    " * @generated DO NOT EDIT BY HAND",
    " *",
    " * Regenerate with: pnpm gen:gs1  (scripts/gs1-generator/index.mts)",
    " *",
    ` * Provenance: GS1 Application Identifier registry — ${AI_URL}`,
    ` * Retrieved: ${retrieved} (UTC), ${detail}`,
    ` * Upstream payload SHA-256: ${hash}`,
    " *",
    " * Data © GS1 AISBL, published under the GS1 terms of use (factual standards",
    " * data, attribution given; no open-source license).",
  ].join("\n");
}

function buildTableSource(entries: Gs1AiTableEntry[], meta: Provenance): string {
  const body = entries
    .map((entry) => {
      const lines = [
        `  ${q(entry.ai)}: {`,
        `    ai: ${q(entry.ai)},`,
        `    title: ${q(entry.title)},`,
        `    format: ${q(entry.format)},`,
        `    type: ${q(entry.type)},`,
        `    fixedLength: ${entry.fixedLength},`,
        `    regex: ${q(entry.regex)},`,
      ];
      if (entry.qualifiers) {
        lines.push(`    qualifiers: [${entry.qualifiers.map(q).join(", ")}],`);
      }
      lines.push("  },");
      return lines.join("\n");
    })
    .join("\n");

  return `/**
${provenance(meta)}
 *
 * Shape and derivation rules: I > Q > D > N precedence, formats without the AI
 * prefix, first qualifier hierarchy flattened.
 *
 * Typed \`as const satisfies Readonly<Record<string, Gs1AiTableEntry>>\` so the
 * AI keys and entry fields keep their literal types (source of truth for the
 * generated named constants in gs1-ai-constants.ts).
 */

/**
 * A single entry in the GS1 Application Identifier table.
 *
 * - \`type: 'I'\` — Primary identifier (key AI), e.g. GTIN (01), SSCC (00).
 * - \`type: 'Q'\` — Key qualifier, e.g. batch/lot (10), serial (21).
 * - \`type: 'D'\` — Data attribute (non-key), e.g. expiration date (17), net weight (3103).
 * - \`type: 'N'\` — Element-string only; not usable anywhere in a GS1 Digital Link.
 */
export interface Gs1AiTableEntry {
  /** The Application Identifier string, e.g. "01", "17", "3103". */
  ai: string;
  /** Human-readable English title for this AI. */
  title: string;
  /** GS1 value format descriptor (AI prefix stripped), e.g. "N14", "X..20", "N6". */
  format: string;
  /** Classification: I = identifier key, Q = key qualifier, D = data attribute, N = element-string only. */
  type: "I" | "Q" | "D" | "N";
  /** Whether this AI always has a fixed-length value (no FNC1 separator needed). */
  fixedLength: boolean;
  /** Anchored regex fragment (without ^/$ anchors) for validating the AI value. */
  regex: string;
  /** First GS1 Digital Link qualifier hierarchy, flattened (only on type 'I' entries). */
  qualifiers?: string[];
}

/**
 * The complete GS1 Application Identifier table (${entries.length} entries), keyed by AI string.
 */
export const GS1_AI_TABLE = {
${body}
} as const satisfies Readonly<Record<string, Gs1AiTableEntry>>;
`;
}

function buildConstantsSource(kinds: KindSpec[], meta: Provenance): string {
  const sections = kinds
    .map(({ constName, doc, members }) => {
      const body = members
        .map(({ name, entry }) => `  ${name}: ${q(entry.ai)},`)
        .join("\n");
      return `/** ${doc} */
export const ${constName} = {
${body}
} as const;

/** The union of ${constName} AI string values. */
export type ${constName} = (typeof ${constName})[keyof typeof ${constName}];
`;
    })
    .join("\n");

  return `/**
${provenance(meta)}
 *
 * Named-constant enum objects for the GS1 Application Identifiers, one per AI
 * kind, derived from gs1-ai-table.ts. Pure data + types, no I/O.
 *
 * Naming rule:
 * title -> trim -> strip parentheticals -> uppercase -> collapse
 * non-alphanumeric runs to "_" -> strip leading/trailing "_" -> fix known
 * misspelled words (INTERNATINAL -> INTERNATIONAL); members of a same-name
 * collision group within a kind carry a \`_<AI>\` suffix.
 */

${sections}`;
}

function buildI18nSource(rows: I18nRow[], meta: Provenance): string {
  const body = rows
    .map(([key, texts]) => {
      const cells = LANGS.filter((lang) => texts[lang]).map((lang) => `${lang}: ${q(texts[lang])}`);
      return `  ${q(key)}: { ${cells.join(", ")} },`;
    })
    .join("\n");

  return `/**
${provenance(meta)}
 *
 * GS1 AI description translations, keyed exactly as GS1 publishes them in the
 * translation block of the AI browser page: exact AI strings, decimal-place /
 * sequence family keys ("390n", "703s"), and the "91-99" range key. Use
 * getGs1AiDescription() from gs1-ai-description.ts to resolve an AI.
 */

/** A translated GS1 AI description. \`en\` is always present; other languages are optional. */
export interface Gs1AiI18nEntry {
  readonly en: string;
  readonly de?: string;
}

/** Languages vendored into GS1_AI_I18N. */
export type Gs1AiI18nLang = ${LANGS.map(q).join(" | ")};

/** GS1 AI description translations (${rows.length} rows), keyed as published by GS1. */
export const GS1_AI_I18N = {
${body}
} as const satisfies Readonly<Record<string, Gs1AiI18nEntry>>;
`;
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const [jsonText, htmlText] = [await fetchText("application/json"), await fetchText("text/html")];

  const raw = z
    .array(RefGs1AiEntry)
    .min(MIN_ENTRIES, `fewer than ${MIN_ENTRIES} upstream entries`)
    .parse(JSON.parse(jsonText));
  const entries = deriveEntries(raw).sort(byAi);
  assert(new Set(entries.map((e) => e.ai)).size === entries.length, "duplicate AIs upstream");

  const kinds: KindSpec[] = [
    {
      constName: "Gs1KeyAi",
      doc: "GS1 primary identifier (key) Application Identifiers (type 'I' in the vendored AI table), keyed by derived name.",
      members: deriveMemberNames(entries.filter((e) => e.type === "I")),
    },
    {
      constName: "Gs1QualifierAi",
      doc: "GS1 key-qualifier Application Identifiers (type 'Q' in the vendored AI table), keyed by derived name.",
      members: deriveMemberNames(entries.filter((e) => e.type === "Q")),
    },
    {
      constName: "Gs1DataAttributeAi",
      doc: "GS1 data-attribute (non-key) Application Identifiers (type 'D' in the vendored AI table), keyed by derived name.",
      members: deriveMemberNames(entries.filter((e) => e.type === "D")),
    },
  ];

  const i18nRows = parseI18n(htmlText);
  const retrieved = new Date().toISOString().slice(0, 10);
  const tableMeta: Provenance = {
    retrieved,
    detail: `${entries.length} entries`,
    hash: sha256(jsonText),
  };
  const i18nMeta: Provenance = {
    retrieved,
    detail: `${i18nRows.length} translation rows (${LANGS.join(", ")})`,
    hash: sha256(htmlText),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const outputs: [string, string][] = [
    ["gs1-ai-table.ts", buildTableSource(entries, tableMeta)],
    ["gs1-ai-constants.ts", buildConstantsSource(kinds, tableMeta)],
    ["gs1-ai-i18n.ts", buildI18nSource(i18nRows, i18nMeta)],
  ];
  for (const [file, content] of outputs) {
    writeFileSync(join(OUT_DIR, file), content);
  }

  const counts = Object.fromEntries(
    (["I", "Q", "D", "N"] as const).map((type) => [
      type,
      entries.filter((e) => e.type === type).length,
    ]),
  );
  console.log(
    `generated ${outputs.map(([file]) => file).join(", ")} in ${OUT_DIR}\n` +
      `entries: ${entries.length} (${Object.entries(counts)
        .map(([t, n]) => `${t}=${n}`)
        .join(", ")}), ` +
      `i18n rows: ${i18nRows.length}, retrieved: ${retrieved}`,
  );
}

await main();
