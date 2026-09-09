/**
 * The Check report (`apps/e2e/conformance-report.json`, written by the conformance project's
 * reporter) and its fold into a matrix file: check evidence on every assessed Criterion a Check tags.
 * Pure; `fold.ts` reads and writes the files. Decided in wayfinder ticket #755.
 */
import { type Document, isMap, isSeq, type YAMLMap, type YAMLSeq } from "yaml";
import { z } from "zod";
import { CHECK_RESULTS, checkId, commitSha, criterionId, isoDate } from "./schema";

export const CHECK_STATUSES = [...CHECK_RESULTS, "skipped"] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

export const CheckResultSchema = z
  .object({
    id: checkId,
    title: z.string().min(1),
    /** Criterion ids the Check is tagged with (`@ESPR-Art10(1)(a)` without the `@`). */
    criteria: z.array(criterionId).min(1),
    status: z.enum(CHECK_STATUSES),
    duration: z.number().nonnegative().optional(),
    error: z.string().optional(),
  })
  .strict();
export type CheckResultEntry = z.infer<typeof CheckResultSchema>;

export const CheckReportSchema = z
  .object({
    /** open-dpp commit the Instance under test was built from. */
    commit: commitSha,
    date: isoDate,
    baseUrl: z.url(),
    /** Ids of the conformance subject (passport, permalink, GTIN) the Checks ran against. */
    subject: z.record(z.string(), z.string()).optional(),
    checks: z.array(CheckResultSchema),
  })
  .strict();
export type CheckReport = z.infer<typeof CheckReportSchema>;

export type Touch = { criterion: string; check: string };
export type FoldResult = {
  matrix: Document;
  added: Touch[];
  updated: Touch[];
  failing: Touch[];
  /** Tagged Criteria without an Assessment: the report cannot evidence them yet. */
  unassessed: Touch[];
};

const criteriaOf = (doc: Document): YAMLSeq => {
  const seq = doc.get("criteria");
  if (!isSeq(seq)) {
    throw new Error('matrix file has no "criteria" list');
  }
  return seq;
};

const findCriterion = (criteria: YAMLSeq, id: string): YAMLMap | undefined =>
  criteria.items.find((item): item is YAMLMap => isMap(item) && item.get("id") === id);

const evidenceOf = (doc: Document, assessment: YAMLMap): YAMLSeq => {
  const existing = assessment.get("evidence");
  if (isSeq(existing)) {
    return existing;
  }
  const seq = doc.createNode([]) as YAMLSeq;
  assessment.set("evidence", seq);
  return seq;
};

const findCheckEvidence = (evidence: YAMLSeq, ref: string): YAMLMap | undefined =>
  evidence.items.find(
    (item): item is YAMLMap =>
      isMap(item) && item.get("type") === "check" && item.get("ref") === ref,
  );

type Fold = Omit<FoldResult, "matrix">;
const empty: Fold = { added: [], updated: [], failing: [], unassessed: [] };
const merge = (a: Fold, b: Partial<Fold>): Fold => ({
  added: [...a.added, ...(b.added ?? [])],
  updated: [...a.updated, ...(b.updated ?? [])],
  failing: [...a.failing, ...(b.failing ?? [])],
  unassessed: [...a.unassessed, ...(b.unassessed ?? [])],
});

const foldOne = (
  doc: Document,
  criterion: YAMLMap,
  check: CheckResultEntry,
  date: string,
): Partial<Fold> => {
  if (check.status === "skipped") {
    return {};
  }
  const touch: Touch = { criterion: String(criterion.get("id")), check: check.id };
  const assessment = criterion.get("assessment", true);
  if (!isMap(assessment)) {
    return { unassessed: [touch] };
  }
  const failing = check.status === "failed" ? [touch] : [];
  const evidence = evidenceOf(doc, assessment);
  const existing = findCheckEvidence(evidence, check.id);
  if (existing) {
    existing.set("result", check.status);
    existing.set("date", date);
    return { updated: [touch], failing };
  }
  evidence.add(doc.createNode({ type: "check", ref: check.id, result: check.status, date }));
  return { added: [touch], failing };
};

/**
 * Returns a new matrix document with the report folded in. Checks tagging Criteria of other
 * standards are ignored; a tag naming an unknown Criterion of this standard throws (a typo in a tag),
 * and so does a tag naming a Mirror: a Check evidences the target, the Mirror shows it.
 * Never touches `status`: a failed check on a Met row is caught by the schema at the next check.
 */
export const foldReport = (matrix: Document, report: CheckReport): FoldResult => {
  const doc = matrix.clone();
  const standard = String(doc.get("standard"));
  const criteria = criteriaOf(doc);
  const result = report.checks.reduce<Fold>((acc, check) => {
    const own = check.criteria.filter((id) => id.startsWith(`${standard}-`));
    return own.reduce((inner, id) => {
      const criterion = findCriterion(criteria, id);
      if (!criterion) {
        throw new Error(`unknown criterion ${id} (tagged by check ${check.id})`);
      }
      const target = criterion.get("mirrors");
      if (target !== undefined) {
        throw new Error(
          `check ${check.id} tags ${id}, a Mirror of ${String(target)}; tag the target instead`,
        );
      }
      return merge(inner, foldOne(doc, criterion, check, report.date));
    }, acc);
  }, empty);
  return { matrix: doc, ...result };
};

/** Standards a report touches: the id prefixes of every tagged Criterion. */
export const standardsOf = (report: CheckReport): string[] => [
  ...new Set(report.checks.flatMap((c) => c.criteria.map((id) => id.slice(0, id.indexOf("-"))))),
];
