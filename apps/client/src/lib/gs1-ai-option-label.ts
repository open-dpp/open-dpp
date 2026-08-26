import { getGs1AiDescription, type Gs1AiTableEntry } from "@open-dpp/dto";

/**
 * Localized GS1 AI description for the given BCP 47 tag (e.g. the vue-i18n
 * locale), falling back to the table's English title for AIs without a
 * vendored translation row.
 */
export function gs1AiDescriptionOrTitle(entry: Gs1AiTableEntry, lang: string): string {
  return getGs1AiDescription(entry.ai, lang) ?? entry.title;
}

/** Select-option label: "<ai> — <localized description>". */
export function gs1AiOptionLabel(entry: Gs1AiTableEntry, lang: string): string {
  return `${entry.ai} — ${gs1AiDescriptionOrTitle(entry, lang)}`;
}
