/**
 * The scope rule of a Validation Run: which Criteria a trigger touches, and why. Pure; the git
 * lookup is injected so the rule is testable without a repository. Decided in wayfinder ticket #754;
 * the mirror rule (every Mirror of a Criterion in scope joins it as derived) in #829.
 */
import type { StandardMatrix } from "./load";
import { mirrorReason, type ReasonKey, reasonKey, type ScopeReason } from "./reasons";
import type { Criterion } from "./schema";
import type { ScopeEntry } from "./schema-runs";

export type ScopeRequest =
  | { kind: "text"; sources: readonly string[] }
  | { kind: "code"; commit: string; sources?: readonly string[] }
  | { kind: "check"; checkIds: readonly string[] }
  | { kind: "manual"; criteria: readonly string[] };

/** Files changed between two commits, restricted to the given repo paths. */
export type ChangedFiles = (
  from: string,
  to: string,
  paths: readonly string[],
) => readonly string[];

const PATH_EVIDENCE = new Set(["code", "test", "doc"]);

/** Repo paths the Assessment's evidence points at, without `:line` or `#L` suffixes. */
export const evidencePaths = (c: Criterion): string[] =>
  (c.assessment?.evidence ?? [])
    .filter((e) => PATH_EVIDENCE.has(e.type))
    .map((e) => e.ref.replace(/[:#].*$/, ""));

const isActive = (c: Criterion): boolean => c.retiredIn === undefined;
/** Own Criteria carry their Assessment; a Mirror follows its target and enters as derived only. */
const isOwn = (c: Criterion): boolean => c.mirrors === undefined;
const isOpenGap = (c: Criterion): boolean =>
  c.assessment?.status === "Partial" || c.assessment?.status === "Gap";

const activeCriteria = (standards: readonly StandardMatrix[]): Criterion[] =>
  standards.flatMap((s) => s.criteria.filter(isActive));

const entry = (c: Criterion, reason: ScopeReason): ScopeEntry => ({ id: c.id, reason });

/** A text change touches every Criterion of the text and every law row it operationalises. */
const textScope = (
  standards: readonly StandardMatrix[],
  sources: readonly string[],
): ScopeEntry[] => {
  const changed = new Set(sources);
  return standards.flatMap((s) =>
    s.criteria
      .filter(isActive)
      .filter((c) => changed.has(s.standard) || c.operationalisedBy.some((id) => changed.has(id)))
      .map((c) => entry(c, "text change")),
  );
};

const codeReason = (
  c: Criterion,
  commit: string,
  changed: ChangedFiles,
): ScopeReason | undefined => {
  if (!c.assessment) {
    return "not assessed";
  }
  const paths = evidencePaths(c);
  if (paths.length > 0 && changed(c.assessment.commit, commit, paths).length > 0) {
    return "evidence changed";
  }
  return isOpenGap(c) ? "open gap" : undefined;
};

/** A code change touches unassessed Criteria, Criteria whose evidence moved, and every open Gap. */
const codeScope = (
  standards: readonly StandardMatrix[],
  commit: string,
  sources: readonly string[] | undefined,
  changed: ChangedFiles,
): ScopeEntry[] => {
  const wanted = sources ? new Set(sources) : undefined;
  return activeCriteria(standards.filter((s) => !wanted || wanted.has(s.standard)))
    .filter(isOwn)
    .flatMap((c) => {
      const reason = codeReason(c, commit, changed);
      return reason ? [entry(c, reason)] : [];
    });
};

const checkScope = (
  standards: readonly StandardMatrix[],
  checkIds: readonly string[],
): ScopeEntry[] => {
  const failing = new Set(checkIds);
  return activeCriteria(standards)
    .filter(isOwn)
    .filter((c) =>
      (c.assessment?.evidence ?? []).some((e) => e.type === "check" && failing.has(e.ref)),
    )
    .map((c) => entry(c, "check regression"));
};

/** Naming a Mirror by hand means re-assessing its target; the Mirror then joins as derived. */
const manualScope = (
  standards: readonly StandardMatrix[],
  criteria: readonly string[],
): ScopeEntry[] => {
  const byId = new Map(standards.flatMap((s) => s.criteria.map((c) => [c.id, c] as const)));
  const unknown = criteria.filter((id) => !byId.has(id));
  if (unknown.length > 0) {
    throw new Error(`unknown criteria: ${unknown.join(", ")}`);
  }
  const targets = criteria.map((id) => byId.get(id)?.mirrors ?? id);
  return [...new Set(targets)].map((id) => ({ id, reason: "manual" }));
};

const baseScope = (
  standards: readonly StandardMatrix[],
  request: ScopeRequest,
  changed: ChangedFiles,
): ScopeEntry[] => {
  switch (request.kind) {
    case "text":
      return textScope(standards, request.sources);
    case "code":
      return codeScope(standards, request.commit, request.sources, changed);
    case "check":
      return checkScope(standards, request.checkIds);
    case "manual":
      return manualScope(standards, request.criteria);
  }
};

/**
 * The mirror rule: every active Mirror of a Criterion in scope joins the scope after the base
 * entries, reason `mirror of <target>`, unless it is already in scope on its own (its text changed).
 */
const withMirrors = (
  standards: readonly StandardMatrix[],
  entries: readonly ScopeEntry[],
): ScopeEntry[] => {
  const inScope = new Set(entries.map((e) => e.id));
  const derived = activeCriteria(standards).flatMap((c) =>
    c.mirrors !== undefined && inScope.has(c.mirrors) && !inScope.has(c.id)
      ? [entry(c, mirrorReason(c.mirrors))]
      : [],
  );
  return [...entries, ...derived];
};

export const computeScope = (
  standards: readonly StandardMatrix[],
  request: ScopeRequest,
  changed: ChangedFiles,
): ScopeEntry[] => withMirrors(standards, baseScope(standards, request, changed));

/** Source ids the entries belong to, in first-seen order (the id prefix before the first `-`). */
export const sourcesOf = (entries: readonly ScopeEntry[]): string[] => [
  ...new Set(entries.map((e) => e.id.slice(0, e.id.indexOf("-")))),
];

export type ReasonCounts = Partial<Record<ReasonKey, number>>;

/** Entries per reason; the derived `mirror of …` entries are counted together as `mirror`. */
export const countReasons = (entries: readonly ScopeEntry[]): ReasonCounts =>
  entries.reduce<ReasonCounts>((counts, e) => {
    const key = reasonKey(e.reason);
    return { ...counts, [key]: (counts[key] ?? 0) + 1 };
  }, {});
