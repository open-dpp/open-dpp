/**
 * Moves the latest Assessment of a Criterion into the history file (append-only) and, on a new
 * edition, marks a dropped clause retired. Works on YAML documents so comments survive. Pure: the
 * callers own reading and writing the files.
 */
import { Document, isMap, isSeq, type YAMLMap, type YAMLSeq } from "yaml";

export type SupersedeResult = {
  matrix: Document;
  history: Document;
  moved: string[];
  retired: string[];
  skipped: string[];
};

export const newHistoryDocument = (standard: string): Document => {
  const doc = new Document({ standard, entries: [] });
  doc.commentBefore = ` Earlier Assessments of ${standard}, moved here by matrix:supersede. Append-only: never edit or delete an entry.`;
  return doc;
};

const seqAt = (doc: Document, key: string): YAMLSeq => {
  const node = doc.get(key);
  if (!isSeq(node)) {
    throw new Error(`document has no "${key}" list`);
  }
  return node;
};

const findCriterion = (criteria: YAMLSeq, id: string): YAMLMap | undefined =>
  criteria.items.find((item): item is YAMLMap => isMap(item) && item.get("id") === id);

/** Ids of the Criteria that currently carry an Assessment. */
export const assessedIds = (matrix: Document): string[] =>
  seqAt(matrix, "criteria")
    .items.filter((item): item is YAMLMap => isMap(item) && item.has("assessment"))
    .map((item) => String(item.get("id")));

/**
 * Returns new documents: the matrix without the named Assessments (and with `retiredIn` set when
 * `retireIn` is given), the history with those Assessments appended. Unknown ids throw.
 */
export const supersede = (
  matrix: Document,
  history: Document,
  ids: readonly string[],
  retireIn?: string,
): SupersedeResult => {
  const nextMatrix = matrix.clone();
  const nextHistory = history.clone();
  const criteria = seqAt(nextMatrix, "criteria");
  const entries = seqAt(nextHistory, "entries");
  const moved: string[] = [];
  const retired: string[] = [];
  const skipped: string[] = [];
  for (const id of ids) {
    const criterion = findCriterion(criteria, id);
    if (!criterion) {
      throw new Error(`unknown criterion ${id}`);
    }
    const target = criterion.get("mirrors");
    if (target !== undefined && retireIn === undefined) {
      throw new Error(
        `${id} is a Mirror of ${String(target)} and carries no Assessment; supersede ${String(target)} instead`,
      );
    }
    const assessment = criterion.get("assessment", true);
    if (isMap(assessment)) {
      entries.add(nextHistory.createNode({ criterion: id, ...assessment.toJSON() }));
      criterion.delete("assessment");
      moved.push(id);
    }
    if (retireIn !== undefined) {
      criterion.set("retiredIn", retireIn);
      retired.push(id);
    } else if (!isMap(assessment)) {
      skipped.push(id);
    }
  }
  return { matrix: nextMatrix, history: nextHistory, moved, retired, skipped };
};

/** Serialisation that leaves untouched lines as they were: no folding, two-space indent. */
export const toYaml = (doc: Document): string => doc.toString({ lineWidth: 0, indent: 2 });
