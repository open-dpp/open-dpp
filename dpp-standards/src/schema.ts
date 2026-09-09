/**
 * Zod schema of the Conformance Matrix files in `dpp-standards/`.
 *
 * Three file kinds:
 * - `sources.yaml`            the register of every assessed text (law, EN, normative reference)
 * - `matrix/<STANDARD>.yaml`  one file per text: its Criteria and, per Criterion, the latest Assessment
 * - `history/<STANDARD>.yaml` earlier Assessments, moved here by a re-validation (append-only)
 *
 * Vocabulary: `CONTEXT.md`, section "Conformance Review". Rules: `dpp-standards/README.md`.
 */
import { z } from "zod";

export const STATUSES = ["Met", "Partial", "Gap", "Not applicable"] as const;
export const DERIVED_STATUSES = [...STATUSES, "Not assessed"] as const;
export const APPLICABILITIES = ["software", "mixed", "operator", "commission"] as const;
export const EVIDENCE_TYPES = ["code", "test", "check", "doc", "manual"] as const;
export const TIERS = ["A", "B", "C"] as const;
export const ACCESS_LEVELS = ["public", "gated"] as const;
export const BATTERY_ACCESS_CLASSES = ["public", "legitimate interest", "authorities"] as const;

/** Number of areas in `research/capability-inventory.md`. */
export const CAPABILITY_AREA_COUNT = 13;
export const PARAPHRASE_MAX_LENGTH = 600;
/** Longest quoted span (in words) tolerated inside a paraphrase of a gated text. */
export const MAX_QUOTED_WORDS = 8;

export type Status = (typeof STATUSES)[number];
export type DerivedStatus = (typeof DERIVED_STATUSES)[number];
export type Applicability = (typeof APPLICABILITIES)[number];
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected a date as YYYY-MM-DD");
export const commitSha = z
  .string()
  .regex(/^[0-9a-f]{7,40}$/, "expected a git commit SHA (7 to 40 hex characters)");
/** `ESPR`, `EN18219`, `ISO15459`: upper-case letters and digits only. */
export const sourceId = z
  .string()
  .regex(/^[A-Z][A-Z0-9]*$/, "expected a source id like ESPR or EN18219");
/** `<source id>-<clause>`: `ESPR-Art10(1)(c)`, `EN18219-6.2.3`. */
export const criterionId = z
  .string()
  .regex(/^[A-Z][A-Z0-9]*-[A-Za-z0-9()._-]+$/, "expected a criterion id like ESPR-Art10(1)(c)");

const evidenceBase = {
  /** Repo path (`apps/main/src/...`), test file, check id, docs path, or a description for manual. */
  ref: z.string().min(1),
  note: z.string().optional(),
};

export const CHECK_RESULTS = ["passed", "failed"] as const;
export type CheckResult = (typeof CHECK_RESULTS)[number];
/** `<class>.<name>`: `resolver.redirect-published`. Stable across runs; the tags carry the Criteria. */
export const checkId = z
  .string()
  .regex(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/, "expected a check id like resolver.redirect-published");

export const EvidenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("code"), ...evidenceBase }).strict(),
  z.object({ type: z.literal("test"), ...evidenceBase }).strict(),
  /** Written by `matrix:fold` from a Check report; `result` and `date` are the last run's. */
  z
    .object({
      type: z.literal("check"),
      ...evidenceBase,
      ref: checkId,
      result: z.enum(CHECK_RESULTS),
      date: isoDate,
    })
    .strict(),
  z.object({ type: z.literal("doc"), ...evidenceBase }).strict(),
  z.object({ type: z.literal("manual"), ...evidenceBase, date: isoDate }).strict(),
]);
export type Evidence = z.infer<typeof EvidenceSchema>;

const assessmentFields = {
  date: isoDate,
  /** open-dpp commit on `main` the Assessment was made against. */
  commit: commitSha,
  /** Who assessed: a person, or `agent:<name>` for a playbook run. */
  validator: z.string().min(1),
  status: z.enum(STATUSES),
  /** True when the requirement is operational, so Met also needs operator documentation. */
  operational: z.boolean().default(false),
  evidence: z.array(EvidenceSchema).default([]),
  notes: z.string().optional(),
  /** Number of the `conformance` issue tracking a Partial or Gap. */
  gapIssue: z.number().int().positive().optional(),
};

