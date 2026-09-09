/**
 * The reasons a Criterion enters the scope of a Validation Run. Zod-free so the preview site's
 * client bundle can share it; `schema-runs.ts` builds the schema on top. Decided in #754 and #829.
 */
export const SCOPE_REASONS = [
  "text change",
  "evidence changed",
  "open gap",
  "not assessed",
  "check regression",
  "manual",
] as const;
export type BaseReason = (typeof SCOPE_REASONS)[number];

/** A derived entry: the Mirror of a Criterion in scope. The Assessment is written on the target. */
export const MIRROR_REASON_PREFIX = "mirror of ";
export type MirrorReason = `${typeof MIRROR_REASON_PREFIX}${string}`;
export type ScopeReason = BaseReason | MirrorReason;

export const mirrorReason = (target: string): MirrorReason => `${MIRROR_REASON_PREFIX}${target}`;
export const isMirrorReason = (reason: string): reason is MirrorReason =>
  reason.startsWith(MIRROR_REASON_PREFIX);

/** Key the derived entries are counted under in summaries. */
export const MIRROR_REASON_KEY = "mirror";
export type ReasonKey = BaseReason | typeof MIRROR_REASON_KEY;
export const reasonKey = (reason: ScopeReason): ReasonKey =>
  isMirrorReason(reason) ? MIRROR_REASON_KEY : reason;
