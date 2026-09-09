/** Status tallies: the derived status of a Criterion is its Assessment's, or Not assessed. */
import { DERIVED_STATUSES, type DerivedStatus } from "./schema";

export type StatusCounts = Record<DerivedStatus, number>;

export const emptyCounts = (): StatusCounts =>
  Object.fromEntries(DERIVED_STATUSES.map((s) => [s, 0])) as StatusCounts;

export const tally = (statuses: readonly DerivedStatus[]): StatusCounts =>
  statuses.reduce(
    (counts, status) => ({ ...counts, [status]: counts[status] + 1 }),
    emptyCounts(),
  );

export const totalOf = (counts: StatusCounts): number =>
  DERIVED_STATUSES.reduce((sum, status) => sum + counts[status], 0);
