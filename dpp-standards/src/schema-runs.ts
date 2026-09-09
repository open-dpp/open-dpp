/**
 * Zod schema of the two Validation Run files in `dpp-standards/`:
 * - `runs.yaml`        one entry per Validation Run, newest last; written by `matrix:run`
 * - `watch-state.yaml` the Cellar acts the watch has already seen, each with a disposition
 *
 * Vocabulary: `CONTEXT.md`, section "Reviews (shared)". Procedures: `dpp-standards/PLAYBOOK.md`.
 */
import { z } from "zod";
import { MIRROR_REASON_PREFIX, SCOPE_REASONS } from "./reasons";
import { commitSha, criterionId, isoDate, sourceId } from "./schema";

export { SCOPE_REASONS, type ScopeReason } from "./reasons";

export const TRIGGER_KINDS = ["text", "code", "check", "manual"] as const;
export const WATCH_DISPOSITIONS = [
  "baseline",
  "extracted",
  "registered",
  "out of scope",
  "pending decision",
] as const;
/** `reviewer` value the agent writes; the reviewer of record replaces it before the PR merges. */
export const PENDING_REVIEWER = "pending";
/** `validator` value of every Assessment a playbook run writes. */
export const AGENT_VALIDATOR = "agent:conformance-review";

export type TriggerKind = (typeof TRIGGER_KINDS)[number];
export type WatchDisposition = (typeof WATCH_DISPOSITIONS)[number];

/** `<date>-<slug>[-<n>]`: `2026-09-20-en18239`, `2026-10-01-all-2`. */
export const runId = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9+]+(?:-\d+)?$/, "expected a run id like 2026-09-20-en18239");

/** A base reason, or the derived `mirror of <criterion id>` (the Mirror of a Criterion in scope). */
export const scopeReason = z
  .enum(SCOPE_REASONS)
  .or(z.templateLiteral([MIRROR_REASON_PREFIX, criterionId]));

export const ScopeEntrySchema = z.object({ id: criterionId, reason: scopeReason }).strict();
export type ScopeEntry = z.infer<typeof ScopeEntrySchema>;

export const TriggerSchema = z
  .object({ kind: z.enum(TRIGGER_KINDS), detail: z.string().min(1) })
  .strict();

export const RunSchema = z
  .object({
    id: runId,
    date: isoDate,
    trigger: TriggerSchema,
    /** Number of the "Validation Run requested" issue the workflow opened, if any. */
    requestedBy: z.number().int().positive().optional(),
    /** open-dpp commit on `main` the run assessed against. */
    commit: commitSha,
    sources: z.array(sourceId).default([]),
    /** Every Criterion the run touched and why (computed by matrix:affected). */
    scope: z.array(ScopeEntrySchema).default([]),
    validator: z.string().min(1),
    /** Reviewer of record; `pending` until a human signs, which the check refuses to pass. */
    reviewer: z.string().min(1),
    pr: z.number().int().positive().optional(),
    adversarialReview: z
      .object({ blockingObjections: z.number().int().min(0), comment: z.url().optional() })
      .strict()
      .optional(),
    watch: z
      .object({ cellarNew: z.array(z.string()).default([]), notes: z.string().optional() })
      .strict()
      .optional(),
    notes: z.string().optional(),
  })
  .strict();
export type Run = z.infer<typeof RunSchema>;

export const RunsFileSchema = z
  .object({ runs: z.array(RunSchema) })
  .strict()
  .superRefine((f, ctx) => {
    const ids = new Set<string>();
    f.runs.forEach((r, i) => {
      if (ids.has(r.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["runs", i, "id"],
          message: `duplicate run id ${r.id}`,
        });
      }
      ids.add(r.id);
    });
  });
export type RunsFile = z.infer<typeof RunsFileSchema>;

export const WatchEntrySchema = z
  .object({
    celex: z.string().min(1),
    date: isoDate,
    title: z.string().min(1),
    disposition: z.enum(WATCH_DISPOSITIONS),
    /** Source id the act became (`extracted`, `registered`). */
    source: sourceId.optional(),
    /** Id of the Validation Run that classified the act. */
    run: runId.optional(),
  })
  .strict();
export type WatchEntry = z.infer<typeof WatchEntrySchema>;

export const WatchStateSchema = z
  .object({
    cellar: z
      .object({
        endpoint: z.url(),
        /** SPARQL query file, relative to `dpp-standards/`. */
        query: z.string().min(1),
        seen: z.array(WatchEntrySchema),
      })
      .strict(),
  })
  .strict();
export type WatchState = z.infer<typeof WatchStateSchema>;
