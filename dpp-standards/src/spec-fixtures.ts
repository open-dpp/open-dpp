/** Builders for the pure specs (scope rule, Mirrors): plain objects shaped like the loader's output. */
import { countStatuses, emptyCounts, type StandardMatrix } from "./load";
import type { Assessment, Criterion, Source } from "./schema";

export const source = (id: string): Source => ({
  id,
  tier: "A",
  title: id,
  reference: id,
  publisher: "test",
  edition: "1",
  stage: "published",
  access: "public",
  url: "https://example.org",
  normativeReferences: [],
});

export const criterion = (id: string, extra: Partial<Criterion> = {}): Criterion => ({
  id,
  section: "s",
  clause: "c",
  paraphrase: "p",
  applicability: "software",
  areas: [],
  operationalisedBy: [],
  ...extra,
});

export const assessment = (status: Assessment["status"], refs: string[] = []): Assessment => ({
  date: "2026-09-01",
  commit: "aaaaaaa",
  validator: "test",
  status,
  operational: false,
  evidence: refs.map((ref) => ({ type: "code" as const, ref })),
});

export const standard = (id: string, criteria: Criterion[]): StandardMatrix => ({
  standard: id,
  edition: "1",
  sections: [{ id: "s", title: "S" }],
  criteria,
  slug: id.toLowerCase(),
  file: `matrix/${id}.yaml`,
  source: source(id),
  history: [],
  counts: countStatuses({ standard: id, edition: "1", sections: [], criteria }),
  inherited: {},
  inheritedCounts: emptyCounts(),
  retired: 0,
});
