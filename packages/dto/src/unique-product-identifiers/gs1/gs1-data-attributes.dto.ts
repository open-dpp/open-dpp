import { z } from "zod";
import { Gs1DataAttributeAi } from "./gs1-ai-constants";
import { isValidGs1DataAttributeValue } from "./gs1-digital-link";

/** Cap on how much of an unknown AI key is echoed back in an error message. */
const MAX_ECHOED_KEY_LENGTH = 50;

const unknownAiMessage = (input: unknown): string => {
  const key = String(input);
  const echoed =
    key.length > MAX_ECHOED_KEY_LENGTH ? `${key.slice(0, MAX_ECHOED_KEY_LENGTH)}…` : key;
  return `"${echoed}" is not a known GS1 data-attribute AI`;
};

/**
 * Zod schema for a single GS1 data-attribute Application Identifier key.
 *
 * The custom error map replaces zod's default enum message, which would join
 * every permitted AI into one multi-kilobyte string.
 */
const Gs1DataAttributeAiSchema = z.enum(Gs1DataAttributeAi, {
  error: (issue) => unknownAiMessage(issue.input),
});

/**
 * Zod schema for a map of GS1 data-attribute Application Identifiers to their values.
 *
 * Keys are constrained to the known GS1 data-attribute AIs (type 'D' in the
 * vendored AI table — i.e. not a primary identifier like "01" or a key
 * qualifier like "10"/"21") via {@link Gs1DataAttributeAi}, so the inferred
 * type is `Partial<Record<Gs1DataAttributeAi, string>>`. Each value must
 * satisfy the format/length rules for the corresponding AI.
 *
 * An empty map `{}` is accepted.
 * Non-object input (array, string, null, undefined) is rejected by the base
 * `z.partialRecord` schema before the custom check runs.
 *
 * Error reporting is keys-first: when a map contains both an unknown AI and an
 * invalid value for a valid AI, only the unknown-key issue is reported (the
 * value check runs only once the base parse succeeds). Among invalid values,
 * only the first (in key order) is reported: a single value check can cost
 * ~100ms on adversarial input (see GS1_DATA_ATTRIBUTE_MAX_LENGTH), so checking
 * every entry would let one request multiply that by the number of entries.
 *
 * Pure module: no DOM or Node-only globals required at import time.
 */
export const Gs1DataAttributesSchema = z
  .partialRecord(Gs1DataAttributeAiSchema, z.string(), {
    error: (issue) => (issue.code === "invalid_key" ? unknownAiMessage(issue.input) : undefined),
  })
  .check((ctx) => {
    for (const [ai, value] of Object.entries(ctx.value)) {
      if (!isValidGs1DataAttributeValue(ai, value)) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `value for AI "${ai}" is invalid`,
          path: [ai],
        });
        return;
      }
    }
  })
  .meta({ id: "Gs1DataAttributes" });

/** The inferred TypeScript type for a validated GS1 data-attributes map. */
export type Gs1DataAttributes = z.infer<typeof Gs1DataAttributesSchema>;
