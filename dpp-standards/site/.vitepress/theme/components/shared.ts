/** Helpers shared by the conformance components. Pure, no zod, safe for the client bundle. */
import type { StandardMatrix } from "../../../../src/load";
import type { InheritedMap } from "../../../../src/mirrors";
import type {
  Applicability,
  Criterion,
  DerivedStatus,
  Evidence,
  HistoryEntry,
} from "../../../../src/schema";

export const REPO = "https://github.com/open-dpp/open-dpp";

/** Board and legend order: what needs attention first. */
export const STATUS_ORDER: readonly DerivedStatus[] = [
  "Gap",
  "Partial",
  "Met",
  "Not assessed",
  "Not applicable",
];

const STATUS_KEY: Record<DerivedStatus, string> = {
  Met: "met",
  Partial: "partial",
  Gap: "gap",
  "Not applicable": "na",
  "Not assessed": "unassessed",
};
export const badgeClass = (status: DerivedStatus): string => `cm-${STATUS_KEY[status]}`;
export const fillClass = (status: DerivedStatus): string => `cm-fill-${STATUS_KEY[status]}`;

export const APPLICABILITY_LABEL: Record<Applicability, string> = {
  software: "Software",
  mixed: "Mixed",
  operator: "Operator duty",
  commission: "Commission duty",
};

export const TIER_LABEL = {
  A: "EU law",
  B: "Harmonised standard",
  C: "Normative reference",
} as const;

/** Section numbers of research/capability-inventory.md. */
export const AREA_NAMES: Record<number, string> = {
  1: "AAS API surface",
  2: "Serialisation and interop",
  3: "Identifiers",
  4: "Data carriers",
  5: "Access rights",
  6: "Persistence and versioning",
  7: "Registry and discovery",
  8: "Templates and semantic models",
  9: "Traceability",
  10: "Security and integrity",
  11: "Public presentation",
  12: "Conformance artifacts",
  13: "OpenAPI",
};

/** A Mirror's status is its target's (from `StandardMatrix.inherited`); unresolved reads Not assessed. */
export const statusOf = (c: Criterion, inherited: InheritedMap = {}): DerivedStatus =>
  c.assessment?.status ?? inherited[c.id]?.status ?? "Not assessed";

/** A clause the current edition dropped: hidden, and outside every count. */
export const isRetired = (c: Criterion): boolean => c.retiredIn !== undefined;
export const activeCriteria = (criteria: readonly Criterion[]): Criterion[] =>
  criteria.filter((c) => !isRetired(c));

/** A Mirror restates a Criterion of another text and shows that one's latest Assessment. */
export const isMirror = (c: Criterion): boolean => c.mirrors !== undefined;
export const ownCriteria = (criteria: readonly Criterion[]): Criterion[] =>
  activeCriteria(criteria).filter((c) => !isMirror(c));
export const mirrorCriteria = (criteria: readonly Criterion[]): Criterion[] =>
  activeCriteria(criteria).filter(isMirror);

/** Route of a Criterion's row; the slug of a text is its source id in lower case. */
export const criterionPath = (id: string, slug?: string): string =>
  `/standards/${slug ?? id.slice(0, id.indexOf("-")).toLowerCase()}#${id}`;

export const isOrganisational = (c: Criterion): boolean =>
  c.applicability === "operator" || c.applicability === "commission";

export const issueUrl = (n: number): string => `${REPO}/issues/${n}`;
export const commitUrl = (sha: string): string => `${REPO}/commit/${sha}`;

const PATH_LIKE = /^[\w@.-]+(\/[\w@.()[\]-]+)*\/?$/;
/** GitHub link for evidence that points at a repo path, pinned to the assessed commit. */
export const refUrl = (e: Evidence, commit: string): string | undefined =>
  (e.type === "code" || e.type === "test" || e.type === "doc") && PATH_LIKE.test(e.ref)
    ? `${REPO}/blob/${commit}/${e.ref}`
    : undefined;

export const manualDate = (e: Evidence): string | undefined =>
  e.type === "manual" ? e.date : undefined;

export const historyOf = (s: StandardMatrix, id: string): HistoryEntry[] =>
  s.history.filter((h) => h.criterion === id).sort((a, b) => b.date.localeCompare(a.date));

export type StatusCount = { status: DerivedStatus; count: number };
export const countBy = (
  criteria: readonly Criterion[],
  inherited: InheritedMap = {},
): StatusCount[] =>
  STATUS_ORDER.map((status) => ({
    status,
    count: activeCriteria(criteria).filter((c) => statusOf(c, inherited) === status).length,
  }));
