/// <reference lib="dom" />
import { z } from "zod";
import { canonicaliseBaseUrl } from "../shared/permalink-base-url.schema";
import { GS1_AI_TABLE } from "./gs1-ai-table.generated";

/**
 * Zero-dependency GS1 Digital Link helpers, shared by the client and the server.
 *
 * Scope: a GTIN (manufacturer-supplied — open-dpp never mints GS1 identifiers —
 * mod-10 validated, stored normalized to GTIN-14) plus an optional batch (AI `10`)
 * and/or serial (AI `21`), each restricted to GS1's CSET-82 character set and
 * ≤ 20 characters. Granularity is implied by which keys are present.
 */

/** Valid raw GTIN lengths accepted as input (GTIN-8/12/13/14). */
const VALID_GTIN_LENGTHS = new Set([8, 12, 13, 14]);

/** Length of a normalized GTIN. */
export const GTIN14_LENGTH = 14;

const DIGITS_ONLY = /^[0-9]+$/;

/**
 * Validate a GTIN's trailing mod-10 check digit.
 *
 * Uses the standard GS1 algorithm: starting from the rightmost data digit
 * (i.e. excluding the check digit), apply alternating weights 3,1,3,1,…; the
 * check digit is the value that rounds the weighted sum up to a multiple of ten.
 *
 * @param gtin - a digits-only string of any length (≥ 2)
 * @returns true when the final digit is the correct check digit
 */
export function isValidGtinCheckDigit(gtin: string): boolean {
  if (!DIGITS_ONLY.test(gtin) || gtin.length < 2) {
    return false;
  }
  const digits = gtin.split("").map((d) => Number.parseInt(d, 10));
  const checkDigit = digits[digits.length - 1];
  const body = digits.slice(0, -1);

  const sum = body.reduce((acc, digit, i) => {
    const positionFromRight = body.length - 1 - i;
    const weight = positionFromRight % 2 === 0 ? 3 : 1;
    return acc + digit * weight;
  }, 0);
  const computed = (10 - (sum % 10)) % 10;
  return computed === checkDigit;
}

/**
 * Normalize a manufacturer-supplied GTIN to its canonical GTIN-14 form.
 *
 * Trims surrounding whitespace, validates that the value is a digits-only string
 * of a permitted GTIN length with a correct mod-10 check digit, then left-pads
 * with zeros to 14 digits.
 *
 * @throws Error with a descriptive message on invalid characters, length, or check digit.
 */
export function normalizeToGtin14(rawGtin: string): string {
  const gtin = rawGtin.trim();
  if (!DIGITS_ONLY.test(gtin)) {
    throw new Error("GTIN must contain digits only");
  }
  if (!VALID_GTIN_LENGTHS.has(gtin.length)) {
    throw new Error(
      `GTIN must have a valid length (8, 12, 13, or 14 digits); received ${gtin.length}`,
    );
  }
  if (!isValidGtinCheckDigit(gtin)) {
    throw new Error("GTIN has an invalid check digit");
  }
  return gtin.padStart(GTIN14_LENGTH, "0");
}

/**
 * Zod schema for raw GTIN *input*: accepts any valid GTIN length and transforms
 * it into a normalized, check-digit-valid GTIN-14. Use this at write boundaries
 * (backoffice form, create/update request).
 */
export const GtinInputSchema = z.string().transform((value, ctx) => {
  try {
    return normalizeToGtin14(value);
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Invalid GTIN",
    });
    return z.NEVER;
  }
});

export type GtinInput = z.infer<typeof GtinInputSchema>;

/**
 * Zod schema for an already-normalized GTIN-14 (exactly 14 digits, valid check
 * digit). Use this where the value is expected to be canonical (stored value,
 * domain reconstruction, DTO output).
 */
export const Gtin14Schema = z
  .string()
  .length(GTIN14_LENGTH, "GTIN-14 must be exactly 14 digits")
  .regex(DIGITS_ONLY, "GTIN-14 must contain digits only")
  .refine(isValidGtinCheckDigit, { message: "GTIN-14 has an invalid check digit" });

export type Gtin14 = z.infer<typeof Gtin14Schema>;

/**
 * Maximum length of an alphanumeric GS1 component (batch `10`, serial `21`).
 * GS1 General Specifications cap these AIs at 20 characters.
 */
export const GS1_CSET82_MAX_LENGTH = 20;

/**
 * GS1 CSET-82: the 82 characters permitted in alphanumeric AI values. Beyond the
 * 62 alphanumerics (0-9, A-Z, a-z) it adds these 20 special characters:
 * `! " % & ' ( ) * + , - . / : ; < = > ? _`. Anchored, so the whole string must
 * consist only of CSET-82 characters.
 */
