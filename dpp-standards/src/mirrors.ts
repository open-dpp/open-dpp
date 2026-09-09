/**
 * Mirrors: a Criterion with `mirrors: <id>` restates a Criterion of another source with no delta,
 * carries no Assessment and shows the target's latest one (glossary: `CONTEXT.md`, "Mirror").
 * Cross-file resolution for the loader and the retire guard for `matrix:supersede`. Pure.
 * Decided in wayfinder tickets #767 and #829.
 */
import { tally } from "./counts";
import type { Problem, StandardMatrix } from "./load";
import type { Assessment, Criterion, DerivedStatus } from "./schema";

export type Inherited = {
  /** The target: the Criterion whose latest Assessment the Mirror shows. */
  from: string;
  /** Source id and route slug of the target's file, for the link to its row. */
  standard: string;
  slug: string;
  status: DerivedStatus;
  assessment?: Assessment;
};
/** Keyed by Mirror id. */
export type InheritedMap = Record<string, Inherited>;

export const isMirror = (c: Criterion): boolean => c.mirrors !== undefined;
const isActive = (c: Criterion): boolean => c.retiredIn === undefined;

type Located = { criterion: Criterion; standard: StandardMatrix };

const indexById = (standards: readonly StandardMatrix[]): Map<string, Located> =>
  new Map(
    standards.flatMap((standard) =>
      standard.criteria.map((criterion) => [criterion.id, { criterion, standard }] as const),
    ),
  );

/** Why a Mirror may not point at this target; undefined when it may. */
const targetProblem = (mirror: Criterion, target: Criterion): string | undefined => {
  if (target.mirrors !== undefined) {
    return `${mirror.id} mirrors ${target.id}, which is itself a Mirror of ${target.mirrors}; point at ${target.mirrors}`;
  }
  if (target.retiredIn !== undefined) {
    return `${mirror.id} mirrors ${target.id}, retired in ${target.retiredIn}; re-point or retire the Mirror`;
  }
  if (target.applicability !== mirror.applicability) {
    return `${mirror.id} (${mirror.applicability}) mirrors ${target.id} (${target.applicability}); a Mirror binds the same actor, any delta makes it an own Criterion`;
  }
  return undefined;
};

const inheritedOf = ({ criterion, standard }: Located): Inherited => ({
  from: criterion.id,
  standard: standard.standard,
  slug: standard.slug,
  status: criterion.assessment?.status ?? "Not assessed",
  ...(criterion.assessment ? { assessment: criterion.assessment } : {}),
});

type Resolution = { inherited: InheritedMap; problems: Problem[] };

const resolveOne = (standard: StandardMatrix, byId: Map<string, Located>): Resolution =>
  standard.criteria.reduce<Resolution>(
    (acc, c, i) => {
      if (c.mirrors === undefined || !isActive(c)) {
        return acc;
      }
      const problem = (message: string): Resolution => ({
        ...acc,
        problems: [...acc.problems, { file: standard.file, path: `criteria.${i}.mirrors`, message }],
      });
      const target = byId.get(c.mirrors);
      if (!target) {
        return problem(`${c.id} mirrors unknown criterion ${c.mirrors}`);
      }
      const message = targetProblem(c, target.criterion);
      return message === undefined
        ? { ...acc, inherited: { ...acc.inherited, [c.id]: inheritedOf(target) } }
        : problem(message);
    },
    { inherited: {}, problems: [] },
  );

export type ResolvedMirrors = { standards: StandardMatrix[]; problems: Problem[] };

/**
 * Returns new standards with `inherited` and `inheritedCounts` filled from the targets' latest
 * Assessments, and a problem per Mirror whose target is unknown, a Mirror itself, retired or bound
 * to another actor. Retired Mirrors are skipped: outside every count, like every retired Criterion.
 */
export const resolveMirrors = (standards: readonly StandardMatrix[]): ResolvedMirrors => {
  const byId = indexById(standards);
  const resolved = standards.map((standard) => {
    const { inherited, problems } = resolveOne(standard, byId);
    const inheritedCounts = tally(Object.values(inherited).map((i) => i.status));
    return { standard: { ...standard, inherited, inheritedCounts }, problems };
  });
  return {
    standards: resolved.map((r) => r.standard),
    problems: resolved.flatMap((r) => r.problems),
  };
};

export type Blocking = { id: string; mirrors: string[] };

/** The active Mirrors of each named Criterion: retiring the target would leave them dangling. */
export const blockingMirrors = (
  ids: readonly string[],
  standards: readonly StandardMatrix[],
): Blocking[] => {
  const mirrors = standards.flatMap((s) => s.criteria.filter((c) => isActive(c) && isMirror(c)));
  return ids.flatMap((id) => {
    const names = mirrors.filter((c) => c.mirrors === id).map((c) => c.id);
    return names.length > 0 ? [{ id, mirrors: names }] : [];
  });
};
