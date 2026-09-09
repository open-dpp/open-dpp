/**
 * Reads and validates every Conformance Matrix file. Shared by the preview site's data loader
 * (`site/.vitepress/matrix.data.ts`), its config (sidebar, dynamic routes), the CI check (`check.ts`)
 * and the playbook scripts (`affected.ts`, `run.ts`, `supersede.ts`, `watch.ts`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { z } from "zod";
import { emptyCounts, type StatusCounts, tally } from "./counts";
import { type InheritedMap, resolveMirrors } from "./mirrors";
import {
  type HistoryEntry,
  HistoryFileSchema,
  longQuotedSpans,
  type MatrixFile,
  MatrixFileSchema,
  type Source,
  SourcesFileSchema,
} from "./schema";
import {
  PENDING_REVIEWER,
  type Run,
  RunsFileSchema,
  type WatchState,
  WatchStateSchema,
} from "./schema-runs";

export const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_DIR = path.resolve(PACKAGE_DIR, "..");
export const MATRIX_DIR = path.join(PACKAGE_DIR, "matrix");
export const HISTORY_DIR = path.join(PACKAGE_DIR, "history");
export const SOURCES_FILE = path.join(PACKAGE_DIR, "sources.yaml");
export const RUNS_FILE = path.join(PACKAGE_DIR, "runs.yaml");
export const WATCH_STATE_FILE = path.join(PACKAGE_DIR, "watch-state.yaml");

export type Problem = { file: string; path: string; message: string; code?: string };

/** The reviewer-of-record gate: fails `matrix:check`, but the site renders the run as pending. */
export const PENDING_REVIEWER_CODE = "pending-reviewer";
export const hardProblems = (problems: Problem[]): Problem[] =>
  problems.filter((p) => p.code !== PENDING_REVIEWER_CODE);
export { emptyCounts, type StatusCounts } from "./counts";

export type StandardMatrix = MatrixFile & {
  /** File name without extension, lower-cased: the route segment (`espr`). */
  slug: string;
  file: string;
  source: Source;
  history: HistoryEntry[];
  /** Counts over the active own Criteria: Mirrors and retired Criteria excluded. */
  counts: StatusCounts;
  /** Per active Mirror, the target's latest Assessment, resolved across files by `resolveMirrors`. */
  inherited: InheritedMap;
  /** Counts of the statuses the active Mirrors inherit, kept apart from `counts`. */
  inheritedCounts: StatusCounts;
  retired: number;
  /** Latest own assessment date across the file, if any Criterion was assessed. */
  lastAssessed?: string;
};

export type ConformanceData = {
  sources: Source[];
  standards: StandardMatrix[];
  runs: Run[];
  watch?: WatchState;
};

export type LoadResult = { data: ConformanceData; problems: Problem[] };

export const relative = (file: string): string => path.relative(REPO_DIR, file);

const listYaml = (dir: string): string[] =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".yaml"))
        .sort()
        .map((f) => path.join(dir, f))
    : [];