const CSET82 = /^[0-9A-Za-z!"%&'()*+,\-./:;<=>?_]+$/;

/**
 * Validate a single alphanumeric GS1 component (batch / serial) against CSET-82
 * and the ≤ 20 character limit. Empty is invalid (an absent component is modeled
 * by omitting it, not by an empty string).
 */
export function isValidCset82Component(value: string): boolean {
  return value.length >= 1 && value.length <= GS1_CSET82_MAX_LENGTH && CSET82.test(value);
}

/**
 * Zod schema for a batch / serial component: a non-empty CSET-82 string of at most
 * 20 characters. Use this at write boundaries (backoffice form, create/update).
 */
export const Cset82ComponentSchema = z
  .string()
  .min(1, "must not be empty")
  .max(GS1_CSET82_MAX_LENGTH, `must be at most ${GS1_CSET82_MAX_LENGTH} characters`)
  .regex(CSET82, "must contain only GS1 CSET-82 characters");

export type Cset82Component = z.infer<typeof Cset82ComponentSchema>;

/**
 * Write-boundary schema for an optional batch / serial. Trims surrounding
 * whitespace and coerces a blank value to `undefined` ("clear this component"); a
 * non-blank value must satisfy CSET-82 and the length cap. Use this on request
 * bodies where omitting or blanking a component means "no batch / serial".
 */
export const Cset82ComponentInputSchema = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? undefined : value))
  .pipe(Cset82ComponentSchema.optional());

/** The GS1 Application Identifier for a GTIN. */
export const GS1_AI_GTIN = "01";
/** The GS1 Application Identifier for a batch / lot number. */
export const GS1_AI_BATCH = "10";
/** The GS1 Application Identifier for a serial number. */
export const GS1_AI_SERIAL = "21";

/**
 * Returns true when `ai` is a known GS1 data-attribute (non-key) Application
 * Identifier — i.e. `type === 'D'` in the vendored GS1 AI table.
 *
 * Returns false for primary identifiers (type I), key qualifiers (type Q),
 * unknown AIs, and any non-string/empty input.
 */
export function isGs1DataAttributeAi(ai: string): boolean {
  return GS1_AI_TABLE[ai]?.type === "D";
}

/** Memoised per-AI compiled regex cache (anchored). */
const _regexCache = new Map<string, RegExp>();

/**
 * Returns true when `value` is a valid value for the given GS1 data-attribute
 * Application Identifier `ai`.
 *
 * Validates by:
 * 1. Looking up `ai` in the vendored GS1 AI table; returns false if absent or
 *    if the entry is not a data attribute (type !== 'D').
 * 2. Rejecting an empty `value` (length must be ≥ 1).
 * 3. Compiling an anchored `RegExp` from the table entry's `regex` fragment,
 *    memoised in a module-level `Map<string, RegExp>`.
 *
 * Pure function, no I/O, no mutation.
 */
export function isValidGs1DataAttributeValue(ai: string, value: string): boolean {
  const entry = GS1_AI_TABLE[ai];
  if (!entry || entry.type !== "D") {
    return false;
  }
  if (value.length < 1) {
    return false;
  }
  let re = _regexCache.get(ai);
  if (!re) {
    re = new RegExp("^(?:" + entry.regex + ")$");
    _regexCache.set(ai, re);
  }
  return re.test(value);
}

/**
 * Build the canonical GS1 data-attribute query string from a map of validated AI → value pairs.
 *
 * - Returns `''` when `attributes` is empty, null, or undefined.
 * - Iterates keys in ascending ASCII (lexicographic) order for deterministic output.
 * - Validates each AI via `isGs1DataAttributeAi` and each value via `isValidGs1DataAttributeValue`;
 *   throws `Error` on the first invalid entry.
 * - Percent-encodes values via `encodeURIComponent`.
 * - Prefixes the result with `'?'` only when at least one pair is present.
 *
 * Pure function, no I/O, no mutation. <30 lines.
 */
