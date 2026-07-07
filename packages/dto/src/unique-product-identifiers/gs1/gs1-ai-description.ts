import { GS1_AI_I18N, type Gs1AiI18nEntry, type Gs1AiI18nLang } from "./gs1-ai-i18n";

/**
 * Wide-typed view for lookups keyed by a runtime string (GS1_AI_I18N itself
 * has literal keys via `as const satisfies`).
 */
const I18N: Readonly<Record<string, Gs1AiI18nEntry>> = GS1_AI_I18N;

/** A syntactically valid GS1 Application Identifier: 2-4 digits. */
const AI_SHAPE = /^\d{2,4}$/;

/**
 * Candidate translation keys for an AI, in lookup order. GS1 keys its
 * translation rows three ways (see gs1-ai-i18n.ts): exact AI strings, family
 * keys with the trailing digit collapsed to "n" (decimal-place families like
 * 310n, sequence families like 723n) or "s" (703s), and the "91-99" range for
 * the company-internal AIs.
 */
function candidateKeys(ai: string): string[] {
  const keys = [ai];
  if (ai.length >= 3) {
    keys.push(`${ai.slice(0, -1)}n`, `${ai.slice(0, -1)}s`);
  }
  if (ai.length === 2 && ai >= "91" && ai <= "99") {
    keys.push("91-99");
  }
  return keys;
}

/**
 * Resolve the translated description for a GS1 Application Identifier.
 *
 * Lookup chain: exact AI key -> family key ("n"/"s" collapse) -> "91-99"
 * range key; within the found row, the requested language falls back to
 * English (every vendored row carries English text).
 *
 * Returns `undefined` for unknown AIs and non-AI input — callers fall back to
 * the English `title` from GS1_AI_TABLE as the last resort.
 *
 * Pure function, no I/O, no mutation.
 */
export function getGs1AiDescription(ai: string, lang: Gs1AiI18nLang): string | undefined {
  if (!AI_SHAPE.test(ai)) {
    return undefined;
  }
  for (const key of candidateKeys(ai)) {
    const entry = I18N[key];
    if (entry !== undefined) {
      return entry[lang] ?? entry.en;
    }
  }
  return undefined;
}