const zodProblems = (file: string, error: z.ZodError): Problem[] =>
  error.issues.map((issue) => ({
    file: relative(file),
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));

const parseFile = <T>(file: string, schema: z.ZodType<T>, problems: Problem[]): T | undefined => {
  let raw: unknown;
  try {
    raw = parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    problems.push({
      file: relative(file),
      path: "",
      message: `YAML parse error: ${String(error)}`,
    });
    return undefined;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    problems.push(...zodProblems(file, result.error));
    return undefined;
  }
  return result.data;
};

/** Optional file: absent means "none yet", which is valid. */
const parseOptionalFile = <T>(
  file: string,
  schema: z.ZodType<T>,
  problems: Problem[],
): T | undefined => (fs.existsSync(file) ? parseFile(file, schema, problems) : undefined);

/** Own Assessments only: a Mirror's status is its target's and is counted under `inheritedCounts`. */
export const countStatuses = (matrix: MatrixFile): StatusCounts =>
  tally(
    matrix.criteria
      .filter((c) => c.retiredIn === undefined && c.mirrors === undefined)
      .map((c) => c.assessment?.status ?? "Not assessed"),
  );

const lastAssessedOf = (matrix: MatrixFile): string | undefined =>
  matrix.criteria
    .map((c) => c.assessment?.date)
    .filter((d): d is string => d !== undefined)
    .sort()
    .at(-1);

const copyrightProblems = (file: string, matrix: MatrixFile): Problem[] =>
  matrix.criteria.flatMap((c, i) =>
    [c.paraphrase, c.assessment?.notes ?? ""].flatMap((text, j) =>
      longQuotedSpans(text).map((span) => ({
        file: relative(file),
        path: `criteria.${i}.${j === 0 ? "paraphrase" : "assessment.notes"}`,
        message: `gated text quoted verbatim (${span.slice(0, 40)}…); paraphrase it instead`,
      })),
    ),
  );

const historyProblems = (file: string, history: HistoryEntry[], matrix: MatrixFile): Problem[] => {
  const ids = new Set(matrix.criteria.map((c) => c.id));
  return history
    .filter((entry) => !ids.has(entry.criterion))
    .map((entry) => ({
      file: relative(file),
      path: `entries.${entry.criterion}`,
      message: `history entry for unknown criterion ${entry.criterion}`,
    }));
};

/** Cross-file rules of runs.yaml: known ids, and the reviewer-of-record gate. */
const runProblems = (
  runs: Run[],
  standards: StandardMatrix[],
  sources: Map<string, Source>,
): Problem[] => {
  const criterionIds = new Set(standards.flatMap((s) => s.criteria.map((c) => c.id)));
  const file = relative(RUNS_FILE);
  return runs.flatMap((run, i) => {
    const at = (field: string): string => `runs.${i}.${field}`;
    const pending: Problem[] =
      run.reviewer === PENDING_REVIEWER
        ? [
            {
              file,
              path: at("reviewer"),
              message: `run ${run.id}: reviewer of record is pending; the reviewer signs before the PR merges`,
              code: PENDING_REVIEWER_CODE,
            },
          ]
        : [];
    const unknownSources = run.sources
      .filter((id) => !sources.has(id))
      .map((id) => ({ file, path: at("sources"), message: `unknown source "${id}"` }));
    const unknownCriteria = run.scope
      .filter((entry) => !criterionIds.has(entry.id))
      .map((entry) => ({ file, path: at("scope"), message: `unknown criterion ${entry.id}` }));
    return [...pending, ...unknownSources, ...unknownCriteria];
  });
};

type HistoryByStandard = Map<string, { file: string; entries: HistoryEntry[] }>;

const buildStandard = (
  file: string,
  matrix: MatrixFile,
  sources: Map<string, Source>,
  histories: HistoryByStandard,
  problems: Problem[],
): StandardMatrix | undefined => {
  const source = sources.get(matrix.standard);
  if (!source) {
    problems.push({
      file: relative(file),
      path: "standard",
      message: `unknown standard "${matrix.standard}" (declare it in sources.yaml)`,
    });
    return undefined;
  }
  if (source.access === "gated") {
    problems.push(...copyrightProblems(file, matrix));
  }
  const history = histories.get(matrix.standard);
  if (history) {
    problems.push(...historyProblems(history.file, history.entries, matrix));
  }
  return {
    ...matrix,
    slug: path.basename(file, ".yaml").toLowerCase(),
    file: relative(file),
    source,
    history: history?.entries ?? [],
    counts: countStatuses(matrix),
    inherited: {},
    inheritedCounts: emptyCounts(),
    retired: matrix.criteria.filter((c) => c.retiredIn !== undefined).length,
    lastAssessed: lastAssessedOf(matrix),
  };
};

export const loadConformance = (): LoadResult => {
  const problems: Problem[] = [];
  const sourcesFile = parseFile(SOURCES_FILE, SourcesFileSchema, problems);
  const sources = new Map((sourcesFile?.sources ?? []).map((s) => [s.id, s]));

  const histories: HistoryByStandard = new Map(
    listYaml(HISTORY_DIR).flatMap((file) => {
      const parsed = parseFile(file, HistoryFileSchema, problems);
      return parsed ? [[parsed.standard, { file, entries: parsed.entries }] as const] : [];
    }),
  );

  const loaded = listYaml(MATRIX_DIR).flatMap((file) => {
    const matrix = parseFile(file, MatrixFileSchema, problems);
    const standard = matrix && buildStandard(file, matrix, sources, histories, problems);
    return standard ? [standard] : [];
  });
  // Mirrors point across files, so they resolve only once every matrix file is in.
  const mirrored = resolveMirrors(loaded);
  problems.push(...mirrored.problems);
  const standards = mirrored.standards;

  const withMatrix = new Set(standards.map((s) => s.standard));
  for (const [id, history] of histories) {
    if (!withMatrix.has(id)) {
      problems.push({
        file: relative(history.file),
        path: "standard",
        message: `history without a matrix file for ${id}`,
      });
    }
  }

  const runs = parseOptionalFile(RUNS_FILE, RunsFileSchema, problems)?.runs ?? [];
  problems.push(...runProblems(runs, standards, sources));
  const watch = parseOptionalFile(WATCH_STATE_FILE, WatchStateSchema, problems);

  return { data: { sources: [...sources.values()], standards, runs, watch }, problems };
};

export const formatProblems = (problems: Problem[]): string =>
  problems.map((p) => `${p.file}${p.path ? ` › ${p.path}` : ""}: ${p.message}`).join("\n");