type AssessmentInput = {
  status: Status;
  operational: boolean;
  evidence: Evidence[];
  notes?: string;
  gapIssue?: number;
};

const assessmentRules = (a: AssessmentInput, ctx: z.RefinementCtx): void => {
  const types = new Set(a.evidence.map((e) => e.type));
  if (a.status === "Met") {
    if (!types.has("code")) {
      ctx.addIssue({ code: "custom", path: ["evidence"], message: "Met needs a code pointer" });
    }
    if (!types.has("test") && !types.has("check") && !types.has("manual")) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence"],
        message: "Met needs a test, an automated check or a dated manual verification",
      });
    }
    const failed = a.evidence.filter((e) => e.type === "check" && e.result === "failed");
    if (failed.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence"],
        message: `Met with a failed check (${failed.map((e) => e.ref).join(", ")}); re-assess`,
      });
    }
    if (a.operational && !types.has("doc")) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence"],
        message: "Met on an operational requirement needs operator documentation (doc evidence)",
      });
    }
  }
  if ((a.status === "Partial" || a.status === "Gap") && a.gapIssue === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["gapIssue"],
      message: `${a.status} needs a gapIssue (the conformance issue tracking it)`,
    });
  }
  if (a.status === "Not applicable" && !a.notes) {
    ctx.addIssue({
      code: "custom",
      path: ["notes"],
      message: "Not applicable needs notes giving the reason",
    });
  }
};

export const AssessmentSchema = z.object(assessmentFields).strict().superRefine(assessmentRules);
export type Assessment = z.infer<typeof AssessmentSchema>;

export const CriterionSchema = z
  .object({
    id: criterionId,
    /** Id of an entry in the file's `sections` (article, annex or clause group). */
    section: z.string().min(1),
    /** Human clause reference as printed in the text: `Art. 10(1)(c)`, `6.2.3`. */
    clause: z.string().min(1),
    /** The requirement in our own words. Never a verbatim quote of a gated text. */
    paraphrase: z.string().min(1).max(PARAPHRASE_MAX_LENGTH),
    applicability: z.enum(APPLICABILITIES),
    areas: z.array(z.number().int().min(1).max(CAPABILITY_AREA_COUNT)).default([]),
    /** Source ids of the standards that operationalise this clause (law rows only). */
    operationalisedBy: z.array(sourceId).default([]),
    /** Batteries Regulation Annex XIII access class, where the text fixes one. */
    accessClass: z.enum(BATTERY_ACCESS_CLASSES).optional(),
    /**
     * Edition of the text that dropped this clause. A retired Criterion keeps its id and history,
     * carries no Assessment, is hidden by the renderer and excluded from counts.
     */
    retiredIn: z.string().min(1).optional(),
    /**
     * Id of the Criterion of another source this clause restates with no delta: a Mirror. It carries
     * no Assessment and shows the target's latest one; a clause with any delta is an own Criterion.
     */
    mirrors: criterionId.optional(),
    /** Latest Assessment. Absent until the Criterion has been assessed once. */
    assessment: AssessmentSchema.optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.mirrors !== undefined && c.assessment) {
      ctx.addIssue({
        code: "custom",
        path: ["assessment"],
        message: `a Mirror carries no assessment; it shows the latest Assessment of ${c.mirrors} (a clause with any delta is an own Criterion, not a Mirror)`,
      });
    }
    if (c.retiredIn !== undefined && c.assessment) {
      ctx.addIssue({
        code: "custom",
        path: ["assessment"],
        message:
          "a retired criterion carries no assessment (move it to history with matrix:supersede)",
      });
    }
    const organisational = c.applicability === "operator" || c.applicability === "commission";
    if (organisational && c.assessment && c.assessment.status !== "Not applicable") {
      ctx.addIssue({
        code: "custom",
        path: ["assessment", "status"],
        message: `applicability "${c.applicability}" is assessed Not applicable by rule`,
      });
    }
  });
export type Criterion = z.infer<typeof CriterionSchema>;

