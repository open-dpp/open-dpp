/**
 * The mechanical half of the standards watch: the Cellar SPARQL query of `research/eurlex-dpp-acts.rq`,
 * diffed against the acts `watch-state.yaml` has already seen. Pure; `watch.ts` does the fetch.
 */
import { z } from "zod";

export type CellarRow = { celex: string; date: string; title: string };

const binding = z.object({ value: z.string() });
const SparqlJson = z.object({
  results: z.object({
    bindings: z.array(z.object({ celex: binding, date: binding, title: binding })),
  }),
});

/** Rows of a `application/sparql-results+json` answer; the date is cut to YYYY-MM-DD. */
export const parseSparqlJson = (json: unknown): CellarRow[] =>
  SparqlJson.parse(json).results.bindings.map((b) => ({
    celex: b.celex.value,
    date: b.date.value.slice(0, 10),
    title: b.title.value.replace(/\s+/g, " ").trim(),
  }));

export const newRows = (
  seen: readonly { celex: string }[],
  rows: readonly CellarRow[],
): CellarRow[] => {
  const known = new Set(seen.map((s) => s.celex));
  return rows.filter((r) => !known.has(r.celex));
};

const cellarUrl = (celex: string): string =>
  `http://publications.europa.eu/resource/celex/${celex}`;

/** Markdown for the "Validation Run requested" issue. */
export const toMarkdown = (rows: readonly CellarRow[]): string =>
  rows.length === 0
    ? "No act newer than the watch state.\n"
    : [
        "| CELEX | Date | Title |",
        "| --- | --- | --- |",
        ...rows.map((r) => `| [${r.celex}](${cellarUrl(r.celex)}) | ${r.date} | ${r.title} |`),
        "",
      ].join("\n");
