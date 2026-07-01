import { z } from "zod";
import { isGs1DataAttributeAi, isValidGs1DataAttributeValue } from "./gs1-digital-link";

/**
 * Zod schema for a map of GS1 data-attribute Application Identifiers to their values.
 *
 * Each key must be a known GS1 data-attribute AI (type 'D' in the vendored AI table —
 * i.e. not a primary identifier like "01" or a key qualifier like "10"/"21").
 * Each value must satisfy the format/length rules for the corresponding AI.
 *
 * An empty map `{}` is accepted.
 * Non-object input (array, string, null, undefined) is rejected by the base
 * `z.record` schema before the custom check runs.
 *
 * Pure module: no DOM or Node-only globals required at import time.
 */
export const Gs1DataAttributesSchema = z
  .record(z.string(), z.string())
  .check((ctx) => {
    for (const [ai, value] of Object.entries(ctx.value)) {
      if (!isGs1DataAttributeAi(ai)) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `"${ai}" is not a known GS1 data-attribute AI`,
          path: [ai],
        });
      } else if (!isValidGs1DataAttributeValue(ai, value)) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `value for AI "${ai}" is invalid`,
          path: [ai],
        });
      }
    }
  })
  .meta({ id: "Gs1DataAttributes" });

/** The inferred TypeScript type for a validated GS1 data-attributes map. */
export type Gs1DataAttributes = z.infer<typeof Gs1DataAttributesSchema>;