export const SectionSchema = z.object({ id: z.string().min(1), title: z.string().min(1) }).strict();
export type Section = z.infer<typeof SectionSchema>;

export const MatrixFileSchema = z
  .object({
    standard: sourceId,
    /** The exact text version the Criteria were extracted from (CELEX, EN edition, release). */
    edition: z.string().min(1),
    extractedFrom: z.string().optional(),
    extractedAt: isoDate.optional(),
    sections: z.array(SectionSchema).min(1),
    criteria: z.array(CriterionSchema).min(1),
  })
  .strict()
  .superRefine((m, ctx) => {
    const sectionIds = new Set(m.sections.map((s) => s.id));
    const seen = new Set<string>();
    m.criteria.forEach((c, i) => {
      if (!c.id.startsWith(`${m.standard}-`)) {
        ctx.addIssue({
          code: "custom",
          path: ["criteria", i, "id"],
          message: `criterion id must start with "${m.standard}-"`,
        });
      }
      if (seen.has(c.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["criteria", i, "id"],
          message: `duplicate criterion id ${c.id}`,
        });
      }
      seen.add(c.id);
      if (!sectionIds.has(c.section)) {
        ctx.addIssue({
          code: "custom",
          path: ["criteria", i, "section"],
          message: `unknown section "${c.section}" (declare it in sections)`,
        });
      }
      if (c.mirrors?.startsWith(`${m.standard}-`)) {
        ctx.addIssue({
          code: "custom",
          path: ["criteria", i, "mirrors"],
          message: `a Mirror points at a Criterion of another source, not of ${m.standard}`,
        });
      }
    });
  });
export type MatrixFile = z.infer<typeof MatrixFileSchema>;

export const HistoryEntrySchema = z
  .object({ criterion: criterionId, ...assessmentFields })
  .strict()
  .superRefine(assessmentRules);
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const HistoryFileSchema = z
  .object({ standard: sourceId, entries: z.array(HistoryEntrySchema) })
  .strict();
export type HistoryFile = z.infer<typeof HistoryFileSchema>;

export const SourceSchema = z
  .object({
    id: sourceId,
    /** A = EU law, B = harmonised JTC 24 standard, C = normative reference of an A or B text. */
    tier: z.enum(TIERS),
    title: z.string().min(1),
    /** Short label for navigation: `ESPR 2024/1781`. Falls back to `reference`. */
    short: z.string().min(1).optional(),
    /** Official reference: `Regulation (EU) 2024/1781`, `EN 18219:2026`. */
    reference: z.string().min(1),
    publisher: z.string().min(1),
    /** Edition or version the matrix file for this source must be extracted from. */
    edition: z.string().min(1),
    /** Lifecycle stage in one line: in force since, published, ratified, drafting. */
    stage: z.string().min(1),
    access: z.enum(ACCESS_LEVELS),
    url: z.url(),
    /** The OJ citation granting presumption of conformity, for Tier B. */
    citedInOj: z.string().optional(),
    /** Where the gated copy lives locally (git-ignored `standards/` folder). */
    localFile: z.string().optional(),
    normativeReferences: z.array(sourceId).default([]),
    /** Re-validation trigger: where to look and what change to look for. */
    watch: z
      .object({ url: z.url(), lookFor: z.string().min(1) })
      .strict()
      .optional(),
  })
  .strict();
export type Source = z.infer<typeof SourceSchema>;

export const SourcesFileSchema = z
  .object({ sources: z.array(SourceSchema).min(1) })
  .strict()
  .superRefine((f, ctx) => {
    const ids = new Set<string>();
    f.sources.forEach((s, i) => {
      if (ids.has(s.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sources", i, "id"],
          message: `duplicate source id ${s.id}`,
        });
      }
      ids.add(s.id);
    });
  });
export type SourcesFile = z.infer<typeof SourcesFileSchema>;

/** Quoted spans longer than MAX_QUOTED_WORDS inside a text, for the copyright rule on gated sources. */
export const longQuotedSpans = (text: string): string[] => {
  const spans = text.match(/"([^"]+)"|“([^”]+)”/g) ?? [];
  return spans.filter((span) => span.trim().split(/\s+/).length > MAX_QUOTED_WORDS);
};
