import { GS1_AI_I18N, type Gs1AiI18nEntry } from "./gs1-ai-i18n";

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

/** Resolve a language cell by BCP 47 primary subtag, falling back to English. */
function pickLanguageCell(entry: Gs1AiI18nEntry, lang: string): string {
  const primary = lang.split("-")[0]?.toLowerCase() ?? "";
  // Own enumerable entries only — a tag like "constructor" must not reach the prototype.
  const cell: string | undefined = Object.entries(entry).find(([key]) => key === primary)?.[1];
  return cell ?? entry.en;
}

/**
 * Resolve the translated description for a GS1 Application Identifier.
 *
 * Lookup chain: exact AI key -> family key ("n"/"s" collapse) -> "91-99"
 * range key. `lang` accepts any BCP 47-ish tag ("de", "de-DE", "DE"); its
 * primary subtag selects the vendored translation, and languages GS1 data
 * doesn't carry fall back to English (every vendored row has English text).
 * Which languages are vendored is an internal detail of this module — app
 * display languages grow independently.
 *
 * Returns `undefined` for unknown AIs and non-AI input — callers fall back to
 * the English `title` from GS1_AI_TABLE as the last resort.
 *
 * Pure function, no I/O, no mutation.
 */
export function getGs1AiDescription(ai: string, lang: string): string | undefined {
  if (!AI_SHAPE.test(ai)) {
    return undefined;
  }
  for (const key of candidateKeys(ai)) {
    const entry = GS1_AI_I18N[key];
    if (entry !== undefined) {
      return pickLanguageCell(entry, lang);
    }
  }
  return undefined;
}