export function buildGs1DataAttributeQuery(
  attributes: Record<string, string> | null | undefined,
): string {
  if (!attributes) {
    return "";
  }
  // Use Object.entries (value typed as string) rather than keys + index access, so the
  // helper type-checks under a consumer with noUncheckedIndexedAccess (e.g. apps/client,
  // which type-checks this source directly). Sort ascending by AI for a canonical query.
  const sortedEntries = Object.entries(attributes).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  if (sortedEntries.length === 0) {
    return "";
  }
  const pairs: string[] = [];
  for (const [ai, value] of sortedEntries) {
    if (!isGs1DataAttributeAi(ai)) {
      throw new Error(`"${ai}" is not a known GS1 data-attribute AI`);
    }
    if (!isValidGs1DataAttributeValue(ai, value)) {
      throw new Error(`value for AI "${ai}" is invalid: "${value}"`);
    }
    pairs.push(`${ai}=${encodeURIComponent(value)}`);
  }
  return "?" + pairs.join("&");
}

export interface Gs1DigitalLinkParts {
  /** A GTIN; normalized to GTIN-14 before assembly. */
  gtin: string;
  /** Optional batch / lot (AI `10`), CSET-82, ≤ 20 chars. */
  batch?: string | null;
  /** Optional serial (AI `21`), CSET-82, ≤ 20 chars. */
  serial?: string | null;
  /**
   * Optional GS1 data-attribute map (non-key AIs only). When set, the pairs are
   * sorted in ascending AI order, validated, and appended as a query string after
   * the last path segment. Pass `null` or omit to emit no query string.
   */
  dataAttributes?: Record<string, string> | null;
}

/**
 * Normalize an optional batch/serial input to either a validated component or
 * `undefined`. Trims surrounding whitespace; an empty/blank value is treated as
 * absent.
 *
 * @throws Error when a non-empty value violates CSET-82 or the length cap.
 */
function normalizeOptionalComponent(
  value: string | null | undefined,
  label: string,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!isValidCset82Component(trimmed)) {
    throw new Error(
      `${label} must contain only GS1 CSET-82 characters and be at most ${GS1_CSET82_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}

/**
 * Percent-encode a CSET-82 component for safe inclusion in a Digital Link path
 * segment. `encodeURIComponent` covers the GS1 percent-encoding set (it escapes
 * `/`, `?`, `#`, etc.) while leaving the unreserved/`!'()*` characters intact.
 */
function encodeComponent(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Build the uncompressed, canonical GS1 Digital Link for a GS1 identity.
 *
 * Emits the GTIN path and, when present, appends the batch (AI `10`) and serial
 * (AI `21`) segments in canonical GS1 order `01 -> 10 -> 21`. A blank batch/serial
 * is treated as absent. The resolver base is canonicalised (host lowercased,
 * trailing slash dropped) and any path it carries is preserved; batch/serial
 * values are percent-encoded for the path.
 *
 * @throws Error when the GTIN is invalid or a batch/serial violates CSET-82 / length.
 */
export function buildGs1DigitalLink(resolverBase: string, parts: Gs1DigitalLinkParts): string {
  const gtin14 = normalizeToGtin14(parts.gtin);
  const batch = normalizeOptionalComponent(parts.batch, "Batch");
  const serial = normalizeOptionalComponent(parts.serial, "Serial");
  const base = canonicaliseBaseUrl(resolverBase);

  let url = `${base}/${GS1_AI_GTIN}/${gtin14}`;
  if (batch !== undefined) {
    url += `/${GS1_AI_BATCH}/${encodeComponent(batch)}`;
  }
  if (serial !== undefined) {
    url += `/${GS1_AI_SERIAL}/${encodeComponent(serial)}`;
  }
  url += buildGs1DataAttributeQuery(parts.dataAttributes);
  return url;
}

/**
 * Format a GS1 identity as its human-readable GS1 element string, e.g.
 * `(01) 04006381333931 (10) LOT-42 (21) SN-001`.
 *
 * Each present Application Identifier is rendered as its parenthesised AI followed
 * by the value, in canonical GS1 order `01 -> 10 -> 21`. Unlike the Digital Link,
 * the element string is for human display only, so batch/serial values are emitted
 * verbatim (no percent-encoding). A blank batch/serial is treated as absent.
 *
 * @throws Error when the GTIN is invalid or a batch/serial violates CSET-82 / length.
 */
export function formatGs1ElementString(parts: Gs1DigitalLinkParts): string {
  const gtin14 = normalizeToGtin14(parts.gtin);
  const batch = normalizeOptionalComponent(parts.batch, "Batch");
  const serial = normalizeOptionalComponent(parts.serial, "Serial");

  const segments = [`(${GS1_AI_GTIN}) ${gtin14}`];
  if (batch !== undefined) {
    segments.push(`(${GS1_AI_BATCH}) ${batch}`);
  }
  if (serial !== undefined) {
    segments.push(`(${GS1_AI_SERIAL}) ${serial}`);
  }
  return segments.join(" ");
}
